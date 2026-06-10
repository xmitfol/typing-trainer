// assets/js/main.js - Основная логика тренажера

// Главный класс приложения
class TypingTrainer {
    constructor() {
        // Состояние приложения
        this.state = {
            currentText: '',
            typedText: '',
            currentPosition: 0,
            isTestActive: false,
            startTime: null,
            errors: 0,
            totalChars: 0,
            currentLevel: 'medium',
            currentLanguage: 'ru',
            currentLesson: null,
            currentLessonTier: null,
            currentLessonNumber: null,
            errorLimitFired: false,
            tooManyErrorsFired: false,
            goodProgressFired: false
        };
        
        // DOM элементы
        this.elements = {
            quoteText: $('#quoteText'),
            quoteAuthor: $('#quoteAuthor'),
            textToType: $('#textToType'),
            typedText: $('#typedText'),
            hiddenInput: $('#hiddenInput'),
            textEditor: $('#textEditor'),
            cursor: $('#cursor'),
            progressFraction: $('#progressFraction'),
            progressFill: $('#progressFill')
        };
        
        // Цитаты для верхней панели
        this.quotes = [
            {
                text: "«Как ни редко встречается настоящая любовь, настоящая дружба встречается ещё реже.»",
                author: "Франсуа де Ларошфуко (1613-1680), герцог, французский философ и писатель"
            },
            {
                text: "«Образование — это то, что остается после того, как забыто все, чему учили в школе.»", 
                author: "Альберт Эйнштейн (1879-1955), физик-теоретик"
            },
            {
                text: "«Лучший способ предсказать будущее — это изобрести его.»",
                author: "Алан Кей (р. 1940), американский учёный в области теории вычислительных систем"
            },
            {
                text: "«Простота — высшая форма изощрённости.»",
                author: "Леонардо да Винчи (1452-1519), итальянский художник и изобретатель"
            }
        ];
        
        this.init();
    }
    
    // Инициализация приложения
    init() {
        DebugUtils.log('🚀 Инициализация клавиатурного тренажера...');

        // Устанавливаем фокус на скрытое поле ввода — НО только если на старте
        // не открыт модал (онбординг на первом визите, welcome после онбординга).
        // Иначе мешаем юзеру вводить имя в форму онбординга.
        if (this.elements.hiddenInput
            && !document.querySelector('.onboarding-overlay.active, .onboarding-v2.active, .welcome-modal.active')) {
            this.elements.hiddenInput.focus();
        }

        // Инициализируем обработчики событий
        this.initEventListeners();

        // Генерируем случайную цитату
        this.generateRandomQuote();

        // Инициализируем другие модули
        this.initModules();

        // Применить сохранённый UI-язык до первого рендера (чтобы лейблы сразу пришли локализованными)
        this.applyStoredUiLanguage();

        // Миграция старого формата прогресса (если есть), затем рендер tier switcher
        this.migrateLessonProgressFormat();
        this.renderTierSwitcher();

        // Хуки на завершение онбординга и готовность персонажа
        this.initLessonAutoload();

        DebugUtils.log('✅ Тренажер успешно инициализирован');
    }

    // Автозагрузка урока: сохранённый прогресс или первый урок выбранного языка
    initLessonAutoload() {
        const autoload = () => {
            if (this.state.currentLesson) return; // уже загружен
            const firstNum = (window.Settings && window.Settings.get('lessons.firstLessonNumber', 1)) || 1;

            // Определяем default tier: по (lang, character) — age-based routing
            const profileKey = (window.Settings && window.Settings.get('storage.keys.userProfile'))
                || 'typing_trainer_user_profile';
            let profile = null;
            try {
                const raw = localStorage.getItem(profileKey);
                if (raw) profile = JSON.parse(raw);
            } catch (e) {}
            const defaultTier = this.pickInitialTier(profile);

            // Пробуем восстановить из сохранённого прогресса
            const savedKey = (window.Settings && window.Settings.get('storage.keys.currentLesson'))
                || 'typing_trainer_current_lesson';
            const saved = StorageUtils.get(savedKey);
            const tier = (saved && saved.tier) || defaultTier;
            const lessonNum = (saved && Number.isFinite(saved.lessonNumber)) ? saved.lessonNumber : firstNum;

            this.loadLesson(tier, lessonNum);
        };

        // Только что прошёл онбординг
        document.addEventListener('typingtrainer:onboardingComplete', autoload);
        // Профиль уже был — character-system просигналил готовность
        document.addEventListener('typingtrainer:characterReady', autoload);

        // Запасной путь: если character-system сработал раньше чем main.js (или его нет),
        // дёргаем autoload по таймауту при наличии профиля
        setTimeout(() => {
            const profileKey = (window.Settings && window.Settings.get('storage.keys.userProfile', 'typing_trainer_user_profile'))
                || 'typing_trainer_user_profile';
            if (localStorage.getItem(profileKey)) {
                autoload();
            }
        }, 1500);
    }

    // Сколько уроков в текущем тире
    getTierLessonCount(tier) {
        const counts = (window.Settings && window.Settings.get('lessons.tierLessonCount', {})) || {};
        return counts[tier] || 0;
    }

    // Выбор tier'а при первой загрузке: age-based routing по (lang, character).
    // Применяется ТОЛЬКО когда нет сохранённого currentLesson (свежий онбординг или сброс).
    // При смене персонажа в Settings tier не меняем — у юзера уже может быть прогресс.
    pickInitialTier(profile) {
        const lang = (profile && profile.language) || 'ru';
        const character = profile && profile.character;
        const langTier = (window.Settings
            && window.Settings.get(`lessons.languageDefaultTier.${lang}`)) || null;
        const systemDefault = (window.Settings && window.Settings.get('lessons.defaultTier', 'tier1')) || 'tier1';

        // EN: маршрутизация по персонажу
        if (lang === 'en') {
            if (character === 'knopych') return 'en_teen';   // Кнопыч → подростковый
            if (character === 'klavochka') return 'en_kids'; // Клавочка → детский
            // anna/maxim/прочее → основной EN
        }
        // RU: маршрутизация по персонажу
        if (lang === 'ru') {
            if (character === 'knopych') return 'ru_teen';   // Кнопыч → подростковый
            if (character === 'klavochka') return 'ru_kids'; // Клавочка → детский
            // anna/maxim/прочее → основной RU
        }
        return langTier || systemDefault;
    }

