/**
 * Onboarding System v2 — Phase 2 redesign.
 *
 * Заменяет старый «Профиль/Клавиатура/Язык» flow на чёткую trio:
 *   1. Имя + автодетект пола (с возможностью переключить М/Ж)
 *   2. «Кто будет учиться?» — Взрослый / Подросток / Ребёнок (audience)
 *   3. «Кто будет наставником?» — Anna/Maxim (для adult), фиксирован для teen/kid
 *
 * Тех. параметры (язык/клавиатура/тема) — тихий автодетект, не на экране.
 *
 * Сохраняет совместимость с pickInitialTier(profile) — character + language
 * по-прежнему ключи для маршрутизации.
 */

const AUDIENCES = [
    { id: 'adult', label: 'Взрослый',  age: '18+',    lessons: '99 уроков', course: 'Основной курс' },
    { id: 'teen',  label: 'Подросток', age: '12-17',  lessons: '75 уроков', course: 'Юниор · с Кнопычем',  fixedMentor: 'knopych' },
    { id: 'kid',   label: 'Ребёнок',   age: '6-11',   lessons: '50 уроков', course: 'Детский · с Клавочкой', fixedMentor: 'klavochka' },
];

const ADULT_MENTORS = [
    { id: 'anna',  name: 'Анна',   role: 'Учительница', style: 'Мягкий темп, подробные объяснения' },
    { id: 'maxim', name: 'Максим', role: 'Тренер',      style: 'Энергичный, без воды, упор на скорость' },
];

const MENTOR_INFO = {
    anna:      { name: 'Анна',     role: 'Учительница печати' },
    maxim:     { name: 'Максим',   role: 'Опытный наставник' },
    knopych:   { name: 'Кнопыч',   role: 'Робот-клавиша — идёт с подростковым курсом' },
    klavochka: { name: 'Клавочка', role: 'Добрая помощница — идёт с детским курсом' },
};

class OnboardingManager {
    constructor() {
        this.profile = {
            name: '',
            gender: null,         // 'm' | 'f' — новое поле
            genderManual: false,  // ставится если юзер переключил вручную
            audience: 'adult',    // 'adult' | 'teen' | 'kid' — новое поле
            mentor: 'maxim',      // алиас character; default для adult-мужчины
            character: 'maxim',   // legacy field — синхронизирован с mentor для pickInitialTier
            keyboardType: 'classic',
            language: 'ru',
            onboardingCompleted: false,
            createdAt: null,
        };
        this.overlay = null;
        this.init();
    }

    init() {
        this.overlay = document.getElementById('onboardingOverlay');
        if (!this.overlay) {
            console.warn('onboarding: #onboardingOverlay not found');
            return;
        }

        // Если профиль уже есть — не показываем форму
        const existing = this.loadProfile();
        if (existing && existing.onboardingCompleted) {
            this.profile = Object.assign(this.profile, existing);
            this.applyKeyboardLayoutClass();
            return;
        }

        // Тихий автодетект (не на экране)
        this.profile.language = this.detectLanguage();
        this.profile.keyboardType = this.detectKeyboard();
        this.profile.gender = 'm';

        this.render();
        this.bindEvents();
        this.show();
    }

    // ──────────────────────────────────────────────────────────────────────
    // Detection helpers

    detectLanguage() {
        const nav = (navigator.language || 'ru').toLowerCase();
        return nav.startsWith('ru') ? 'ru' : 'en';
    }

    detectKeyboard() {
        const ua = navigator.userAgent || '';
        if (/Mobi|Android|iPhone/i.test(ua)) return 'laptop';
        return 'classic';
    }

    // ──────────────────────────────────────────────────────────────────────
    // Render

    show() {
        // Сразу, без setTimeout — иначе main.js init() успевает фокус
        // на hiddenInput до того как shouldStealFocus() увидит .active overlay.
        this.overlay.classList.add('active');
    }

    hide() {
        this.overlay.classList.remove('active');
    }

