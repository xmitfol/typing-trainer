// assets/js/keyboard.js - Управление виртуальной клавиатурой

// Маппинг клавиш для правильного отображения
const keyMapping = {
    ' ': 'spacebar',
    'Backspace': 'backspace',
    'Enter': 'enter',
    'Tab': 'tab',
    'CapsLock': 'caps',
    'Shift': 'shift-left',
    'Control': 'ctrl',
    'Alt': 'alt'
};

// Обратный маппинг для поиска клавиш по символу
const charToKey = {
    // Русская раскладка
    'ё': 'ё', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '0': '0', '-': '-', '=': '=',
    'й': 'й', 'ц': 'ц', 'у': 'у', 'к': 'к', 'е': 'е', 'н': 'н', 'г': 'г', 'ш': 'ш', 'щ': 'щ', 'з': 'з', 'х': 'х', 'ъ': 'ъ',
    'ф': 'ф', 'ы': 'ы', 'в': 'в', 'а': 'а', 'п': 'п', 'р': 'р', 'о': 'о', 'л': 'л', 'д': 'д', 'ж': 'ж', 'э': 'э',
    'я': 'я', 'ч': 'ч', 'с': 'с', 'м': 'м', 'и': 'и', 'т': 'т', 'ь': 'ь', 'б': 'б', 'ю': 'ю', '.': '.',
    ',': ',', '!': '!', '?': '?', ':': ':', ';': ';', '"': '"', "'": "'", '(': '(', ')': ')',
    ' ': ' ' // пробел
};

let currentHighlightedKey = null;
let currentPressedKeys = new Set();

// Инициализация клавиатуры
function initKeyboard() {
    console.log('🎹 Инициализация виртуальной клавиатуры...');
    
    try {
        // Добавляем обработчики для всех клавиш
        const keys = document.querySelectorAll('.key');
        
        keys.forEach(key => {
            // Обработка клика мышью по клавише
            key.addEventListener('mousedown', function(e) {
                e.preventDefault(); // Предотвращаем потерю фокуса
                const keyValue = this.dataset.key;
                if (keyValue) {
                    simulateKeyPress(keyValue);
                }
            });
            
            key.addEventListener('mouseup', function(e) {
                e.preventDefault();
                const keyValue = this.dataset.key;
                if (keyValue) {
                    simulateKeyRelease(keyValue);
                }
            });
            
            // Предотвращаем контекстное меню
            key.addEventListener('contextmenu', function(e) {
                e.preventDefault();
            });
        });
        
        console.log('✅ Виртуальная клавиатура инициализирована');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации клавиатуры:', error);
    }
}

// Симуляция нажатия клавиши через виртуальную клавиатуру
function simulateKeyPress(keyValue) {
    try {
        const hiddenInput = document.getElementById('hiddenInput');
        if (!hiddenInput) return;
        
        // Получаем текущее значение
        let currentValue = hiddenInput.value;
        
        if (keyValue === ' ') {
            // Пробел
            hiddenInput.value = currentValue + ' ';
        } else if (keyValue === 'Backspace') {
            // Удаление
            hiddenInput.value = currentValue.slice(0, -1);
        } else if (keyValue.length === 1) {
            // Обычный символ
            hiddenInput.value = currentValue + keyValue;
        }
        
        // Вызываем событие input для обновления логики
        const inputEvent = new Event('input', { bubbles: true });
        hiddenInput.dispatchEvent(inputEvent);
        
        // Возвращаем фокус на скрытое поле
        hiddenInput.focus();
        
    } catch (error) {
        console.error('❌ Ошибка симуляции нажатия:', error);
    }
}

// Симуляция отпускания клавиши
function simulateKeyRelease(keyValue) {
    // Убираем подсветку с виртуальной клавиши
    releaseKey(keyValue);
}

// Подсветка нужной клавиши
function highlightKey(char) {
    try {
        // Убираем предыдущую подсветку
        clearKeyHighlights();
        
        if (!char) return;
        
        // Ищем клавишу для подсветки
        const keyToHighlight = findKeyByChar(char);
        
        if (keyToHighlight) {
            keyToHighlight.classList.add('highlight');
            currentHighlightedKey = keyToHighlight;
            
            DebugUtils.log('🔆 Подсвечена клавиша:', char);
        }
        
    } catch (error) {
        console.error('❌ Ошибка подсветки клавиши:', error);
    }
}

// Поиск клавиши по символу
function findKeyByChar(char) {
    try {
        // Сначала ищем точное соответствие по data-key
        let keyElement = document.querySelector(`[data-key="${char}"]`);
        
        if (!keyElement) {
            // Ищем по содержимому клавиши
            const allKeys = document.querySelectorAll('.key[data-key]');
            keyElement = Array.from(allKeys).find(key => {
                const keyText = key.textContent.trim().toLowerCase();
                const charLower = char.toLowerCase();
                return keyText === charLower || keyText === char;
            });
        }
        
        // Специальные случаи
        if (!keyElement && char === ' ') {
            keyElement = document.querySelector('.spacebar');
        }
        
        // Для стрелочек
        if (!keyElement) {
            switch(char) {
                case 'ArrowUp':
                    keyElement = document.querySelector('[data-key="ArrowUp"]');
                    break;
                case 'ArrowDown':
                    keyElement = document.querySelector('[data-key="ArrowDown"]');
                    break;
                case 'ArrowLeft':
                    keyElement = document.querySelector('[data-key="ArrowLeft"]');
                    break;
                case 'ArrowRight':
                    keyElement = document.querySelector('[data-key="ArrowRight"]');
                    break;
            }
        }
        
        return keyElement;
        
    } catch (error) {
        console.error('❌ Ошибка поиска клавиши:', error);
        return null;
    }
}

