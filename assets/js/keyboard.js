// assets/js/keyboard.js - Управление виртуальной клавиатурой.
// Phase 1: data-driven renderer из keyboard-data.js (Classic layout).
// Сохраняет публичный API initKeyboard/highlightKey/pressKey/releaseKey/etc.
// и data-key атрибуты — back-compat с main.js (input → highlight).

const KB_DEFAULT_UNIT = 50;       // десктоп default — переопределяется в Phase 5 (responsive)
const KB_GAP_FACTOR = 0.08;       // gap = unit * 0.08 ≈ 4px
const KB_KEY_HEIGHT_FACTOR = 0.92;

let currentHighlightedKey = null;
const currentPressedKeys = new Set();

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function createKeyElement(keyData, unit) {
    const el = document.createElement('div');
    const fingerInfo = (window.KeyboardData && window.KeyboardData.FINGER[keyData.f]) || null;
    const fingerClass = fingerInfo ? fingerInfo.cssClass : '';

    el.className = 'key' + (fingerClass ? ` ${fingerClass}` : '') + (keyData.mod ? ' mod' : '') + (keyData.home ? ' home-key' : '');
    if (keyData.code) el.dataset.code = keyData.code;
    if (keyData.f) el.dataset.finger = keyData.f;

    // data-key — для back-compat с highlightKey/pressKey (ищут [data-key=…])
    // Приоритет: явное поле keyData.key (например "Backspace"/" "/"Shift"),
    // иначе lowercase label (для буквы/цифры). У символов как ё это тоже работает.
    const dataKey = keyData.key !== undefined
        ? keyData.key
        : (keyData.l && keyData.l.length === 1 ? keyData.l.toLowerCase() : keyData.l || '');
    if (dataKey !== '') el.dataset.key = dataKey;

    // Размеры — inline, потому что зависят от unit
    const widthU = keyData.w || 1;
    el.style.width = `${widthU * unit}px`;
    el.style.height = `${unit * KB_KEY_HEIGHT_FACTOR}px`;
    el.style.borderRadius = `${unit * 0.14}px`;
    el.style.padding = `${unit * 0.12}px`;
    el.style.fontSize = (keyData.mod && keyData.l && keyData.l.length > 2)
        ? `${unit * 0.22}px`
        : `${unit * 0.32}px`;
    // Длинные модификаторы (Caps Lock, Enter, Shift) — Manrope, остальное — JetBrains Mono
    el.style.fontFamily = (keyData.mod && keyData.l && keyData.l.length > 2)
        ? '"Manrope", ui-sans-serif, system-ui, sans-serif'
        : '"JetBrains Mono", ui-monospace, "Consolas", monospace';

    // Upper-char (Shift-символ) — отдельный спан в правом-верхнем углу
    if (keyData.u && !keyData.mod) {
        const upper = document.createElement('span');
        upper.className = 'key-upper';
        upper.textContent = keyData.u;
        upper.style.fontSize = `${unit * 0.2}px`;
        el.appendChild(upper);
    }

    // Основной символ
    const label = document.createElement('span');
    label.className = 'key-label';
    label.textContent = keyData.l;
    el.appendChild(label);

    // Home-row bump (для А, О, 5)
    if (keyData.home) {
        const bump = document.createElement('span');
        bump.className = 'key-home-bump';
        bump.style.width = `${unit * 0.22}px`;
        bump.style.height = `${unit * 0.05}px`;
        bump.style.bottom = `${unit * 0.08}px`;
        el.appendChild(bump);
    }

    return el;
}

function createRow(keys, unit, className) {
    const row = document.createElement('div');
    row.className = className || 'keyboard-row';
    row.style.gap = `${unit * KB_GAP_FACTOR}px`;
    keys.forEach(k => row.appendChild(createKeyElement(k, unit)));
    return row;
}

// ---------------------------------------------------------------------------
// Layout: Classic
// ---------------------------------------------------------------------------