    render() {
        const { name, gender, audience, mentor, language, keyboardType } = this.profile;
        const langLabel = language === 'ru' ? 'RU' : 'EN';
        const keyboardLabel = ({ classic: 'Полноразмерная', laptop: 'Ноутбук', ergonomic: 'Эргономическая' })[keyboardType] || keyboardType;

        this.overlay.innerHTML = `
            <div class="onboarding-v2__inner">
                <div class="onboarding-v2__brand">
                    <div class="onboarding-v2__logo">Ё</div>
                    <div class="onboarding-v2__brand-title">Тренажёр слепой печати</div>
                </div>

                <!-- Section 1: Name + Gender -->
                <div class="onboarding-v2__section">
                    <div class="onboarding-v2__section-label">
                        <span class="onboarding-v2__section-label-main">Как тебя зовут?</span>
                    </div>
                    <div class="onboarding-v2__name-row">
                        <input
                            id="userName"
                            type="text"
                            class="onboarding-v2__name-input"
                            placeholder="Имя"
                            value="${this.escapeAttr(name)}"
                            maxlength="30"
                            autocomplete="off"
                        />
                        <div class="onboarding-v2__gender-toggle" role="group" aria-label="Пол">
                            <button type="button" class="onboarding-v2__gender-btn"
                                    data-gender="m" data-active="${gender === 'm' ? 'true' : 'false'}"
                                    aria-label="Мужской">М</button>
                            <button type="button" class="onboarding-v2__gender-btn"
                                    data-gender="f" data-active="${gender === 'f' ? 'true' : 'false'}"
                                    aria-label="Женский">Ж</button>
                        </div>
                    </div>
                    <div id="nameHint" class="onboarding-v2__name-hint"></div>
                </div>

                <!-- Section 2: Audience -->
                <div class="onboarding-v2__section">
                    <div class="onboarding-v2__section-label">
                        <span class="onboarding-v2__section-label-main">Кто будет учиться?</span>
                        <span class="onboarding-v2__section-label-sub">От этого зависит сложность и наставник</span>
                    </div>
                    <div class="onboarding-v2__grid-3" role="radiogroup" aria-label="Возрастная группа">
                        ${AUDIENCES.map(a => this.renderAudienceCard(a, audience === a.id, gender)).join('')}
                    </div>
                </div>

                <!-- Section 3: Mentor -->
                <div class="onboarding-v2__section" id="mentorSection">
                    ${this.renderMentorSection(audience, mentor)}
                </div>

                <!-- Detected tech params -->
                <div class="onboarding-v2__section">
                    <div class="onboarding-v2__detected">
                        Определили автоматически: <b>${langLabel}</b> · <b>${keyboardLabel}</b>
                        <span style="margin: 0 4px">·</span>
                        изменить можно в настройках после старта
                    </div>
                </div>

                <button type="button" id="submitOnboarding" class="onboarding-v2__submit" disabled>
                    <span id="submitLabel">Введи имя, чтобы продолжить</span>
                </button>
                <div id="submitError" class="onboarding-v2__error"></div>
            </div>
        `;

        this.populatePortraits();
        this.updateSubmitState();
        this.handleNameInput();
    }

    renderAudienceCard(a, selected, gender) {
        const portraitSlot = `<span class="onboarding-v2__card-portrait" data-portrait="user" data-audience="${a.id}" data-gender="${gender}"></span>`;
        return `
            <button type="button"
                    class="onboarding-v2__card"
                    role="radio"
                    aria-checked="${selected ? 'true' : 'false'}"
                    data-audience="${a.id}">
                <div class="onboarding-v2__card-header">
                    ${portraitSlot}
                    <div>
                        <div class="onboarding-v2__card-title">${a.label}</div>
                        <div class="onboarding-v2__card-sub">${a.age}</div>
                    </div>
                </div>
                <div class="onboarding-v2__card-meta">${a.lessons}</div>
            </button>
        `;
    }

    renderMentorSection(audience, mentor) {
        const audienceObj = AUDIENCES.find(a => a.id === audience);
        if (audienceObj && audienceObj.fixedMentor) {
            const info = MENTOR_INFO[audienceObj.fixedMentor];
            return `
                <div class="onboarding-v2__section-label">
                    <span class="onboarding-v2__section-label-main">Твой наставник</span>
                </div>
                <div class="onboarding-v2__mentor-fixed">
                    <span class="onboarding-v2__card-portrait" data-portrait="mentor" data-mentor-id="${audienceObj.fixedMentor}"></span>
                    <div>
                        <div class="onboarding-v2__mentor-fixed-title">${info.name}</div>
                        <div class="onboarding-v2__mentor-fixed-sub">${info.role}</div>
                    </div>
                </div>
            `;
        }
        return `
            <div class="onboarding-v2__section-label">
                <span class="onboarding-v2__section-label-main">Кто будет наставником?</span>
                <span class="onboarding-v2__section-label-sub">Будет комментировать ошибки и поздравлять</span>
            </div>
            <div class="onboarding-v2__grid-2" role="radiogroup" aria-label="Наставник">
                ${ADULT_MENTORS.map(m => `
                    <button type="button"
                            class="onboarding-v2__card"
                            role="radio"
                            aria-checked="${mentor === m.id ? 'true' : 'false'}"
                            data-mentor="${m.id}">
                        <div class="onboarding-v2__card-header">
                            <span class="onboarding-v2__card-portrait" data-portrait="mentor" data-mentor-id="${m.id}"></span>
                            <div>
                                <div class="onboarding-v2__card-title">${m.name}</div>
                                <div class="onboarding-v2__card-sub">${m.role}</div>
                            </div>
                        </div>
                        <div class="onboarding-v2__card-meta">${m.style}</div>
                    </button>
                `).join('')}
            </div>
        `;
    }

