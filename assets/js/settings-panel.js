// assets/js/settings-panel.js
// Простая модалка настроек: смена наставника, сброс прогресса, полный сброс.
// Открывается через gear-кнопку (#settingsGearBtn) в правом-верхнем углу.

const CHARACTER_OPTIONS = [
    { id: 'anna',      name: 'Анна',     emoji: '👩‍🏫', role: 'Учительница печати' },
    { id: 'maxim',     name: 'Максим',  emoji: '👨‍💼', role: 'Опытный наставник' },
    { id: 'knopych',   name: 'Кнопыч',  emoji: '🤖',   role: 'Робот-клавиша' },
    { id: 'klavochka', name: 'Клавочка', emoji: '🎨',  role: 'Добрая помощница' },
];

function profileKey() {
    return (window.Settings && window.Settings.get('storage.keys.userProfile'))
        || 'typing_trainer_user_profile';
}

function readProfile() {
    try {
        const raw = localStorage.getItem(profileKey());
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}

function writeProfile(p) {
    try { localStorage.setItem(profileKey(), JSON.stringify(p)); }
    catch (e) { /* silent */ }
}

class SettingsPanel {
    constructor() {
        this.modal = null;
        this.gearBtn = null;
        this.init();
    }

    init() {
        this.gearBtn = document.getElementById('settingsGearBtn');
        this.modal = document.getElementById('settingsModal');
        if (!this.gearBtn || !this.modal) return;

        this.gearBtn.addEventListener('click', () => this.open());

        // Close on backdrop click + ESC + close button
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) this.close();
        });
        const closeBtn = this.modal.querySelector('.settings-close');
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    }

    open() {
        this.renderContent();
        this.modal.classList.add('active');
    }

    close() {
        this.modal.classList.remove('active');
    }

    renderContent() {
        const body = this.modal.querySelector('.settings-body');
        if (!body) return;
        const profile = readProfile() || {};
        const currentChar = profile.character;

        body.innerHTML = `
            <section class="settings-section">
                <h4>Наставник</h4>
                <p class="settings-hint">Кликни на персонажа чтобы сменить.</p>
                <div class="settings-character-grid">
                    ${CHARACTER_OPTIONS.map(c => `
                        <button type="button" class="settings-character${c.id === currentChar ? ' settings-character-active' : ''}"
                                data-character="${c.id}">
                            <div class="settings-character-emoji">${c.emoji}</div>
                            <div class="settings-character-name">${c.name}</div>
                            <div class="settings-character-role">${c.role}</div>
                        </button>
                    `).join('')}
                </div>
            </section>

            <section class="settings-section">
                <h4>Прогресс</h4>
                <p class="settings-hint">Имя: <b>${this.escapeHtml(profile.name || '—')}</b> · Раскладка: <b>${this.escapeHtml(profile.keyboardType || 'classic')}</b></p>
                <button type="button" class="settings-action settings-action-warning" data-action="resetProgress">
                    🔄 Сбросить прогресс уроков
                </button>
                <p class="settings-action-note">Удалит все сданные уроки + текущую позицию. Профиль и наставник останутся.</p>

                <button type="button" class="settings-action settings-action-danger" data-action="resetAll">
                    🚪 Начать заново
                </button>
                <p class="settings-action-note">Полный сброс: профиль, прогресс, настройки. Запустится онбординг.</p>
            </section>
        `;

        // Wire character cards
        body.querySelectorAll('.settings-character').forEach(card => {
            card.addEventListener('click', () => this.handleChangeCharacter(card.dataset.character));
        });
        // Wire action buttons
        body.querySelectorAll('.settings-action').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'resetProgress') this.handleResetProgress();
                if (action === 'resetAll') this.handleResetAll();
            });
        });
    }

    escapeHtml(text) {
        return String(text || '').replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
        }[m]));
    }

    handleChangeCharacter(newChar) {
        const profile = readProfile() || {};
        if (profile.character === newChar) return;
        profile.character = newChar;
        // Обновляем ageGroup на основе персонажа (knopych/klavochka — детские)
        profile.ageGroup = (newChar === 'knopych' || newChar === 'klavochka') ? 'child' : 'adult';
        writeProfile(profile);

        // Перезагрузить characterSystem с новым персонажем (без полного reload)
        if (window.characterSystem) {
            window.characterSystem.loadCharacter(newChar).then(() => {
                if (window.toastManager) {
                    const info = window.characterSystem.getCharacterInfo();
                    const msg = profile.name
                        ? `Привет, ${profile.name}! Я ${info.name}, теперь твой наставник. ${info.emoji}`
                        : `${info.name} теперь твой наставник. ${info.emoji}`;
                    window.toastManager.show(msg, info.emoji, 4000, { type: 'success' });
                }
            });
        }

        this.renderContent(); // re-highlight active card
    }

    handleResetProgress() {
        if (!confirm('Сбросить прогресс уроков? Все сданные уроки и текущая позиция будут удалены. Восстановить нельзя.')) return;
        const keys = [
            (window.Settings && window.Settings.get('storage.keys.lessonProgress')) || 'typing_trainer_lesson_progress',
            (window.Settings && window.Settings.get('storage.keys.currentLesson')) || 'typing_trainer_current_lesson',
        ];
        keys.forEach(k => localStorage.removeItem(k));
        location.reload();
    }

    handleResetAll() {
        if (!confirm('Полный сброс? Профиль, прогресс, все настройки будут удалены. Запустится онбординг.')) return;
        Object.keys(localStorage)
            .filter(k => k.startsWith('typing_trainer_'))
            .forEach(k => localStorage.removeItem(k));
        // Тоже legacy ключ 'user' если остался
        localStorage.removeItem('user');
        location.reload();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.settingsPanel = new SettingsPanel();
});
window.SettingsPanel = SettingsPanel;
