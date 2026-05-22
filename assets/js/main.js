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
        
        // Тексты для тренировки
        this.texts = {
            beginner: [
                "fff jjj fff jjj ffj jjf fjf jfj",
                "ааа ооо ааа ооо аао оо аоа оао",
                "ссс ллл ссс ллл сл лс слс лсл"
            ],
            easy: [
                "дом вода рука нога глаз рот нос ухо",
                "мама папа сын дочь семья дети родные",
                "стол стул окно дверь комната кухня дом"
            ],
            medium: [
                "быстрая коричневая лиса прыгает через ленивую собаку",
                "программирование это искусство решения проблем с помощью кода",
                "тренировка помогает развить мышечную память пальцев рук"
            ],
            hard: [
                "В современном мире скорость печати является важным профессиональным навыком",
                "Технологии развиваются стремительными темпами, требуя новых цифровых умений",
                "Эффективность работы программиста напрямую связана с владением клавиатурой"
            ],
            expert: [
                "Квалифицированный разработчик программного обеспечения должен владеть слепым методом печати",
                "Профессиональное развитие специалиста требует постоянного совершенствования технических навыков",
                "Автоматизация рутинных процессов существенно повышает общую продуктивность команды"
            ],
            master: [
                "Как ни редко встречается настоящая любовь, настоящая дружба встречается ещё реже",
                "Великие дела совершаются не силой, а постоянством, терпением и неуклонным движением к цели",
                "Истинное образование состоит не в механическом накоплении фактов, а в развитии способности критически мыслить"
            ]
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

        // Устанавливаем фокус на скрытое поле ввода
        if (this.elements.hiddenInput) {
            this.elements.hiddenInput.focus();
        }

        // Инициализируем обработчики событий
        this.initEventListeners();

        // Генерируем случайную цитату
        this.generateRandomQuote();

        // Загружаем сохраненный уровень
        this.loadSavedLevel();

        // Инициализируем другие модули
        this.initModules();

        // Хуки на завершение онбординга и готовность персонажа
        this.initLessonAutoload();

        DebugUtils.log('✅ Тренажер успешно инициализирован');
    }

    // Автозагрузка урока: сохранённый прогресс или первый урок
    initLessonAutoload() {
        const autoload = () => {
            if (this.state.currentLesson) return; // уже загружен
            const defaultTier = (window.Settings && window.Settings.get('lessons.defaultTier', 'tier1')) || 'tier1';
            const firstNum = (window.Settings && window.Settings.get('lessons.firstLessonNumber', 1)) || 1;

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
        const message = name
            ? `${name}, поздравляю! Ты прошёл все ${total} уроков курса ${tier}. 🏆`
            : `Поздравляю! Все ${total} уроков курса ${tier} пройдены. 🏆`;
        if (window.toastManager) {
            const emoji = (window.characterSystem && window.characterSystem.character && window.characterSystem.character.emoji) || '🏆';
            window.toastManager.show(message, emoji, 6000, { type: 'success' });
        }
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
    
    // Инициализация обработчиков событий
    initEventListeners() {
        // Основные обработчики ввода
        if (this.elements.hiddenInput) {
            this.elements.hiddenInput.addEventListener('input', (e) => this.handleInput(e));
            this.elements.hiddenInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
            this.elements.hiddenInput.addEventListener('keyup', (e) => this.handleKeyUp(e));
            
            // Предотвращаем потерю фокуса
            this.elements.hiddenInput.addEventListener('blur', () => {
                setTimeout(() => this.elements.hiddenInput?.focus(), 100);
            });
        }
        
        // Обработчики уровней сложности
        const levelItems = $$('.level-item');
        levelItems.forEach(item => {
            item.addEventListener('click', () => this.switchLevel(item.dataset.level));
        });
        
        // Клик по редактору для возврата фокуса
        if (this.elements.textEditor) {
            this.elements.textEditor.addEventListener('click', () => {
                this.elements.hiddenInput?.focus();
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
            this.elements.hiddenInput?.focus();
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
    
    // Переключение уровня сложности
    switchLevel(level) {
        // Проверяем валидность уровня
        if (!this.texts[level]) {
            DebugUtils.log('⚠️ Неизвестный уровень:', level);
            return;
        }
        
        // Удаляем активный класс у всех уровней
        $$('.level-item').forEach(item => item.classList.remove('active'));
        
        // Добавляем активный класс к выбранному уровню
        const selectedLevel = $(`.level-item[data-level="${level}"]`);
        if (selectedLevel) {
            selectedLevel.classList.add('active');
        }
        
        // Сохраняем выбранный уровень
        this.state.currentLevel = level;
        StorageUtils.set(Settings.get('storage.keys.currentLevel'), level);
        
        // Сбрасываем текущий тест если активен
        if (this.state.isTestActive) {
            this.resetTest();
        }
        
        DebugUtils.log(`📈 Переключен уровень: ${level}`);
    }
    
    // Загрузка сохраненного уровня
    loadSavedLevel() {
        const savedLevel = StorageUtils.get(Settings.get('storage.keys.currentLevel'));
        if (savedLevel && this.texts[savedLevel]) {
            this.switchLevel(savedLevel);
        }
    }
    
    // Начало нового теста
    startNewTest() {
        DebugUtils.log('🎯 Начинаем новый тест...');

        // Текст: либо из загруженного урока, либо случайный по уровню
        if (this.state.currentLesson && this.state.currentLesson.text) {
            this.state.currentText = this.state.currentLesson.text;
        } else {
            const levelTexts = this.texts[this.state.currentLevel] || this.texts.medium;
            this.state.currentText = TextUtils.getRandomItem(levelTexts);
        }

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

                // Звуковой сигнал ошибки (если включен)
                this.playErrorSound();

                // Хуки персонажа на превышение порогов ошибок
                this.checkErrorThresholds();
            } else {
                // Анимация правильной клавиши
                if (typeof window.animateCorrectKey === 'function') {
                    window.animateCorrectKey(typedChar);
                }
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

        // Превышение лимита → "лимит ошибок исчерпан"
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
            this.notifyCharacter('lessonCompleteSuccess', {
                wpm, accuracy, errors, name: this.getUserName(),
                level: lesson.lesson_number
            });

            // Авто-переход к следующему уроку через задержку, чтобы toast успел показаться
            const delay = (window.Settings && window.Settings.get('lessons.autoAdvanceDelay', 4500)) || 4500;
            setTimeout(() => this.loadNextLesson(), delay);
        } else if (!this.state.errorLimitFired) {
            // Если лимит уже срабатывал в процессе — не дублируем
            this.notifyCharacter('errorLimitExceeded', {
                wpm, accuracy, errors,
                limit: Number.isFinite(lesson.error_limit) ? lesson.error_limit : errors,
                name: this.getUserName()
            });
        }
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