    populatePortraits() {
        if (!window.portraits) return;
        this.overlay.querySelectorAll('[data-portrait]').forEach(el => {
            const kind = el.dataset.portrait;
            if (kind === 'user') {
                const a = el.dataset.audience;
                const g = el.dataset.gender || 'm';
                el.innerHTML = window.portraits.user(a, g, 48);
            } else if (kind === 'mentor') {
                el.innerHTML = window.portraits.mentor(el.dataset.mentorId, 48);
            }
        });
    }

    // ──────────────────────────────────────────────────────────────────────
    // Event handlers

    bindEvents() {
        this.overlay.addEventListener('input', (e) => {
            if (e.target.id === 'userName') this.handleNameInput();
        });

        this.overlay.addEventListener('click', (e) => {
            const audienceCard = e.target.closest('[data-audience]');
            const mentorCard = e.target.closest('[data-mentor]');
            const genderBtn = e.target.closest('[data-gender]');
            const submitBtn = e.target.closest('#submitOnboarding');

            if (audienceCard) this.selectAudience(audienceCard.dataset.audience);
            else if (mentorCard) this.selectMentor(mentorCard.dataset.mentor);
            else if (genderBtn) this.selectGender(genderBtn.dataset.gender, true);
            else if (submitBtn) this.submit();
        });

        this.overlay.addEventListener('keydown', (e) => {
            if (e.target.id === 'userName' && e.key === 'Enter') {
                e.preventDefault();
                if (!document.getElementById('submitOnboarding').disabled) this.submit();
            }
        });
    }

    handleNameInput() {
        const input = document.getElementById('userName');
        if (!input) return;
        const name = input.value.trim();
        this.profile.name = name;

        if (!this.profile.genderManual && window.portraits && window.portraits.detectGender) {
            const detected = window.portraits.detectGender(name);
            if (detected && detected !== this.profile.gender) {
                this.profile.gender = detected;
                this.refreshGenderToggle();
                this.refreshPortraits();
            }
        }

        const hint = document.getElementById('nameHint');
        if (hint) {
            if (!name) {
                hint.textContent = '';
            } else if (name.length < 2) {
                hint.textContent = 'Минимум 2 символа';
            } else {
                const detected = window.portraits && window.portraits.detectGender ? window.portraits.detectGender(name) : null;
                if (this.profile.genderManual) {
                    hint.textContent = `Выбрано вручную · ${this.profile.gender === 'f' ? 'женское' : 'мужское'}`;
                } else if (detected) {
                    hint.textContent = `Определили по имени · ${detected === 'f' ? 'женское' : 'мужское'}`;
                } else {
                    hint.textContent = '';
                }
            }
        }
        this.updateSubmitState();
    }

    selectGender(gender, manual = false) {
        if (gender !== 'm' && gender !== 'f') return;
        this.profile.gender = gender;
        this.profile.genderManual = manual || this.profile.genderManual;
        this.refreshGenderToggle();
        this.refreshPortraits();
        this.handleNameInput();
    }

    refreshGenderToggle() {
        this.overlay.querySelectorAll('[data-gender]').forEach(btn => {
            btn.dataset.active = (btn.dataset.gender === this.profile.gender) ? 'true' : 'false';
        });
    }

    refreshPortraits() {
        if (!window.portraits) return;
        this.overlay.querySelectorAll('[data-portrait="user"]').forEach(el => {
            el.dataset.gender = this.profile.gender;
            el.innerHTML = window.portraits.user(el.dataset.audience, this.profile.gender, 48);
        });
    }