    // Авто-переход к следующему уроку (вызывается после успешной сдачи)
    async loadNextLesson() {
        const tier = this.state.currentLessonTier;
        const current = this.state.currentLessonNumber;
        if (!tier || !Number.isFinite(current)) return null;

        const total = this.getTierLessonCount(tier);
        if (total && current >= total) {
            // Конец курса — отдельный toast вместо загрузки несуществующего урока
            this.showCourseComplete(tier, total);
            return null;
        }

        return this.loadLesson(tier, current + 1);
    }

    // Сообщение о завершении курса (использует toastManager напрямую,
    // т.к. character-system не имеет сценария courseComplete во всех персонажах)
    showCourseComplete(tier, total) {
        const name = this.getUserName();
        const tierLabel = this.getTierLabel(tier);
        const message = name
            ? `${name}, поздравляю! Ты прошёл все ${total} уроков курса «${tierLabel}». 🏆`
            : `Поздравляю! Все ${total} уроков курса «${tierLabel}» пройдены. 🏆`;
        if (window.toastManager) {
            const emoji = (window.characterSystem && window.characterSystem.character && window.characterSystem.character.emoji) || '🏆';
            window.toastManager.show(message, emoji, 6000, { type: 'success' });
        }
    }

    // === Lesson Picker: статусы, прогресс, рендер сайдбара ===

    // Storage-key helper для lesson-progress
    progressStorageKey() {
        return (window.Settings && window.Settings.get('storage.keys.lessonProgress'))
            || 'typing_trainer_lesson_progress';
    }

    // Миграция старого формата { "1": {...}, "2": {...} } → { tier1: { "1": {...}, ... } }
    // Запускается один раз в init(). Безопасна для повторных вызовов.
    migrateLessonProgressFormat() {
        const key = this.progressStorageKey();
        const raw = StorageUtils.get(key, null);
        if (!raw || typeof raw !== 'object') return;
        const keys = Object.keys(raw);
        const looksOld = keys.length > 0 && keys.every(k => /^\d+$/.test(k));
        if (looksOld) {
            const migrated = { tier1: raw };
            StorageUtils.set(key, migrated);
            DebugUtils.log('🔁 Мигрировал lessonProgress в per-tier формат (tier1)');
        }
    }

    // Чтение карты прогресса для указанного tier (или текущего)
    getLessonProgress(tier) {
        const t = tier || this.state.currentLessonTier || 'tier1';
        const all = StorageUtils.get(this.progressStorageKey(), {}) || {};
        return all[t] || {};
    }

    // Сохранить лучший результат — всегда в currentLessonTier
    saveLessonProgress(lessonNumber, stars, wpm, accuracy) {
        if (!Number.isFinite(lessonNumber)) return;
        const tier = this.state.currentLessonTier || 'tier1';
        const storageKey = this.progressStorageKey();
        const all = StorageUtils.get(storageKey, {}) || {};
        if (!all[tier]) all[tier] = {};
        const numKey = String(lessonNumber);
        const prev = all[tier][numKey] || {};
        all[tier][numKey] = {
            stars: Math.max(prev.stars || 0, stars || 0),
            bestWPM: Math.max(prev.bestWPM || 0, wpm || 0),
            bestAccuracy: Math.max(prev.bestAccuracy || 0, accuracy || 0),
            completedAt: new Date().toISOString()
        };
        StorageUtils.set(storageKey, all);
    }

