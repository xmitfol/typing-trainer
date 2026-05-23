/**
 * Onboarding System
 * Handles user profile setup on first visit
 */

class OnboardingManager {
    constructor() {
        this.userProfile = {
            name: '',
            character: '',
            gender: '',
            ageGroup: '',
            keyboardType: 'classic', // default
            language: 'ru', // default
            onboardingCompleted: false,
            createdAt: null
        };

        this.elements = {};
        this.init();
    }

    init() {
        // Bind DOM elements
        this.bindElements();

        // Check if onboarding is needed
        const existingProfile = this.loadProfile();

        if (!existingProfile || !existingProfile.onboardingCompleted) {
            // Show onboarding
            this.showOnboarding();
            this.setupEventListeners();
        } else {
            // User already completed onboarding
            this.userProfile = existingProfile;
            console.log('User profile loaded:', this.userProfile);
        }
    }

    bindElements() {
        this.elements = {
            overlay: document.getElementById('onboardingOverlay'),
            form: document.getElementById('onboardingForm'),
            nameInput: document.getElementById('userName'),
            nameHint: document.getElementById('nameHint'),
            submitButton: document.getElementById('submitOnboarding'),

            // Welcome modal
            welcomeModal: document.getElementById('welcomeModal'),
            welcomeCharacter: document.getElementById('welcomeCharacter'),
            welcomeTitle: document.getElementById('welcomeTitle'),
            welcomeMessage: document.getElementById('welcomeMessage'),
            welcomeButton: document.getElementById('welcomeButton'),

            // Selection card groups
            profileCards: document.querySelectorAll('.profile-cards .selection-card'),
            keyboardCards: document.querySelectorAll('.keyboard-cards .selection-card'),
            languageCards: document.querySelectorAll('.language-cards .selection-card')
        };
    }

