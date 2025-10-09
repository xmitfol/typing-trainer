// assets/js/utils.js - Вспомогательные функции

// Утилиты для работы с DOM
const DOMUtils = {
    // Поиск элементов с проверкой существования
    $(selector) {
        const element = document.querySelector(selector);
        if (!element) {
            console.warn(`Элемент не найден: ${selector}`);
        }
        return element;
    },
    
    // Поиск всех элементов
    $$(selector) {
        return document.querySelectorAll(selector);
    },
    
    // Создание элемента с атрибутами
    createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'dataset') {
                Object.keys(attributes[key]).forEach(dataKey => {
                    element.dataset[dataKey] = attributes[key][dataKey];
                });
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        if (content) {
            element.innerHTML = content;
        }
        
        return element;
    },
    
    // Добавление обработчика событий с проверкой
    addEventListeners(elements, event, handler) {
        const elementArray = Array.isArray(elements) ? elements : [elements];
        
        elementArray.forEach(element => {
            if (element && typeof element.addEventListener === 'function') {
                element.addEventListener(event, handler);
            }
        });
    },
    
    // Переключение класса
    toggleClass(element, className, condition) {
        if (!element) return;
        
        if (condition === undefined) {
            element.classList.toggle(className);
        } else {
            element.classList.toggle(className, condition);
        }
    },
    
    // Плавная прокрутка к элементу
    scrollTo(element, options = {}) {
        if (!element) return;
        
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            ...options
        });
    }
};