    // Tooltip для урока — лучшая попытка или подсказка по статусу
    buildLessonTooltip(lessonNum, title, status, progress) {
        const lines = [];
        if (title) lines.push(`Урок ${lessonNum}: ${title}`);
        else lines.push(`Урок ${lessonNum}`);

        if (progress) {
            const wpm = progress.bestWPM || 0;
            const acc = progress.bestAccuracy || 0;
            const dateStr = progress.completedAt
                ? new Date(progress.completedAt).toLocaleDateString('ru-RU')
                : '';
            const parts = [];
            if (wpm) parts.push(`${wpm} зн/мин`);
            if (acc) parts.push(`точность ${acc}%`);
            if (dateStr) parts.push(`сдан ${dateStr}`);
            if (parts.length) lines.push('Лучшая попытка: ' + parts.join(', '));
        } else if (status === 'locked') {
            lines.push('Закрыт. Сдайте предыдущие уроки чтобы открыть.');
        } else if (status === 'current') {
            lines.push('Текущий урок — нажмите Enter или кликните чтобы начать.');
        } else if (status === 'available') {
            lines.push('Открыт. Кликните чтобы перейти.');
        }
        // Экранируем кавычки для безопасной вставки в title=""
        return lines.join(' · ').replace(/"/g, '&quot;');
    }

    // Статус урока. Приоритет: 'current' > 'completed' > 'available' > 'locked'.
    // current выигрывает у completed, чтобы при retry уже сданного урока его было видно в списке.
    // Звёзды отображаются отдельно (по факту наличия записи в lessonProgress), независимо от статуса.
    getLessonStatus(num) {
        if (this.state.currentLessonNumber === num) return 'current';
        const progress = this.getLessonProgress();
        if (progress[String(num)]) return 'completed';
        if (this.state.currentLessonNumber && num < this.state.currentLessonNumber) {
            // Был доступен но не сдан (пропущен или сброшен) — открыт для прохождения
            return 'available';
        }
        return 'locked';
    }

    // Рендер сайдбара со списком всех уроков текущего тира
    async renderLessonList() {
        const container = $('#lessonList');
        if (!container) return;
        if (!window.lessonLoader) return;

        const tier = this.state.currentLessonTier
            || (window.Settings && window.Settings.get('lessons.defaultTier', 'tier1'))
            || 'tier1';
        const total = this.getTierLessonCount(tier);
        const progress = this.getLessonProgress();

        // Сначала skeleton (мгновенный отклик), потом обогащаем title'ом по мере загрузки
        const buildSkeleton = (lessonNum, title) => {
            const status = this.getLessonStatus(lessonNum);
            const prog = progress[String(lessonNum)];
            const stars = prog && Number.isFinite(prog.stars) ? prog.stars : 0;
            // Звёзды показываем при наличии любого сохранённого результата (даже на current при retry).
            const starsHtml = stars > 0
                ? `<span class="lesson-stars" title="${stars}/5 звёзд">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</span>`
                : '';
            const lockIcon = status === 'locked' ? '🔒' : '';
            const currentMark = status === 'current' ? '<span class="lesson-current-mark">▸</span>' : '';
            // Tooltip: для сданных уроков показываем лучшую попытку при hover
            const itemTooltip = this.buildLessonTooltip(lessonNum, title, status, prog);
            return `<div class="lesson-item lesson-${status}" data-lesson="${lessonNum}" data-tier="${tier}" role="button" tabindex="${status === 'locked' ? -1 : 0}" aria-label="Урок ${lessonNum}: ${this.escapeHtml(title || '')}" title="${itemTooltip}">
                ${currentMark}
                <span class="lesson-num">${lessonNum}</span>
                <span class="lesson-title">${this.escapeHtml(title || `Урок ${lessonNum}`)}</span>
                ${starsHtml}
                ${lockIcon ? `<span class="lesson-lock">${lockIcon}</span>` : ''}
            </div>`;
        };

        // Skeleton сразу
        let html = '';
        for (let n = 1; n <= total; n++) html += buildSkeleton(n, null);
        container.innerHTML = html;

        // Обновить счётчик "N / 39"
        const counter = $('#lessonCounter');
        if (counter) {
            const completedCount = Object.keys(progress).length;
            counter.textContent = `${completedCount} / ${total}`;
        }

        // Параллельно загружаем все уроки и обновляем заголовки
        const lessons = await window.lessonLoader.loadAllLessons(tier);
        const items = container.querySelectorAll('.lesson-item');
        lessons.forEach((lesson, i) => {
            if (!lesson) return;
            const item = items[i];
            if (!item) return;
            const titleEl = item.querySelector('.lesson-title');
            if (titleEl) titleEl.textContent = lesson.title || `Урок ${lesson.lesson_number}`;
            item.setAttribute('aria-label', `Урок ${lesson.lesson_number}: ${lesson.title}`);
        });

        // Прокрутка к текущему уроку
        const currentEl = container.querySelector('.lesson-current');
        if (currentEl) currentEl.scrollIntoView({ block: 'center', behavior: 'auto' });
    }

    // ── Tier switcher (UI для переключения курса tier1 ↔ block_1) ──

    // На старте применяем сохранённый UI-язык к <html lang> (если есть)
    applyStoredUiLanguage() {
        try {
            const key = (window.Settings && window.Settings.get('storage.keys.uiLanguage'))
                || 'typing_trainer_ui_language';
            const stored = localStorage.getItem(key);
            if ((stored === 'ru' || stored === 'en') && document.documentElement) {
                document.documentElement.lang = stored;
            }
        } catch (e) { /* silent */ }
    }

    // UI-язык интерфейса. Приоритет: localStorage preference → <html lang> → 'ru'.
    getUiLanguage() {
        try {
            const key = (window.Settings && window.Settings.get('storage.keys.uiLanguage'))
                || 'typing_trainer_ui_language';
            const stored = localStorage.getItem(key);
            if (stored === 'ru' || stored === 'en') return stored;
        } catch (e) { /* fall through */ }
        const htmlLang = (document.documentElement && document.documentElement.lang) || 'ru';
        return htmlLang.startsWith('en') ? 'en' : 'ru';
    }

    // Установить UI-язык: persist + apply to <html lang> + re-render tier switcher.
    setUiLanguage(lang) {
        if (lang !== 'ru' && lang !== 'en') return;
        try {
            const key = (window.Settings && window.Settings.get('storage.keys.uiLanguage'))
                || 'typing_trainer_ui_language';
            localStorage.setItem(key, lang);
        } catch (e) { /* silent */ }
        if (document.documentElement) {
            document.documentElement.lang = lang;
        }
        // Re-render зависимые UI элементы (tier-switcher с локализованными лейблами)
        this.renderTierSwitcher();
    }

    // Tier-метаданные (UI-только, не data). label локализован по UI-языку.
    getTierMeta(tier) {
        const map = {
            tier1:    { lang: 'ru', kind: 'adult',      labels: { ru: 'Основной',    en: 'Russian Main' } },
            block_1:  { lang: 'ru', kind: 'diagnostic', labels: { ru: 'Мизинец',     en: 'Pinky drill'  } },
            ru_teen:  { lang: 'ru', kind: 'teen',       labels: { ru: 'Юниор',       en: 'Russian Junior' } },
            ru_kids:  { lang: 'ru', kind: 'kids',       labels: { ru: 'Дети',        en: 'Russian Kids'   } },
            en_tier1: { lang: 'en', kind: 'adult',      labels: { ru: 'Английский',  en: 'English'      } },
            en_teen:  { lang: 'en', kind: 'teen',       labels: { ru: 'Юниор',       en: 'Junior'       } },
            en_kids:  { lang: 'en', kind: 'kids',       labels: { ru: 'Дети',        en: 'Kids'         } }
        };
        const m = map[tier];
        if (!m) return { lang: 'ru', kind: 'adult', label: tier };
        const ui = this.getUiLanguage();
        return { lang: m.lang, kind: m.kind, label: m.labels[ui] || m.labels.ru };
    }

    getTierLabel(tier) {
        return this.getTierMeta(tier).label;
    }

    // Все доступные тиры из настроек
    getAvailableTiers() {
        const counts = (window.Settings && window.Settings.get('lessons.tierLessonCount', {})) || {};
        return Object.keys(counts);
    }

    renderTierSwitcher() {
        const container = $('#tierSwitcher');
        if (!container) return;
        const tiers = this.getAvailableTiers();
        if (tiers.length < 2) {
            container.style.display = 'none';
            return;
        }
        const currentTier = this.state.currentLessonTier
            || (window.Settings && window.Settings.get('lessons.defaultTier', 'tier1'))
            || 'tier1';

        // Группировка по языку — RU pills сверху, EN ниже. Внутри группы сохраняем
        // порядок из tierLessonCount (адекватный по умолчанию).
        const groups = { ru: [], en: [] };
        tiers.forEach(t => {
            const meta = this.getTierMeta(t);
            (groups[meta.lang] || (groups[meta.lang] = [])).push(t);
        });

        const renderPill = (t) => {
            const meta = this.getTierMeta(t);
            const total = this.getTierLessonCount(t);
            const active = t === currentTier;
            const badge = meta.lang.toUpperCase();
            return `<button type="button" class="tier-pill${active ? ' tier-active' : ''}" data-tier="${t}" data-lang="${meta.lang}" data-kind="${meta.kind}" role="radio" aria-checked="${active}" title="${badge} · ${meta.label} — ${total} уроков">
                <span class="tier-flag">${badge}</span>
                <span class="tier-name">${this.escapeHtml(meta.label)}</span>
                <span class="tier-count">${total}</span>
            </button>`;
        };

        const html = ['ru', 'en']
            .filter(lang => groups[lang] && groups[lang].length > 0)
            .map(lang => `<div class="tier-group" data-lang="${lang}">${groups[lang].map(renderPill).join('')}</div>`)
            .join('');
        container.innerHTML = html;

        container.querySelectorAll('.tier-pill').forEach(btn => {
            btn.addEventListener('click', () => this.switchTier(btn.dataset.tier));
        });
    }

    // Переключение курса: меняет currentLessonTier, загружает первый
    // несданный (или просто первый) урок этого tier
    switchTier(newTier) {
        if (!newTier || newTier === this.state.currentLessonTier) return;
        const total = this.getTierLessonCount(newTier);
        if (!total) return;

        // Найти первый несданный урок в этом тире (или просто 1)
        const progress = this.getLessonProgress(newTier);
        let firstUnfinished = 1;
        for (let n = 1; n <= total; n++) {
            if (!progress[String(n)]) { firstUnfinished = n; break; }
        }

        this.loadLesson(newTier, firstUnfinished);
        // renderLessonList и renderTierSwitcher триггернутся изнутри loadLesson()
    }

    // Обновляет индикатор «Урок N из M» над редактором
    updateLessonIndicator() {
        const indicator = $('#lessonIndicator');
        if (!indicator) return;

        const lesson = this.state.currentLesson;
        if (!lesson) {
            indicator.textContent = '';
            indicator.style.display = 'none';
            return;
        }
        const total = this.getTierLessonCount(this.state.currentLessonTier);
        indicator.textContent = total
            ? `Урок ${lesson.lesson_number} из ${total} · ${lesson.title}`
            : `Урок ${lesson.lesson_number} · ${lesson.title}`;
        indicator.style.display = 'block';
    }

    // Загрузка урока через LessonLoader; отображает превью в редакторе
    async loadLesson(tier, lessonNumber) {
        if (!window.lessonLoader) {
            DebugUtils.log('⚠️ LessonLoader не готов');
            return null;
        }

        const lesson = await window.lessonLoader.loadLesson(tier, lessonNumber);
        if (!lesson) {
            DebugUtils.log(`⚠️ Не удалось загрузить урок ${tier}/lesson_${lessonNumber}`);
            return null;
        }

        this.state.currentLesson = lesson;
        this.state.currentLessonTier = tier;
        this.state.currentLessonNumber = lessonNumber;
        this.state.currentText = lesson.text;

        // Сохраняем прогресс пользователя
        StorageUtils.set(
            Settings.get('storage.keys.currentLesson', 'typing_trainer_current_lesson'),
            { tier, lessonNumber, lastSaved: new Date().toISOString() }
        );

        // Обновляем индикатор прогресса
        this.updateLessonIndicator();

        // Скрываем controls — мы загрузили новый урок (или retry того же)
        this.hideLessonControls();

        // Обновляем сайдбар (статус «current» переходит на новый урок)
        this.renderLessonList();
        this.renderTierSwitcher();

        // Обновляем превью в редакторе
        if (this.elements.textEditor) {
            const textContent = this.elements.textEditor.querySelector('.text-content');
            if (textContent) {
                textContent.innerHTML =
                    `<div class="lesson-preview"><strong>Урок ${lesson.lesson_number}: ${this.escapeHtml(lesson.title)}</strong><br>` +
                    `<span class="lesson-hint">Цель: ${lesson.target_wpm} зн/мин · допустимо ошибок: ${lesson.error_limit}. ` +
                    `Нажмите «Напечатать этот текст».</span></div>`;
            }
        }

        DebugUtils.log(`📚 Урок загружен: ${lesson.id} — "${lesson.title}"`);
        return lesson;
    }

    // Безопасный вызов персонажа
    notifyCharacter(situation, variables = {}) {
        if (window.characterSystem && window.characterSystem.isReady && window.characterSystem.isReady()) {
            window.characterSystem.showToast(situation, variables);
        }
    }

    // Имя пользователя из профиля (для подстановки в шаблоны)
    getUserName() {
        try {
            const key = (window.Settings && window.Settings.get('storage.keys.userProfile', 'typing_trainer_user_profile'))
                || 'typing_trainer_user_profile';
            const raw = localStorage.getItem(key);
            if (raw) return (JSON.parse(raw).name) || '';
        } catch (e) {}
        return '';
    }
    
    // Можно ли возвращать фокус на hiddenInput?
    // Нельзя если открыт модал (онбординг/welcome/settings/cert) или
    // активен другой реальный input/textarea/button (юзер взаимодействует с формой).
    shouldStealFocus() {
        // Открытый модал — не трогаем фокус, юзер работает с формой
        if (document.querySelector('.onboarding-overlay.active, .onboarding-v2.active, .welcome-modal.active, .settings-modal.active, .cert-modal.active')) {
            return false;
        }
        // Юзер уже сфокусирован на другом интерактивном элементе
        const active = document.activeElement;
        if (active && active !== document.body && active !== this.elements.hiddenInput) {
            const tag = active.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'SELECT' || active.isContentEditable) {
                return false;
            }
        }
        return true;
    }

