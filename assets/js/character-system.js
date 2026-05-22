/**
 * Character System
 * Manages character personas and personalized messages
 */

class CharacterSystem {
    constructor(characterId = null) {
        this.characterId = characterId;
        this.character = null;
        this.isLoaded = false;

        if (characterId) {
            this.loadCharacter(characterId);
        }
    }

    /**
     * Load character data from JSON file
     * @param {string} characterId - Character ID (anna, maxim, knopych, klavochka)
     * @returns {Promise<void>}
     */
    async loadCharacter(characterId) {
        this.characterId = characterId;

        try {
            const response = await fetch(`data/characters/${characterId}.json`);

            if (!response.ok) {
                throw new Error(`Failed to load character: ${response.status}`);
            }

            this.character = await response.json();
            this.isLoaded = true;

            console.log(`Character loaded: ${this.character.name} (${this.character.emoji})`);
        } catch (error) {
            console.error(`Failed to load character ${characterId}:`, error);

            // Fallback to default character data
            this.character = this.getDefaultCharacter(characterId);
            this.isLoaded = false;
        }
    }

    /**
     * Get default character data (fallback)
     * @param {string} characterId
     * @returns {Object}
     */
    getDefaultCharacter(characterId) {
        const defaults = {
            anna: {
                id: 'anna',
                name: 'Анна',
                emoji: '👩‍🏫',
                role: 'Учительница печати',
                messages: {
                    lessonStart: ['Привет! Готов к новому уроку? 💪'],
                    goodProgress: ['Отлично! Продолжай в том же духе! 🚀'],
                    tooManyErrors: ['Не спеши! Лучше медленно, но правильно 🎯'],
                    lessonCompleteSuccess: ['Красава! Переходим к следующему? 🚀'],
                    errorLimitExceeded: ['Попробуем еще раз? 💪'],
                    levelUnlocked: ['Новый уровень открыт! 🎉'],
                    welcome: ['Привет! Я Анна — твой наставник по печати. Поехали! 🎯']
                }
            },
            maxim: {
                id: 'maxim',
                name: 'Максим',
                emoji: '👨‍💼',
                role: 'Опытный наставник',
                messages: {
                    lessonStart: ['Начинаем. Сосредоточься на технике 🎯'],
                    goodProgress: ['Превосходно! Так держать! ⚡'],
                    tooManyErrors: ['Слишком торопишься. Притормози 🎯'],
                    lessonCompleteSuccess: ['Отлично! Следующий уровень будет сложнее ⚡'],
                    errorLimitExceeded: ['Не получилось. Попробуй еще раз 💼'],
                    levelUnlocked: ['Новый уровень разблокирован! ✅'],
                    welcome: ['Приветствую! Я Максим — твой наставник. Поехали! 🎯']
                }
            },
            knopych: {
                id: 'knopych',
                name: 'Кнопыч',
                emoji: '🤖',
                role: 'Робот-клавиша',
                messages: {
                    lessonStart: ['Поехали! Новый квест начинается! 🎮'],
                    goodProgress: ['ОГО! Ты огонь! 🔥'],
                    tooManyErrors: ['Эй-эй! Не спеши, дружище! 🤖'],
                    lessonCompleteSuccess: ['КРАСАВА! СУПЕР! 🎉'],
                    errorLimitExceeded: ['Retry? 🔄'],
                    levelUnlocked: ['УРА! Новый уровень открыт! 🎉'],
                    welcome: ['Привет! Я Кнопыч! Поехали в бой! 🎮🚀']
                }
            },
            klavochka: {
                id: 'klavochka',
                name: 'Клавочка',
                emoji: '🎨',
                role: 'Добрая помощница',
                messages: {
                    lessonStart: ['Привет! Начинаем новый урок? 💖'],
                    goodProgress: ['Умничка! Так держать! ⭐'],
                    tooManyErrors: ['Не спеши, солнышко! 🌸'],
                    lessonCompleteSuccess: ['Молодец! Три звездочки! 💖'],
                    errorLimitExceeded: ['Повторим? 💫'],
                    levelUnlocked: ['УРА! Новый уровень открыт! 🎉💖'],
                    welcome: ['Привет! Я Клавочка! Давай учиться вместе! ✨🌈']
                }
            }
        };

        return defaults[characterId] || defaults.anna;
    }

    /**
     * Get message for a specific situation
     * @param {string} situation - Situation type (lessonStart, goodProgress, etc.)
     * @param {Object} variables - Variables to interpolate ({name}, {wpm}, etc.)
     * @returns {string}
     */
    getMessage(situation, variables = {}) {
        if (!this.character) {
            return '';
        }

        // Get messages array for this situation
        const messages = this.character.messages[situation];

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            console.warn(`No messages found for situation: ${situation}`);
            return '';
        }

        // Select random message
        const template = this.selectRandom(messages);

        // Interpolate variables
        return this.interpolate(template, variables);
    }

    /**
     * Interpolate variables in template string
     * @param {string} template - Template with {variable} placeholders
     * @param {Object} variables - Variable values
     * @returns {string}
     */
    interpolate(template, variables = {}) {
        return template.replace(/{(\w+)}/g, (match, key) => {
            if (variables.hasOwnProperty(key)) {
                return variables[key];
            }
            return match; // Keep placeholder if variable not found
        });
    }

    /**
     * Select random element from array
     * @param {Array} array
     * @returns {*}
     */
    selectRandom(array) {
        if (!Array.isArray(array) || array.length === 0) {
            return '';
        }
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Show toast notification with character message
     * @param {string} situation - Situation type
     * @param {Object} variables - Variables to interpolate
     * @param {number} duration - Duration in milliseconds (default 3000)
     */
    showToast(situation, variables = {}, duration = 3000) {
        const message = this.getMessage(situation, variables);

        if (!message) {
            return;
        }

        // Use ToastManager if available, otherwise fallback to console
        if (window.toastManager) {
            window.toastManager.show(message, this.character.emoji, duration);
        } else {
            console.log(`${this.character.emoji} ${this.character.name}: ${message}`);
        }
    }

    /**
     * Get character info
     * @returns {Object}
     */
    getCharacterInfo() {
        if (!this.character) {
            return null;
        }

        return {
            id: this.character.id,
            name: this.character.name,
            emoji: this.character.emoji,
            role: this.character.role
        };
    }

    /**
     * Check if character is loaded
     * @returns {boolean}
     */
    isReady() {
        return this.isLoaded && this.character !== null;
    }
}

// Initialize CharacterSystem from user profile when DOM is ready.
// Триггер на старт урока теперь живёт в main.js (lessonStart хук),
// здесь оставлен только bootstrap по сохранённому профилю.
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        try {
            const storageKey = (window.Settings && window.Settings.get('storage.keys.userProfile', 'typing_trainer_user_profile'))
                || 'typing_trainer_user_profile';
            const userProfile = JSON.parse(localStorage.getItem(storageKey));

            if (userProfile && userProfile.character) {
                window.characterSystem = new CharacterSystem();
                window.characterSystem.loadCharacter(userProfile.character).then(() => {
                    console.log('CharacterSystem initialized for:', userProfile.name);
                    document.dispatchEvent(new CustomEvent('typingtrainer:characterReady', {
                        detail: { profile: userProfile }
                    }));
                });
            }
        } catch (error) {
            console.error('Failed to initialize CharacterSystem:', error);
        }
    }, 200);
});

// Export for other modules
window.CharacterSystem = CharacterSystem;
