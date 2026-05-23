// config/settings.js - Настройки приложения

// Основные настройки приложения
const APP_CONFIG = {
    // Информация о приложении
    name: 'Клавиатурный Тренажер',
    version: '1.0.0',
    author: 'SaaS Development Team',
    
    // API настройки (для будущего использования)
    api: {
        baseUrl: (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production')
            ? 'https://api.typing-trainer.com'
            : 'http://localhost:8000',
        timeout: 10000,
        retries: 3
    },
    
    // Настройки тестирования
    testing: {
        // Минимальная длительность теста для сохранения результата (секунды)
        minTestDuration: 10,
        
        // Максимальная длительность теста (секунды)
        maxTestDuration: 300,
        
        // Интервал обновления статистики (миллисекунды)
        statsUpdateInterval: 100,
        
        // Время показа подсказки для следующей клавиши (миллисекунды)
        keyHighlightDelay: 500,
        
        // Автоматическое завершение при достижении конца текста
        autoComplete: true
    },
    
    // Настройки клавиатуры
    keyboard: {
        // Языки клавиатуры
        layouts: {
            ru: {
                name: 'Русская',
                code: 'ru-RU',
                layout: 'ЙЦУКЕН'
            },
            en: {
                name: 'English',
                code: 'en-US', 
                layout: 'QWERTY'
            }
        },
        
        // Цвета для пальцев
        fingerColors: {
            pinky: '#ff7675',      // Мизинец - розовый
            ring: '#fdcb6e',       // Безымянный - оранжевый  
            middle: '#00b894',     // Средний - зеленый
            indexLeft: '#74b9ff',  // Указательный левый - голубой
            indexRight: '#0984e3', // Указательный правый - синий
            thumb: '#a29bfe'       // Большой - фиолетовый
        },
        
        // Настройки анимации
        animation: {
            keyPressDelay: 100,
            keyHighlightDuration: 1000,
            errorShakeDuration: 500
        }
    },
    
    // Уровни сложности
    difficultyLevels: {
        beginner: {
            name: 'Мизинец',
            description: 'Тренировка мизинцев',
            targetWPM: 15,
            maxErrors: 10,
            color: '#ff7675'
        },
        easy: {
            name: 'Безымянный', 
            description: 'Тренировка безымянных пальцев',
            targetWPM: 25,
            maxErrors: 8,
            color: '#fdcb6e'
        },
        medium: {
            name: 'Средний',
            description: 'Тренировка средних пальцев',
            targetWPM: 40,
            maxErrors: 6,
            color: '#00b894'
        },
        hard: {
            name: 'Указ. левый',
            description: 'Тренировка левого указательного',
            targetWPM: 60,
            maxErrors: 4,
            color: '#74b9ff'
        },
        expert: {
            name: 'Указ. правый',
            description: 'Тренировка правого указательного', 
            targetWPM: 80,
            maxErrors: 3,
            color: '#0984e3'
        },
        master: {
            name: 'Большой',
            description: 'Продвинутый уровень',
            targetWPM: 100,
            maxErrors: 2,
            color: '#a29bfe'
        }
    },
    
    // Система рейтинга
    rating: {
        // Критерии для звезд (WPM)
        stars: {
            1: { minWPM: 20, minAccuracy: 70 },
            2: { minWPM: 40, minAccuracy: 80 }, 
            3: { minWPM: 60, minAccuracy: 85 },
            4: { minWPM: 80, minAccuracy: 90 },
            5: { minWPM: 100, minAccuracy: 95 }
        },
        
        // Бонусы и штрафы
        accuracyBonus: {
            excellent: { threshold: 98, bonus: 1.2 },
            good: { threshold: 95, bonus: 1.1 },
            average: { threshold: 90, bonus: 1.0 },
            poor: { threshold: 85, bonus: 0.9 },
            bad: { threshold: 80, bonus: 0.8 }
        }
    },
    
    // Настройки локального хранилища
    storage: {
        keys: {
            bestStats: 'typing_trainer_best_stats',
            userSettings: 'typing_trainer_user_settings',
            userProfile: 'typing_trainer_user_profile',
            currentLesson: 'typing_trainer_current_lesson',
            // Карта { "1": {stars, bestWPM, bestAccuracy, completedAt}, ... }
            lessonProgress: 'typing_trainer_lesson_progress',
            testHistory: 'typing_trainer_test_history',
            currentLevel: 'typing_trainer_current_level'
        },

        // Максимальное количество сохраняемых результатов
        maxHistoryItems: 100
    },

    // Курсовая система (tier1 — канонический курс, см. data/lessons/tier1)
    lessons: {
        basePath: 'data/lessons',
        defaultTier: 'tier1',
        firstLessonNumber: 1,
        // Сколько уроков в каждом тире (для cap прогрессии)
        tierLessonCount: {
            tier1: 39,
            block_1: 11
        },
        // Задержка перед автозагрузкой следующего урока после успешного завершения (мс)
        autoAdvanceDelay: 4500
    },
    
    // Настройки интерфейса
    ui: {
        // Темы оформления
        themes: {
            light: {
                name: 'Светлая',
                primary: '#74b9ff',
                background: '#f5f5f5'
            },
            dark: {
                name: 'Темная', 
                primary: '#a29bfe',
                background: '#2d3436'
            }
        },
        
        // Анимации
        animations: {
            enabled: true,
            duration: 300,
            easing: 'ease-in-out'
        },
        
        // Звуки (для будущего использования)
        sounds: {
            enabled: false,
            volume: 0.5,
            keyPress: 'assets/sounds/keypress.mp3',
            error: 'assets/sounds/error.mp3',
            success: 'assets/sounds/success.mp3'
        }
    },
    
    // Настройки для детского режима
    kidsMode: {
        enabled: false,
        
        // Упрощенные тексты
        simpleTexts: true,
        
        // Крупный шрифт
        largeFonts: true,
        
        // Дополнительные анимации
        extraAnimations: true,
        
        // Поощрительные сообщения
        encouragementMessages: [
            'Отлично! 🎉',
            'Супер! 🌟', 
            'Здорово! 👍',
            'Молодец! 🎯',
            'Так держать! 🚀'
        ]
    },
    
    // Многоязычность
    i18n: {
        defaultLanguage: 'ru',
        supportedLanguages: ['ru', 'en'],
        
        // Автоопределение языка браузера
        autoDetect: true,
        
        // Папка с переводами
        translationsPath: 'data/i18n/'
    },
    
    // Аналитика и метрики (для будущего использования)
    analytics: {
        enabled: false,
        googleAnalyticsId: null,
        yandexMetricaId: null,
        
        // События для отслеживания
        trackingEvents: {
            testStart: 'test_start',
            testComplete: 'test_complete', 
            levelChange: 'level_change',
            errorMade: 'error_made'
        }
    },
    
    // Настройки безопасности
    security: {
        // Максимальная длина текста для ввода
        maxTextLength: 10000,
        
        // Защита от XSS
        sanitizeInput: true,
        
        // Максимальное время сессии (миллисекунды)
        maxSessionTime: 3600000 // 1 час
    }
};

// Функции для работы с настройками
const Settings = {
    // Получить значение настройки по пути
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let current = APP_CONFIG;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }
        
        return current;
    },
    
    // Получить всю конфигурацию
    getAll() {
        return { ...APP_CONFIG };
    },
    
    // Получить цвет для уровня сложности
    getLevelColor(level) {
        return this.get(`difficultyLevels.${level}.color`, '#74b9ff');
    },
    
    // Получить настройки клавиатуры
    getKeyboardSettings() {
        return this.get('keyboard', {});
    },
    
    // Получить критерии рейтинга
    getRatingCriteria() {
        return this.get('rating.stars', {});
    },
    
    // Получить настройки тестирования
    getTestingSettings() {
        return this.get('testing', {});
    },
    
    // Проверить, включен ли детский режим
    isKidsMode() {
        return this.get('kidsMode.enabled', false);
    }
};

// Экспорт для использования в других модулях
window.APP_CONFIG = APP_CONFIG;
window.Settings = Settings;

// Логирование загрузки настроек
console.log('⚙️ Настройки приложения загружены:', APP_CONFIG.name, 'v' + APP_CONFIG.version);