    setupEventListeners() {
        // Name input validation
        this.elements.nameInput.addEventListener('input', () => this.validateForm());
        this.elements.nameInput.addEventListener('blur', () => this.validateName());

        // Profile card selection
        this.elements.profileCards.forEach(card => {
            card.addEventListener('click', (e) => this.selectCard(e.currentTarget, 'profile'));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectCard(e.currentTarget, 'profile');
                }
            });
        });

        // Keyboard card selection
        this.elements.keyboardCards.forEach(card => {
            if (!card.classList.contains('disabled')) {
                card.addEventListener('click', (e) => this.selectCard(e.currentTarget, 'keyboard'));
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.selectCard(e.currentTarget, 'keyboard');
                    }
                });
            }
        });

        // Language card selection
        this.elements.languageCards.forEach(card => {
            if (!card.classList.contains('disabled')) {
                card.addEventListener('click', (e) => this.selectCard(e.currentTarget, 'language'));
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.selectCard(e.currentTarget, 'language');
                    }
                });
            }
        });

        // Form submission
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitOnboarding();
        });

        // Welcome modal button
        this.elements.welcomeButton.addEventListener('click', () => this.closeWelcome());

        // ESC to close welcome modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.welcomeModal.classList.contains('active')) {
                this.closeWelcome();
            }
        });
    }

    showOnboarding() {
        setTimeout(() => {
            this.elements.overlay.classList.add('active');
        }, 100);
    }

    hideOnboarding() {
        this.elements.overlay.classList.remove('active');
        setTimeout(() => {
            this.elements.overlay.style.display = 'none';
        }, 500);
    }

    selectCard(card, type) {
        // Find the parent container
        const container = card.closest('.selection-cards');

        // Remove 'selected' from all cards in this group
        container.querySelectorAll('.selection-card').forEach(c => {
            c.classList.remove('selected');
            c.setAttribute('aria-selected', 'false');
        });

        // Add 'selected' to clicked card
        card.classList.add('selected');
        card.setAttribute('aria-selected', 'true');

        // Update profile data
        if (type === 'profile') {
            this.userProfile.character = card.dataset.character;
            this.userProfile.gender = card.dataset.gender;
            this.userProfile.ageGroup = card.dataset.gender === 'child' ? 'child' : 'adult';
        } else if (type === 'keyboard') {
            this.userProfile.keyboardType = card.dataset.keyboard;
        } else if (type === 'language') {
            this.userProfile.language = card.dataset.language;
        }

        // Validate form
        this.validateForm();
    }

    validateName() {
        const name = this.elements.nameInput.value.trim();
        const namePattern = /^[а-яА-ЯёЁa-zA-Z\s]+$/; // Only letters (Cyrillic + Latin)

        if (name.length === 0) {
            this.elements.nameHint.textContent = 'Минимум 2 символа, максимум 30';
            this.elements.nameHint.classList.remove('error-message');
            this.elements.nameInput.classList.remove('error');
            return false;
        }

        if (name.length < 2) {
            this.elements.nameHint.textContent = 'Имя слишком короткое (минимум 2 символа)';
            this.elements.nameHint.classList.add('error-message');
            this.elements.nameInput.classList.add('error');
            return false;
        }

        if (name.length > 30) {
            this.elements.nameHint.textContent = 'Имя слишком длинное (максимум 30 символов)';
            this.elements.nameHint.classList.add('error-message');
            this.elements.nameInput.classList.add('error');
            return false;
        }

        if (!namePattern.test(name)) {
            this.elements.nameHint.textContent = 'Используйте только буквы';
            this.elements.nameHint.classList.add('error-message');
            this.elements.nameInput.classList.add('error');
            return false;
        }

        // Valid name
        this.elements.nameHint.textContent = 'Отлично! ✓';
        this.elements.nameHint.classList.remove('error-message');
        this.elements.nameInput.classList.remove('error');
        this.userProfile.name = name;
        return true;
    }

    validateForm() {
        const nameValid = this.validateName();
        const profileSelected = this.userProfile.character !== '';
        const keyboardSelected = this.userProfile.keyboardType !== '';
        const languageSelected = this.userProfile.language !== '';

        const formValid = nameValid && profileSelected && keyboardSelected && languageSelected;

        // Enable/disable submit button
        this.elements.submitButton.disabled = !formValid;

        return formValid;
    }

    submitOnboarding() {
        if (!this.validateForm()) {
            return;
        }

        // Mark as completed
        this.userProfile.onboardingCompleted = true;
        this.userProfile.createdAt = new Date().toISOString();

        // Save to LocalStorage
        this.saveProfile();

        // Hide onboarding
        this.hideOnboarding();

        // Show welcome modal
        setTimeout(() => {
            this.showWelcome();
        }, 600);
    }

    showWelcome() {
        const characterData = this.getCharacterData();

        // Update welcome modal content
        this.elements.welcomeCharacter.textContent = characterData.emoji;
        this.elements.welcomeTitle.textContent = `${characterData.name} говорит:`;

        // Get welcome message with variables
        const welcomeMessage = this.getWelcomeMessage();
        this.elements.welcomeMessage.textContent = welcomeMessage;

        // Show modal
        setTimeout(() => {
            this.elements.welcomeModal.classList.add('active');
        }, 100);
    }

    closeWelcome() {
        this.elements.welcomeModal.classList.remove('active');

        // Apply keyboard layout class to virtual keyboard
        setTimeout(() => {
            this.applyKeyboardLayout();
        }, 300);

        // Запускаем первый урок после закрытия приветствия
        document.dispatchEvent(new CustomEvent('typingtrainer:onboardingComplete', {
            detail: { profile: this.userProfile }
        }));
    }

    getWelcomeMessage() {
        const { name, keyboardType, character } = this.userProfile;
        const characterData = this.getCharacterData();

        // Keyboard type translation
        const keyboardTypes = {
            classic: 'классическая клавиатура',
            laptop: 'ноутбук',
            ergonomic: 'эргономическая клавиатура'
        };

        const keyboardTypeText = keyboardTypes[keyboardType] || keyboardType;

        // Character-specific welcome messages
        const welcomeMessages = {
            anna: `Привет, ${name}! Я Анна — твой персональный наставник по печати. Вижу, у тебя ${keyboardTypeText} — учту это в своих советах! Готов начать свой путь к мастерству слепой печати? Помни: точность важнее скорости! 🎯`,

            maxim: `${name}, приветствую! Я Максим — твой наставник по слепой печати. Вижу, у тебя ${keyboardTypeText} — будем учитывать это в процессе обучения. Готова начать? Помни главное правило: качество важнее количества. Поехали! 🎯`,

            knopych: `Привет, ${name}! Я Кнопыч — робот-клавиша! 🤖 Вижу, у тебя ${keyboardTypeText} — круто! Готов пройти самый крутой квест по печати? Мы будем сражаться с буквами и побеждать! Помни: главное не скорость, а точность! Поехали! 🎮🚀`,

            klavochka: `Привет, ${name}! Я Клавочка — твоя добрая помощница! 🎨💖 У тебя ${keyboardTypeText} — запомнила! Готова начать волшебное путешествие в мир быстрой печати? Мы будем учиться вместе, и у нас все получится! Помни: главное — стараться! Поехали! ✨🌈`
        };

        return welcomeMessages[character] || `Привет, ${name}! Начнем обучение! 🚀`;
    }

    getCharacterData() {
        const { character } = this.userProfile;

        const characters = {
            anna: { name: 'Анна', emoji: '👩‍🏫', role: 'Учительница печати' },
            maxim: { name: 'Максим', emoji: '👨‍💼', role: 'Опытный наставник' },
            knopych: { name: 'Кнопыч', emoji: '🤖', role: 'Робот-клавиша' },
            klavochka: { name: 'Клавочка', emoji: '🎨', role: 'Добрая помощница' }
        };

        return characters[character] || { name: 'Наставник', emoji: '👋', role: 'Помощник' };
    }

    applyKeyboardLayout() {
        // Ставим класс на КОНТЕЙНЕР, чтобы CSS мог скрыть .right-section (numpad+arrows+nav)
        // в режимах laptop / ergonomic.
        const container = document.querySelector('.keyboard-container');
        if (!container) return;

        container.classList.remove('layout-classic', 'layout-laptop', 'layout-ergonomic');
        container.classList.add(`layout-${this.userProfile.keyboardType}`);

        console.log(`Keyboard layout applied: ${this.userProfile.keyboardType}`);
    }

    getStorageKey() {
        return (window.Settings && window.Settings.get('storage.keys.userProfile', 'typing_trainer_user_profile'))
            || 'typing_trainer_user_profile';
    }

    saveProfile() {
        try {
            localStorage.setItem(this.getStorageKey(), JSON.stringify(this.userProfile));
            console.log('User profile saved:', this.userProfile);
        } catch (error) {
            console.error('Failed to save profile to LocalStorage:', error);
            alert('Не удалось сохранить профиль. Прогресс может быть потерян.');
        }
    }

    loadProfile() {
        try {
            const profileData = localStorage.getItem(this.getStorageKey());
            if (profileData) {
                return JSON.parse(profileData);
            }
        } catch (error) {
            console.error('Failed to load profile from LocalStorage:', error);
        }
        return null;
    }

    // Public method to get current user profile
    getProfile() {
        return this.userProfile;
    }

    // Public method to reset onboarding (for testing/settings)
    resetOnboarding() {
        try {
            localStorage.removeItem(this.getStorageKey());
            location.reload();
        } catch (error) {
            console.error('Failed to reset onboarding:', error);
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.onboardingManager = new OnboardingManager();
});

// Export for other modules
window.OnboardingManager = OnboardingManager;