function renderClassicKeyboard(container, unit) {
    const Data = window.KeyboardData;
    if (!Data) {
        console.error('KeyboardData not loaded');
        return;
    }
    const { alpha, bottom } = Data.buildAlignedRows();
    const gap = unit * KB_GAP_FACTOR;

    container.innerHTML = '';

    // Главный flex-контейнер: alpha-блок + правая секция
    container.style.gap = `${unit * 0.4}px`;

    // Alpha block (5 рядов с padRow-выравниванием)
    const keyboardEl = document.createElement('div');
    keyboardEl.className = 'keyboard';
    keyboardEl.style.gap = `${gap}px`;
    alpha.forEach(row => keyboardEl.appendChild(createRow(row, unit)));
    keyboardEl.appendChild(createRow(bottom, unit));
    container.appendChild(keyboardEl);

    // Right section: navigation + arrows + numpad
    const rightSection = document.createElement('div');
    rightSection.className = 'right-section';
    rightSection.style.gap = `${gap}px`;

    // Nav block (Ins/Home/PgUp над Del/End/PgDn)
    const navBlock = document.createElement('div');
    navBlock.className = 'navigation-block';
    navBlock.style.gap = `${gap}px`;
    Data.NAV.top.forEach(rowKeys => navBlock.appendChild(createRow(rowKeys, unit, 'nav-row')));
    rightSection.appendChild(navBlock);

    // Arrows (↑ / ←↓→) — крест внизу слева
    const arrowBlock = document.createElement('div');
    arrowBlock.className = 'arrow-block';
    arrowBlock.style.gap = `${gap}px`;
    // Spacer-ряд (две пустые позиции по бокам от стрелки вверх)
    const topArrowRow = document.createElement('div');
    topArrowRow.className = 'arrow-row';
    topArrowRow.style.gap = `${gap}px`;
    const spacerL = document.createElement('div'); spacerL.style.width = `${unit}px`;
    topArrowRow.appendChild(spacerL);
    topArrowRow.appendChild(createKeyElement(Data.NAV.arrows.up, unit));
    const spacerR = document.createElement('div'); spacerR.style.width = `${unit}px`;
    topArrowRow.appendChild(spacerR);
    arrowBlock.appendChild(topArrowRow);
    arrowBlock.appendChild(createRow([Data.NAV.arrows.left, Data.NAV.arrows.down, Data.NAV.arrows.right], unit, 'arrow-row'));
    rightSection.appendChild(arrowBlock);

    // Numpad — CSS Grid 4x5 с span-2 для +/Enter/0
    const numpad = document.createElement('div');
    numpad.className = 'numpad';
    numpad.style.gap = `${gap}px`;
    numpad.style.gridTemplateColumns = `repeat(4, ${unit}px)`;
    numpad.style.gridTemplateRows = `repeat(5, ${unit * KB_KEY_HEIGHT_FACTOR}px)`;
    Data.NUMPAD.forEach(c => {
        const cell = document.createElement('div');
        cell.style.gridColumn = c.gc;
        cell.style.gridRow = c.gr;
        // Для tall/wide клавиш width/height клавиши = 100% ячейки
        const keyEl = createKeyElement(c, unit);
        keyEl.style.width = '100%';
        keyEl.style.height = '100%';
        cell.appendChild(keyEl);
        numpad.appendChild(cell);
    });
    rightSection.appendChild(numpad);

    container.appendChild(rightSection);
}

// ---------------------------------------------------------------------------
// Init + Public API
// ---------------------------------------------------------------------------

function initKeyboard() {
    console.log('🎹 Инициализация виртуальной клавиатуры (data-driven)...');
    try {
        const container = document.querySelector('.keyboard-container');
        if (!container) {
            console.error('.keyboard-container не найден');
            return;
        }
        // Определить layout из класса (set'ит onboarding.js applyKeyboardLayout)
        // В Phase 1 рендерим всегда Classic — Phase 3/4 добавят laptop/ergo
        renderClassicKeyboard(container, KB_DEFAULT_UNIT);

        // Mouse-обработчики на клавишах (симуляция нажатия)
        container.addEventListener('mousedown', onKeyMouseDown);
        container.addEventListener('mouseup', onKeyMouseUp);
        container.addEventListener('contextmenu', preventContextOnKey);

        console.log('✅ Виртуальная клавиатура инициализирована');
    } catch (error) {
        console.error('❌ Ошибка инициализации клавиатуры:', error);
    }
}

function onKeyMouseDown(e) {
    const key = e.target.closest('.key');
    if (!key || !key.dataset.key) return;
    e.preventDefault();
    simulateKeyPress(key.dataset.key);
}