// Утилиты для работы со временем
const TimeUtils = {
    // Форматирование времени в MM:SS
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    },
    
    // Получение читаемого времени (например, "2 минуты назад")
    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} ${this.pluralize(days, 'день', 'дня', 'дней')} назад`;
        if (hours > 0) return `${hours} ${this.pluralize(hours, 'час', 'часа', 'часов')} назад`;
        if (minutes > 0) return `${minutes} ${this.pluralize(minutes, 'минуту', 'минуты', 'минут')} назад`;
        return 'только что';
    },
    
    // Склонение русских слов
    pluralize(count, one, two, five) {
        const mod10 = count % 10;
        const mod100 = count % 100;
        
        if (mod100 >= 11 && mod100 <= 19) return five;
        if (mod10 === 1) return one;
        if (mod10 >= 2 && mod10 <= 4) return two;
        return five;
    }
};

// Утилиты для работы с локальным хранилищем
const StorageUtils = {
    // Сохранение данных с обработкой ошибок
    set(key, data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error('Ошибка сохранения в localStorage:', error);
            return false;
        }
    },
    
    // Получение данных с проверкой
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;
            return JSON.parse(item);
        } catch (error) {
            console.error('Ошибка чтения из localStorage:', error);
            return defaultValue;
        }
    },
    
    // Удаление данных
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Ошибка удаления из localStorage:', error);
            return false;
        }
    },
    
    // Очистка всех данных приложения
    clear() {
        try {
            const keys = Object.keys(localStorage);
            const appKeys = keys.filter(key => key.startsWith('typing_trainer_'));
            
            appKeys.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Ошибка очистки localStorage:', error);
            return false;
        }
    },
    
    // Получение размера занятого места
    getUsage() {
        try {
            let total = 0;
            const keys = Object.keys(localStorage);
            
            keys.forEach(key => {
                if (key.startsWith('typing_trainer_')) {
                    total += localStorage.getItem(key).length;
                }
            });
            
            return {
                bytes: total,
                kb: Math.round(total / 1024),
                mb: Math.round(total / 1024 / 1024 * 100) / 100
            };
        } catch (error) {
            console.error('Ошибка подсчета размера localStorage:', error);
            return { bytes: 0, kb: 0, mb: 0 };
        }
    }
};

// Утилиты для математических вычислений
const MathUtils = {
    // Ограничение числа в диапазоне
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    // Линейная интерполяция
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    },
    
    // Округление до определенного количества знаков
    round(value, decimals = 0) {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    },
    
    // Среднее значение массива
    average(numbers) {
        if (!numbers.length) return 0;
        return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    },
    
    // Медиана массива
    median(numbers) {
        if (!numbers.length) return 0;
        
        const sorted = [...numbers].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }
        
        return sorted[middle];
    },
    
    // Процентиль
    percentile(numbers, percentile) {
        if (!numbers.length) return 0;
        
        const sorted = [...numbers].sort((a, b) => a - b);
        const index = (percentile / 100) * (sorted.length - 1);
        
        if (Math.floor(index) === index) {
            return sorted[index];
        }
        
        const lower = sorted[Math.floor(index)];
        const upper = sorted[Math.ceil(index)];
        return lower + (upper - lower) * (index - Math.floor(index));
    }
};

// Утилиты для анимаций
const AnimationUtils = {
    // Простая анимация значения
    animate(from, to, duration, callback, easing = this.easeOutCubic) {
        const startTime = performance.now();
        
        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easing(progress);
            const value = from + (to - from) * easedProgress;
            
            callback(value, progress);
            
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };
        
        requestAnimationFrame(step);
    },
    
    // Функции сглаживания
    easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    },
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
};

// Утилиты для работы с текстом
const TextUtils = {
    // Подсчет слов в тексте
    countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    },
    
    // Подсчет символов без пробелов
    countCharacters(text, includeSpaces = true) {
        if (includeSpaces) {
            return text.length;
        }
        return text.replace(/\s/g, '').length;
    },
    
    // Очистка текста от лишних символов
    sanitize(text) {
        return text
            .replace(/\s+/g, ' ') // Заменяем множественные пробелы на одинарные
            .replace(/\n+/g, ' ') // Заменяем переносы строк на пробелы
            .trim(); // Убираем пробелы в начале и конце
    },
    
    // Получение случайного элемента из массива
    getRandomItem(array) {
        if (!array.length) return null;
        return array[Math.floor(Math.random() * array.length)];
    },
    
    // Разбивка текста на слова с сохранением позиций
    tokenize(text) {
        const words = [];
        const regex = /\S+/g;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            words.push({
                word: match[0],
                start: match.index,
                end: match.index + match[0].length
            });
        }
        
        return words;
    }
};

// Утилиты для уведомлений
const NotificationUtils = {
    // Показать уведомление
    show(message, type = 'info', duration = 3000) {
        const notification = DOMUtils.createElement('div', {
            className: `notification ${type}`
        }, `
            <div class="notification-content">
                ${message}
            </div>
        `);
        
        document.body.appendChild(notification);
        
        // Показываем с анимацией
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Автоматически скрываем
        if (duration > 0) {
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, duration);
        }
        
        return notification;
    },
    
    // Показать успешное сообщение
    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    },
    
    // Показать ошибку
    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    },
    
    // Показать предупреждение
    warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }
};

// Утилиты для дебаггинга
const DebugUtils = {
    // Логирование с временной меткой
    log(...args) {
        if (Settings?.get('debug.enabled', false)) {
            console.log(`[${new Date().toLocaleTimeString()}]`, ...args);
        }
    },
    
    // Измерение производительности
    time(label) {
        console.time(label);
    },
    
    timeEnd(label) {
        console.timeEnd(label);
    },
    
    // Профилирование функции
    profile(fn, name = 'function') {
        return (...args) => {
            const start = performance.now();
            const result = fn.apply(this, args);
            const end = performance.now();
            
            console.log(`⏱️ ${name} выполнена за ${(end - start).toFixed(2)}ms`);
            return result;
        };
    }
};

// Экспорт утилит в глобальную область видимости
window.DOMUtils = DOMUtils;
window.TimeUtils = TimeUtils;
window.StorageUtils = StorageUtils;
window.MathUtils = MathUtils;
window.AnimationUtils = AnimationUtils;
window.TextUtils = TextUtils;
window.NotificationUtils = NotificationUtils;
window.DebugUtils = DebugUtils;

// Сокращенные алиасы для удобства
window.$ = DOMUtils.$;
window.$$ = DOMUtils.$$;

console.log('🛠️ Утилиты загружены и готовы к использованию');