    selectAudience(audience) {
        if (!AUDIENCES.find(a => a.id === audience)) return;
        this.profile.audience = audience;

        const audienceObj = AUDIENCES.find(a => a.id === audience);
        if (audienceObj.fixedMentor) {
            this.profile.mentor = audienceObj.fixedMentor;
            this.profile.character = audienceObj.fixedMentor;
        } else {
            if (!['anna', 'maxim'].includes(this.profile.mentor)) {
                // дефолт: противоположный пол наставник
                this.profile.mentor = this.profile.gender === 'f' ? 'maxim' : 'anna';
            }
            this.profile.character = this.profile.mentor;
        }

        this.overlay.querySelectorAll('[data-audience]').forEach(c => {
            c.setAttribute('aria-checked', c.dataset.audience === audience ? 'true' : 'false');
        });

        const mentorSection = document.getElementById('mentorSection');
        if (mentorSection) {
            mentorSection.innerHTML = this.renderMentorSection(audience, this.profile.mentor);
            this.populatePortraits();
        }
        this.updateSubmitState();
    }

    selectMentor(mentor) {
        if (!ADULT_MENTORS.find(m => m.id === mentor)) return;
        this.profile.mentor = mentor;
        this.profile.character = mentor;
        this.overlay.querySelectorAll('[data-mentor]').forEach(c => {
            c.setAttribute('aria-checked', c.dataset.mentor === mentor ? 'true' : 'false');
        });
        this.updateSubmitState();
    }

    updateSubmitState() {
        const btn = document.getElementById('submitOnboarding');
        const label = document.getElementById('submitLabel');
        if (!btn || !label) return;
        const valid = this.isValid();
        btn.disabled = !valid;
        if (!valid) {
            if (!this.profile.name || this.profile.name.length < 2) {
                label.textContent = 'Введи имя, чтобы продолжить';
            } else if (!this.profile.character) {
                label.textContent = 'Выбери наставника';
            } else {
                label.textContent = 'Заполни форму';
            }
        } else {
            label.textContent = `Начать обучение, ${this.profile.name} →`;
        }
    }

    isValid() {
        return (
            this.profile.name &&
            this.profile.name.length >= 2 &&
            this.profile.audience &&
            this.profile.character &&
            ['anna', 'maxim', 'knopych', 'klavochka'].includes(this.profile.character)
        );
    }

    // ──────────────────────────────────────────────────────────────────────
    // Submit

    submit() {
        if (!this.isValid()) return;
        this.profile.ageGroup = this.profile.audience === 'adult' ? 'adult' : 'child';
        this.profile.onboardingCompleted = true;
        this.profile.createdAt = new Date().toISOString();
        this.saveProfile();

        // Очистить saved currentLesson — иначе main.js autoload подхватит старый прогресс
        try {
            const lessonKey = (window.Settings && window.Settings.get('storage.keys.currentLesson'))
                || 'typing_trainer_current_lesson';
            localStorage.removeItem(lessonKey);
        } catch (e) { /* silent */ }

        this.hide();

        setTimeout(() => {
            this.applyKeyboardLayoutClass();
            document.dispatchEvent(new CustomEvent('typingtrainer:onboardingComplete', {
                detail: { profile: this.profile },
            }));
        }, 350);
    }

    applyKeyboardLayoutClass() {
        const container = document.querySelector('.keyboard-container');
        if (!container) return;
        container.classList.remove('layout-classic', 'layout-laptop', 'layout-ergonomic');
        container.classList.add(`layout-${this.profile.keyboardType}`);
    }

    // ──────────────────────────────────────────────────────────────────────
    // Storage

    storageKey() {
        return (window.Settings && window.Settings.get('storage.keys.userProfile', 'typing_trainer_user_profile'))
            || 'typing_trainer_user_profile';
    }

    saveProfile() {
        try { localStorage.setItem(this.storageKey(), JSON.stringify(this.profile)); }
        catch (e) { console.error('Failed to save profile:', e); }
    }

    loadProfile() {
        try {
            const raw = localStorage.getItem(this.storageKey());
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }

    resetOnboarding() {
        try { localStorage.removeItem(this.storageKey()); location.reload(); }
        catch (e) { console.error('Failed to reset:', e); }
    }

    escapeAttr(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;');
    }

    getProfile() { return this.profile; }
}

document.addEventListener('DOMContentLoaded', async () => {
    if (window.i18n) { try { await window.i18n.init(); } catch (e) {} }
    window.onboardingManager = new OnboardingManager();
});

window.OnboardingManager = OnboardingManager;