    // Инициализация обработчиков событий
    initEventListeners() {
        // Основные обработчики ввода
        if (this.elements.hiddenInput) {
            this.elements.hiddenInput.addEventListener('input', (e) => this.handleInput(e));
            this.elements.hiddenInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
            this.elements.hiddenInput.addEventListener('keyup', (e) => this.handleKeyUp(e));

            // Предотвращаем потерю фокуса — но НЕ когда юзер работает с модалом/формой
            this.elements.hiddenInput.addEventListener('blur', () => {
                setTimeout(() => {
                    if (this.shouldStealFocus()) {
                        this.elements.hiddenInput?.focus();
                    }
                }, 100);
            });
        }
        
        // Lesson controls: Retry / Next
        const retryBtn = $('#lessonRetryBtn');
        const nextBtn = $('#lessonNextBtn');
        if (retryBtn) retryBtn.addEventListener('click', () => this.retryLesson());
        if (nextBtn) nextBtn.addEventListener('click', () => this.skipToNext());

        // Делегированный обработчик клика по уроку в сайдбаре
        const lessonList = $('#lessonList');
        if (lessonList) {
            lessonList.addEventListener('click', (e) => {
                const item = e.target.closest('.lesson-item');
                if (!item || item.classList.contains('lesson-locked')) return;
                const tier = item.dataset.tier;
                const num = parseInt(item.dataset.lesson, 10);
                if (Number.isFinite(num)) this.loadLesson(tier, num);
            });
            // Клавиатурная навигация (Enter/Space на focused lesson)
            lessonList.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                const item = document.activeElement && document.activeElement.closest('.lesson-item');
                if (!item || item.classList.contains('lesson-locked')) return;
                e.preventDefault();
                const tier = item.dataset.tier;
                const num = parseInt(item.dataset.lesson, 10);
                if (Number.isFinite(num)) this.loadLesson(tier, num);
            });
        }
        
        // Клик по редактору для возврата фокуса (не во время открытого модала)
        if (this.elements.textEditor) {
            this.elements.textEditor.addEventListener('click', () => {
                if (this.shouldStealFocus()) {
                    this.elements.hiddenInput?.focus();
                }
            });
        }
        
        // Глобальные обработчики клавиш
        document.addEventListener('keydown', (e) => {
            // Предотвращаем стандартные горячие клавиши браузера
            if (e.ctrlKey && ['r', 'f', 'g'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });
        
        // Обработка потери фокуса окна
        window.addEventListener('blur', () => {
            if (this.state.isTestActive) {
                this.pauseTest();
            }
        });
        
        window.addEventListener('focus', () => {
            if (this.shouldStealFocus()) {
                this.elements.hiddenInput?.focus();
            }
        });
    }
    
    // Инициализация других модулей
    initModules() {
        // Инициализируем клавиатуру
        if (typeof window.initKeyboard === 'function') {
            window.initKeyboard();
        }
        
        // Инициализируем статистику
        if (typeof window.initStats === 'function') {
            window.initStats();
        }
    }
    
    // Генерация случайной цитаты
    generateRandomQuote() {
        const randomQuote = TextUtils.getRandomItem(this.quotes);
        if (randomQuote && this.elements.quoteText && this.elements.quoteAuthor) {
            this.elements.quoteText.textContent = randomQuote.text;
            this.elements.quoteAuthor.textContent = randomQuote.author;
        }
    }
    
    // Начало нового теста
    startNewTest() {
        DebugUtils.log('🎯 Начинаем новый тест...');

        // Текст урока должен быть загружен через LessonLoader (см. initLessonAutoload)
        if (!this.state.currentLesson || !this.state.currentLesson.text) {
            DebugUtils.log('⚠️ Нет загруженного урока — startNewTest прерван');
            return;
        }
        this.state.currentText = this.state.currentLesson.text;

        // Сбрасываем состояние
        this.resetState();

        // Устанавливаем состояние активного теста
        this.state.isTestActive = true;
        this.state.startTime = Date.now();

        // Очищаем и фокусируем поле ввода
        if (this.elements.hiddenInput) {
            this.elements.hiddenInput.value = '';
            this.elements.hiddenInput.focus();
        }

        // Отображаем текст и обновляем интерфейс
        this.displayText();
        this.updateProgress();

        // Подсвечиваем первую клавишу
        if (typeof window.highlightKey === 'function') {
            window.highlightKey(this.state.currentText[0]);
        }

        // Запускаем отслеживание статистики
        if (typeof window.startStatsTracking === 'function') {
            window.startStatsTracking();
        }

        // Хук персонажа: старт урока
        const lesson = this.state.currentLesson;
        this.notifyCharacter('lessonStart', {
            name: this.getUserName(),
            level: lesson ? lesson.lesson_number : this.state.currentLevel
        });

        // Метроном (если toggle 'rhythm' ON) — тикает по lesson.target_wpm
        if (window.AudioFeedback && lesson && lesson.target_wpm) {
            window.AudioFeedback.startMetronome(lesson.target_wpm);
        }

        DebugUtils.log('✅ Тест успешно начат:', this.state.currentText.substring(0, 50) + '...');
    }
    
    // Сброс состояния
    resetState() {
        this.state.typedText = '';
        this.state.currentPosition = 0;
        this.state.errors = 0;
        this.state.totalChars = 0;
        this.state.startTime = null;
        this.state.errorLimitFired = false;
        this.state.tooManyErrorsFired = false;
        this.state.goodProgressFired = false;
    }
    
    // Обработка ввода
    handleInput(event) {
        if (!this.state.isTestActive) return;
        
        const inputValue = event.target.value;
        
        // Проверяем, не превышает ли длина ввода длину текста
        if (inputValue.length > this.state.currentText.length) {
            event.target.value = inputValue.slice(0, this.state.currentText.length);
            return;
        }
        
        // Обновляем состояние
        const oldTypedText = this.state.typedText;
        this.state.typedText = inputValue;
        this.state.currentPosition = inputValue.length;
        this.state.totalChars = inputValue.length;
        
        // Проверяем новые символы на ошибки
        if (inputValue.length > oldTypedText.length) {
            const newCharIndex = inputValue.length - 1;
            const expectedChar = this.state.currentText[newCharIndex];
            const typedChar = inputValue[newCharIndex];
            
            if (expectedChar !== typedChar) {
                this.state.errors++;

                // Анимация неправильной клавиши
                if (typeof window.animateIncorrectKey === 'function') {
                    window.animateIncorrectKey(typedChar);
                }

                // Звуковой сигнал ошибки (через display toggle 'sound')
                if (window.AudioFeedback) window.AudioFeedback.playKeyBeep(false);

                // Хуки персонажа на превышение порогов ошибок
                this.checkErrorThresholds();
            } else {
                // Анимация правильной клавиши
                if (typeof window.animateCorrectKey === 'function') {
                    window.animateCorrectKey(typedChar);
                }
                // Тихий beep на правильное нажатие
                if (window.AudioFeedback) window.AudioFeedback.playKeyBeep(true);
            }
        }

        // Проверка прогресса (середина урока с малым числом ошибок)
        this.checkProgressMilestone();
        
        // Обновляем отображение
        this.displayText();
        this.updateProgress();
        
        // Подсвечиваем следующую клавишу
        if (this.state.currentPosition < this.state.currentText.length) {
            if (typeof window.highlightKey === 'function') {
                window.highlightKey(this.state.currentText[this.state.currentPosition]);
            }
        }
        
        // Проверяем завершение теста
        if (inputValue.length >= this.state.currentText.length) {
            this.finishTest();
        }
    }
    
    // Обработка нажатия клавиш
    handleKeyDown(event) {
        // Подсвечиваем нажатую клавишу
        if (typeof window.pressKey === 'function') {
            window.pressKey(event.key, event.code);
        }
        
        // Специальные клавиши
        if (event.key === 'Escape') {
            this.resetTest();
        }
    }
    
    // Обработка отпускания клавиш
    handleKeyUp(event) {
        // Убираем подсветку с клавиши
        if (typeof window.releaseKey === 'function') {
            window.releaseKey(event.key, event.code);
        }
    }
    
    // Отображение текста с подсветкой
    displayText() {
        if (!this.state.currentText || !this.elements.textEditor) return;
        
        let displayHTML = '';
        
        for (let i = 0; i < this.state.currentText.length; i++) {
            const char = this.state.currentText[i];
            const displayChar = char === ' ' ? '&nbsp;' : this.escapeHtml(char);
            
            if (i < this.state.typedText.length) {
                // Уже напечатанный символ
                const typedChar = this.state.typedText[i];
                const className = typedChar === char ? 'char-correct' : 'char-incorrect';
                displayHTML += `<span class="${className}">${displayChar}</span>`;
            } else {
                // Ещё не напечатанный символ
                displayHTML += `<span class="text-to-type">${displayChar}</span>`;
            }
        }
        
        // Обновляем содержимое
        const textContent = this.elements.textEditor.querySelector('.text-content');
        if (textContent) {
            textContent.innerHTML = displayHTML;
        }
        
        // Позиционируем курсор
        this.positionCursor();
    }
    
    // Экранирование HTML символов
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }
    
    // Позиционирование курсора
    positionCursor() {
        if (this.elements.cursor) {
            this.elements.cursor.style.display = this.state.isTestActive ? 'inline-block' : 'none';
        }
    }
    
    // Обновление прогресса
    updateProgress() {
        if (!this.state.currentText) return;
        
        const progress = Math.round((this.state.currentPosition / this.state.currentText.length) * 100);
        
        if (this.elements.progressFraction) {
            this.elements.progressFraction.textContent = `${this.state.currentPosition}/${this.state.currentText.length}`;
        }
        
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${progress}%`;
        }
    }
    
    // Хуки персонажа на превышение порогов ошибок
    checkErrorThresholds() {
        const lesson = this.state.currentLesson;
        const errors = this.state.errors;
        const limit = (lesson && Number.isFinite(lesson.error_limit)) ? lesson.error_limit : null;

        // Половина допустимого лимита → "слишком много ошибок"
        if (limit !== null && !this.state.tooManyErrorsFired && errors > 0 && errors >= Math.max(1, Math.floor(limit / 2))) {
            this.state.tooManyErrorsFired = true;
            this.notifyCharacter('tooManyErrors', { errors, limit, name: this.getUserName() });
        }

        // Превышение лимита → "лимит ошибок исчерпан".
        // Строгое >, чтобы errors == error_limit оставались успехом (см. notifyLessonOutcome:
        // success ≡ errors <= errorLimit), иначе юзер получит конфликтующую пару тостов
        // "ошибок многовато" + "молодец" на одном и том же исходе.
        if (limit !== null && !this.state.errorLimitFired && errors > limit) {
            this.state.errorLimitFired = true;
            this.notifyCharacter('errorLimitExceeded', { errors, limit, name: this.getUserName() });
        }
    }

    // Хук "хороший прогресс" на середине урока без превышения порогов
    checkProgressMilestone() {
        if (this.state.goodProgressFired || !this.state.isTestActive) return;
        if (!this.state.currentText) return;

        const half = Math.floor(this.state.currentText.length / 2);
        if (this.state.currentPosition < half) return;

        const lesson = this.state.currentLesson;
        const limit = (lesson && Number.isFinite(lesson.error_limit)) ? lesson.error_limit : Infinity;
        if (this.state.errors > Math.max(1, Math.floor(limit / 2))) return;

        this.state.goodProgressFired = true;
        this.notifyCharacter('goodProgress', {
            wpm: this.calculateWPM(),
            accuracy: this.calculateAccuracy(),
            name: this.getUserName()
        });
    }

    // Завершение теста
    finishTest() {
        DebugUtils.log('🏁 Завершение теста...');

        this.state.isTestActive = false;

        // Останавливаем метроном
        if (window.AudioFeedback) window.AudioFeedback.stopMetronome();

        // Скрываем курсор
        this.positionCursor();

        // Убираем подсветку клавиш
        if (typeof window.clearKeyHighlights === 'function') {
            window.clearKeyHighlights();
        }

        // Останавливаем отслеживание статистики
        if (typeof window.stopStatsTracking === 'function') {
            window.stopStatsTracking();
        }

        // Показываем финальную статистику
        if (typeof window.showFinalStats === 'function') {
            window.showFinalStats();
        }

        // Сохраняем результат в историю
        this.saveTestResult();

        // Хук персонажа: успех или провал по критериям урока
        this.notifyLessonOutcome();

        // Показываем результат через небольшую задержку
        setTimeout(() => {
            this.showTestResults();
        }, 500);

        DebugUtils.log('✅ Тест успешно завершен');
    }

    notifyLessonOutcome() {
        const lesson = this.state.currentLesson;
        if (!lesson) return;

        const wpm = this.calculateWPM();
        const accuracy = this.calculateAccuracy();
        const errors = this.state.errors;
        const targetWpm = Number.isFinite(lesson.target_wpm) ? lesson.target_wpm : 0;
        const errorLimit = Number.isFinite(lesson.error_limit) ? lesson.error_limit : Infinity;

        const success = wpm >= targetWpm && errors <= errorLimit;

        if (success) {
            // Сохранить best результат для этого урока (для сайдбара и will-be-history)
            this.saveLessonProgress(lesson.lesson_number, this.getRating(), wpm, accuracy);

            this.notifyCharacter('lessonCompleteSuccess', {
                wpm, accuracy, errors,
                limit: Number.isFinite(lesson.error_limit) ? lesson.error_limit : errors,
                name: this.getUserName(),
                level: lesson.lesson_number
            });

            // Обновить сайдбар — урок переходит в completed со звёздами
            this.renderLessonList();

            // Сертификация — если это финальный урок тира с достаточными WPM/accuracy
            if (window.Certification) {
                window.Certification.maybeAwardCertification(
                    this.state.currentLessonTier,
                    lesson.lesson_number,
                    wpm,
                    accuracy
                );
            }

            // Показать controls с countdown auto-advance
            this.showLessonControls(true);
        } else {
            if (!this.state.errorLimitFired) {
                this.notifyCharacter('errorLimitExceeded', {
                    wpm, accuracy, errors,
                    limit: Number.isFinite(lesson.error_limit) ? lesson.error_limit : errors,
                    name: this.getUserName()
                });
            }
            // На failure тоже показываем controls, но без auto-advance
            this.showLessonControls(false);
        }
    }

    // === Lesson Controls (Next / Retry / countdown) ===

    showLessonControls(success) {
        const panel = $('#lessonControls');
        const hint = $('#lessonControlsHint');
        const nextBtn = $('#lessonNextBtn');
        if (!panel) return;

        // Если это последний урок тира — следующего нет, прячем кнопку
        const tier = this.state.currentLessonTier;
        const total = this.getTierLessonCount(tier);
        const isLast = total && this.state.currentLessonNumber >= total;
        if (nextBtn) nextBtn.style.display = isLast ? 'none' : '';

        panel.style.display = 'flex';
        panel.classList.toggle('lesson-controls-success', !!success);
        panel.classList.toggle('lesson-controls-failure', !success);

        if (success && !isLast) {
            this.startAutoAdvanceCountdown();
        } else if (hint) {
            hint.textContent = '';
        }
    }

    hideLessonControls() {
        const panel = $('#lessonControls');
        if (panel) panel.style.display = 'none';
        this.cancelAutoAdvance();
    }

    startAutoAdvanceCountdown() {
        const hint = $('#lessonControlsHint');
        const totalMs = (window.Settings && window.Settings.get('lessons.autoAdvanceDelay', 4500)) || 4500;
        let remainingSec = Math.ceil(totalMs / 1000);

        const update = () => {
            if (hint) hint.textContent = `Авто-переход через ${remainingSec} с… (или нажмите кнопку)`;
        };
        update();

        this.cancelAutoAdvance();
        this.autoAdvanceInterval = setInterval(() => {
            remainingSec -= 1;
            if (remainingSec <= 0) {
                this.cancelAutoAdvance();
                this.skipToNext();
            } else {
                update();
            }
        }, 1000);
    }

    cancelAutoAdvance() {
        if (this.autoAdvanceInterval) {
            clearInterval(this.autoAdvanceInterval);
            this.autoAdvanceInterval = null;
        }
    }

    retryLesson() {
        this.cancelAutoAdvance();
        this.hideLessonControls();
        if (this.state.currentLessonTier && this.state.currentLessonNumber) {
            this.loadLesson(this.state.currentLessonTier, this.state.currentLessonNumber);
        }
    }

    skipToNext() {
        this.cancelAutoAdvance();
        this.hideLessonControls();
        this.loadNextLesson();
    }
    
    // Сохранение результата теста
    saveTestResult() {
        const result = {
            timestamp: Date.now(),
            level: this.state.currentLevel,
            text: this.state.currentText.substring(0, 100) + '...',
            wpm: this.calculateWPM(),
            accuracy: this.calculateAccuracy(),
            errors: this.state.errors,
            duration: Date.now() - this.state.startTime,
            totalChars: this.state.totalChars
        };
        
        // Получаем историю тестов
        const history = StorageUtils.get(Settings.get('storage.keys.testHistory'), []);
        
        // Добавляем новый результат
        history.unshift(result);
        
        // Ограничиваем размер истории
        const maxItems = Settings.get('storage.maxHistoryItems', 100);
        if (history.length > maxItems) {
            history.splice(maxItems);
        }
        
        // Сохраняем обновленную историю
        StorageUtils.set(Settings.get('storage.keys.testHistory'), history);
        
        DebugUtils.log('💾 Результат теста сохранен:', result);
    }
    
    // Показ результатов теста
    showTestResults() {
        const wpm = this.calculateWPM();
        const accuracy = this.calculateAccuracy();
        const time = TimeUtils.formatTime(Date.now() - this.state.startTime);
        
        let message = '🎉 Тест завершен!\n\n';
        message += `⚡ Скорость: ${wpm} зн/мин\n`;
        message += `🎯 Точность: ${accuracy}%\n`;
        message += `⏱️ Время: ${time}\n`;
        message += `❌ Ошибки: ${this.state.errors}\n\n`;
        
        // Добавляем оценку
        const rating = this.getRating();
        message += this.getRatingMessage(rating);
        
        // Показываем уведомление вместо alert
        NotificationUtils.success(message.replace(/\n/g, '<br>'), 8000);
    }
    
    // Получение рейтинга
    getRating() {
        const wpm = this.calculateWPM();
        const accuracy = this.calculateAccuracy();
        const criteria = Settings.getRatingCriteria();
        
        for (let stars = 5; stars >= 1; stars--) {
            const requirement = criteria[stars];
            if (requirement && wpm >= requirement.minWPM && accuracy >= requirement.minAccuracy) {
                return stars;
            }
        }
        
        return 0;
    }
    
    // Получение сообщения по рейтингу
    getRatingMessage(rating) {
        const messages = {
            5: '🌟 Превосходно! Вы мастер печати!',
            4: '⭐ Отлично! Высокий профессиональный уровень!',
            3: '✨ Хорошо! Вы на правильном пути!',
            2: '👍 Неплохо! Продолжайте тренироваться!',
            1: '💪 Начало положено! Тренируйтесь больше!',
            0: '🎯 Не сдавайтесь! Практика - путь к совершенству!'
        };
        
        return messages[rating] || messages[0];
    }
    
    // Пауза теста
    pauseTest() {
        if (this.state.isTestActive) {
            // Здесь можно добавить логику паузы
            DebugUtils.log('⏸️ Тест приостановлен');
        }
    }
    
    // Сброс теста
    resetTest() {
        DebugUtils.log('🔄 Сброс теста...');

        this.state.isTestActive = false;
        this.resetState();
        this.state.currentText = '';

        // Останавливаем метроном если был запущен
        if (window.AudioFeedback) window.AudioFeedback.stopMetronome();


        // Очищаем поле ввода
        if (this.elements.hiddenInput) {
            this.elements.hiddenInput.value = '';
        }
        
        // Сбрасываем отображение
        if (this.elements.textToType) {
            this.elements.textToType.textContent = 'Нажмите "Напечатать этот текст" чтобы начать';
        }
        
        this.updateProgress();
        this.positionCursor();
        
        // Убираем подсветку клавиш
        if (typeof window.clearKeyHighlights === 'function') {
            window.clearKeyHighlights();
        }
        
        // Сбрасываем статистику
        if (typeof window.resetStats === 'function') {
            window.resetStats();
        }
        
        DebugUtils.log('✅ Тест успешно сброшен');
    }
    
    // Вычисление WPM
    calculateWPM() {
        if (!this.state.startTime || this.state.totalChars === 0) return 0;
        
        const timeInMinutes = (Date.now() - this.state.startTime) / 60000;
        const correctChars = this.state.totalChars - this.state.errors;
        
        return Math.round(Math.max(0, correctChars / timeInMinutes));
    }
    
    // Вычисление точности
    calculateAccuracy() {
        if (this.state.totalChars === 0) return 100;
        
        return Math.round(((this.state.totalChars - this.state.errors) / this.state.totalChars) * 100);
    }
    
    // Воспроизведение звука ошибки
    playErrorSound() {
        // Заглушка для будущей реализации звуков
        if (Settings.get('ui.sounds.enabled', false)) {
            // Здесь будет код воспроизведения звука
        }
    }
    
    // Получение статистики для других модулей
    getStats() {
        return {
            wpm: this.calculateWPM(),
            accuracy: this.calculateAccuracy(),
            errors: this.state.errors,
            time: this.state.startTime ? Date.now() - this.state.startTime : 0,
            currentPosition: this.state.currentPosition,
            totalChars: this.state.totalChars,
            level: this.state.currentLevel
        };
    }
}

// Инициализация приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    // Создаем экземпляр приложения
    window.typingTrainer = new TypingTrainer();
    
    // Экспортируем глобальные функции для совместимости
    window.startNewTest = () => window.typingTrainer.startNewTest();
    window.resetTest = () => window.typingTrainer.resetTest();
    window.isTestActive = () => window.typingTrainer.state.isTestActive;
    window.getCurrentChar = () => {
        const trainer = window.typingTrainer;
        return trainer.state.currentText[trainer.state.currentPosition];
    };
    window.getStats = () => window.typingTrainer.getStats();
    
    console.log('🎯 Клавиатурный тренажер успешно запущен!');
});