function onKeyMouseUp(e) {
    const key = e.target.closest('.key');
    if (!key || !key.dataset.key) return;
    e.preventDefault();
    releaseKey(key.dataset.key);
}

function preventContextOnKey(e) {
    if (e.target.closest('.key')) e.preventDefault();
}

function simulateKeyPress(keyValue) {
    try {
        const hiddenInput = document.getElementById('hiddenInput');
        if (!hiddenInput) return;
        const currentValue = hiddenInput.value;
        if (keyValue === ' ') {
            hiddenInput.value = currentValue + ' ';
        } else if (keyValue === 'Backspace') {
            hiddenInput.value = currentValue.slice(0, -1);
        } else if (keyValue.length === 1) {
            hiddenInput.value = currentValue + keyValue;
        }
        hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
        hiddenInput.focus();
    } catch (error) {
        console.error('❌ Ошибка симуляции нажатия:', error);
    }
}

// ---------------------------------------------------------------------------
// Public state API (back-compat для main.js)
// ---------------------------------------------------------------------------

function findKeyByChar(char) {
    if (!char) return null;
    // 1) Точное соответствие по data-key
    let el = document.querySelector(`.key[data-key="${cssEscape(char)}"]`);
    if (el) return el;
    // 2) Case-insensitive поиск по lowercase data-key
    if (typeof char === 'string') {
        el = document.querySelector(`.key[data-key="${cssEscape(char.toLowerCase())}"]`);
        if (el) return el;
    }
    // 3) Спец-случаи
    if (char === ' ') return document.querySelector('.key[data-code="Space"]');
    return null;
}

function cssEscape(s) {
    return String(s).replace(/(["\\])/g, '\\$1');
}

function highlightKey(char) {
    clearKeyHighlights();
    if (!char) return;
    const el = findKeyByChar(char);
    if (el) {
        el.classList.add('highlight');
        currentHighlightedKey = el;
        if (window.DebugUtils) DebugUtils.log('🔆 Подсвечена клавиша:', char);
    }
}

function pressKey(key, code) {
    currentPressedKeys.add(key);
    let el = (code && document.querySelector(`.key[data-code="${cssEscape(code)}"]`)) || findKeyByChar(key);
    if (el) {
        el.classList.add('active');
        if (window.DebugUtils) DebugUtils.log('⌨️ Нажата клавиша:', key);
    }
}

function releaseKey(key, code) {
    currentPressedKeys.delete(key);
    let el = (code && document.querySelector(`.key[data-code="${cssEscape(code)}"]`)) || findKeyByChar(key);
    if (el) el.classList.remove('active');
}

function clearKeyHighlights() {
    document.querySelectorAll('.key.highlight').forEach(k => k.classList.remove('highlight'));
    currentHighlightedKey = null;
}

function clearAllKeyStates() {
    document.querySelectorAll('.key').forEach(k => {
        k.classList.remove('active', 'highlight', 'correct-press', 'incorrect-press');
    });
    currentPressedKeys.clear();
    currentHighlightedKey = null;
}

function animateCorrectKey(char) {
    const el = findKeyByChar(char);
    if (!el) return;
    el.classList.add('correct-press');
    setTimeout(() => el.classList.remove('correct-press'), 300);
}

function animateIncorrectKey(char) {
    const el = findKeyByChar(char);
    if (!el) return;
    el.classList.add('incorrect-press');
    setTimeout(() => el.classList.remove('incorrect-press'), 500);
}

function getKeyboardInfo() {
    return {
        totalKeys: document.querySelectorAll('.key[data-key]').length,
        highlightedKey: currentHighlightedKey?.dataset?.key || null,
        pressedKeys: Array.from(currentPressedKeys),
        isInitialized: true
    };
}

// Экспорт глобальных функций (back-compat с main.js)
window.initKeyboard = initKeyboard;
window.highlightKey = highlightKey;
window.pressKey = pressKey;
window.releaseKey = releaseKey;
window.clearKeyHighlights = clearKeyHighlights;
window.clearAllKeyStates = clearAllKeyStates;
window.animateCorrectKey = animateCorrectKey;
window.animateIncorrectKey = animateIncorrectKey;
window.getKeyboardInfo = getKeyboardInfo;

console.log('🎹 Модуль клавиатуры загружен (data-driven renderer v2)');