// Обработка нажатия физической клавиши
function pressKey(key, code) {
    try {
        // Добавляем клавишу в набор нажатых
        currentPressedKeys.add(key);
        
        // Ищем соответствующую виртуальную клавишу
        let keyElement = findKeyByChar(key);
        
        // Специальная обработка для служебных клавиш
        if (!keyElement) {
            switch(key) {
                case ' ':
                    keyElement = document.querySelector('.spacebar');
                    break;
                case 'Backspace':
                    keyElement = document.querySelector('.backspace');
                    break;
                case 'Enter':
                    keyElement = document.querySelector('.enter');
                    break;
                case 'Tab':
                    keyElement = document.querySelector('.tab');
                    break;
                case 'CapsLock':
                    keyElement = document.querySelector('.caps');
                    break;
                case 'Shift':
                    keyElement = document.querySelector('.shift-left');
                    break;
            }
        }
        
        if (keyElement) {
            keyElement.classList.add('active');
            DebugUtils.log('⌨️ Нажата клавиша:', key);
        }
        
    } catch (error) {
        console.error('❌ Ошибка обработки нажатия:', error);
    }
}

// Обработка отпускания физической клавиши
function releaseKey(key, code) {
    try {
        // Убираем клавишу из набора нажатых
        currentPressedKeys.delete(key);
        
        // Ищем соответствующую виртуальную клавишу
        let keyElement = findKeyByChar(key);
        
        // Специальная обработка для служебных клавиш
        if (!keyElement) {
            switch(key) {
                case ' ':
                    keyElement = document.querySelector('.spacebar');
                    break;
                case 'Backspace':
                    keyElement = document.querySelector('.backspace');
                    break;
                case 'Enter':
                    keyElement = document.querySelector('.enter');
                    break;
                case 'Tab':
                    keyElement = document.querySelector('.tab');
                    break;
                case 'CapsLock':
                    keyElement = document.querySelector('.caps');
                    break;
                case 'Shift':
                    keyElement = document.querySelector('.shift-left');
                    break;
            }
        }
        
        if (keyElement) {
            keyElement.classList.remove('active');
        }
        
    } catch (error) {
        console.error('❌ Ошибка обработки отпускания:', error);
    }
}

// Очистка всех подсветок
function clearKeyHighlights() {
    try {
        // Убираем все подсветки
        const highlightedKeys = document.querySelectorAll('.key.highlight');
        highlightedKeys.forEach(key => {
            key.classList.remove('highlight');
        });
        currentHighlightedKey = null;
        
    } catch (error) {
        console.error('❌ Ошибка очистки подсветок:', error);
    }
}

// Очистка всех состояний клавиш
function clearAllKeyStates() {
    try {
        // Убираем все активные состояния и подсветки
        const allKeys = document.querySelectorAll('.key');
        allKeys.forEach(key => {
            key.classList.remove('active', 'highlight', 'correct-press', 'incorrect-press');
        });
        
        currentPressedKeys.clear();
        currentHighlightedKey = null;
        
        DebugUtils.log('🧹 Все состояния клавиш очищены');
        
    } catch (error) {
        console.error('❌ Ошибка очистки состояний:', error);
    }
}

// Анимация правильного нажатия
function animateCorrectKey(char) {
    try {
        const keyElement = findKeyByChar(char);
        if (keyElement) {
            keyElement.classList.add('correct-press');
            setTimeout(() => {
                keyElement.classList.remove('correct-press');
            }, 300);
        }
    } catch (error) {
        console.error('❌ Ошибка анимации правильной клавиши:', error);
    }
}

// Анимация неправильного нажатия
function animateIncorrectKey(char) {
    try {
        const keyElement = findKeyByChar(char);
        if (keyElement) {
            keyElement.classList.add('incorrect-press');
            setTimeout(() => {
                keyElement.classList.remove('incorrect-press');
            }, 500);
        }
    } catch (error) {
        console.error('❌ Ошибка анимации неправильной клавиши:', error);
    }
}

// Получение информации о клавиатуре
function getKeyboardInfo() {
    return {
        totalKeys: document.querySelectorAll('.key[data-key]').length,
        highlightedKey: currentHighlightedKey?.dataset?.key || null,
        pressedKeys: Array.from(currentPressedKeys),
        isInitialized: true
    };
}

// Экспортируем функции в глобальную область видимости
window.initKeyboard = initKeyboard;
window.highlightKey = highlightKey;
window.pressKey = pressKey;
window.releaseKey = releaseKey;
window.clearKeyHighlights = clearKeyHighlights;
window.clearAllKeyStates = clearAllKeyStates;
window.animateCorrectKey = animateCorrectKey;
window.animateIncorrectKey = animateIncorrectKey;
window.getKeyboardInfo = getKeyboardInfo;

// Логирование загрузки модуля
console.log('🎹 Модуль клавиатуры загружен и готов к работе');