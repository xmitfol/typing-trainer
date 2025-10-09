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
            currentLanguage: 'ru'
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
        
        DebugUtils.log('✅ Тренажер успешно инициализирован');
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
        
        // Выбираем случайный текст для текущего уровня
        const levelTexts = this.texts[this.state.currentLevel] || this.texts.medium;
        this.state.currentText = TextUtils.getRandomItem(levelTexts);
        
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
        
        DebugUtils.log('✅ Тест успешно начат:', this.state.currentText.substring(0, 50) + '...');
    }
    
    // Сброс состояния
    resetState() {
        this.state.typedText = '';
        this.state.currentPosition = 0;
        this.state.errors = 0;
        this.state.totalChars = 0;
        this.state.startTime = null;
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
            } else {
                // Анимация правильной клавиши
                if (typeof window.animateCorrectKey === 'function') {
                    window.animateCorrectKey(typedChar);
                }
            }
        }
        
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
        
        // Показываем результат через небольшую задержку
        setTimeout(() => {
            this.showTestResults();
        }, 500);
        
        DebugUtils.log('✅ Тест успешно завершен');
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