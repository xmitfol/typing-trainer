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

    // CSS custom properties для state-shadows из дизайн-спецификации
    // Хук: var(--finger-solid)/var(--finger-fill) в keyboard.css
    if (fingerInfo) {
        el.style.setProperty('--finger-solid', fingerInfo.solid);
        el.style.setProperty('--finger-fill', fingerInfo.fill);
    }

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
// Layouts
// ---------------------------------------------------------------------------

// Общий alpha-блок для Classic/Laptop (5 рядов + bottom с padRow)
function buildAlphaBlock(unit) {
    const { alpha, bottom } = window.KeyboardData.buildAlignedRows();
    const gap = unit * KB_GAP_FACTOR;
    const el = document.createElement('div');
    el.className = 'keyboard';
    el.style.gap = `${gap}px`;
    alpha.forEach(row => el.appendChild(createRow(row, unit)));
    el.appendChild(createRow(bottom, unit));
    return el;
}

// Numpad: CSS Grid 4×5 с span-2 для tall +/Enter и широкой 0
function buildNumpad(unit) {
    const Data = window.KeyboardData;
    const gap = unit * KB_GAP_FACTOR;
    const numpad = document.createElement('div');
    numpad.className = 'numpad';
    numpad.style.gap = `${gap}px`;
    numpad.style.gridTemplateColumns = `repeat(4, ${unit}px)`;
    numpad.style.gridTemplateRows = `repeat(5, ${unit * KB_KEY_HEIGHT_FACTOR}px)`;
    Data.NUMPAD.forEach(c => {
        const cell = document.createElement('div');
        cell.style.gridColumn = c.gc;
        cell.style.gridRow = c.gr;
        const keyEl = createKeyElement(c, unit);
        keyEl.style.width = '100%';
        keyEl.style.height = '100%';
        cell.appendChild(keyEl);
        numpad.appendChild(cell);
    });
    return numpad;
}

// Полный nav-блок (Ins/Home/PgUp + Del/End/PgDn + ↑←↓→)
function buildNavCluster(unit) {
    const Data = window.KeyboardData;
    const gap = unit * KB_GAP_FACTOR;
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = `${gap}px`;

    const navBlock = document.createElement('div');
    navBlock.className = 'navigation-block';
    navBlock.style.gap = `${gap}px`;
    Data.NAV.top.forEach(rowKeys => navBlock.appendChild(createRow(rowKeys, unit, 'nav-row')));
    wrapper.appendChild(navBlock);

    wrapper.appendChild(buildArrowCluster(unit, /* compact */ false));
    return wrapper;
}

// Стрелочный кластер (↑ / ←↓→). Compact-режим — уменьшенные клавиши для laptop.
function buildArrowCluster(unit, compact) {
    const Data = window.KeyboardData;
    const arrowUnit = compact ? unit * 0.85 : unit;
    const gap = arrowUnit * KB_GAP_FACTOR;

    const block = document.createElement('div');
    block.className = 'arrow-block';
    block.style.gap = `${gap}px`;

    // Ряд 1: spacer + ↑ + spacer
    const topRow = document.createElement('div');
    topRow.className = 'arrow-row';
    topRow.style.gap = `${gap}px`;
    const spacerL = document.createElement('div'); spacerL.style.width = `${arrowUnit}px`;
    topRow.appendChild(spacerL);
    topRow.appendChild(createKeyElement(Data.NAV.arrows.up, arrowUnit));
    const spacerR = document.createElement('div'); spacerR.style.width = `${arrowUnit}px`;
    topRow.appendChild(spacerR);
    block.appendChild(topRow);

    // Ряд 2: ← ↓ →
    block.appendChild(createRow(
        [Data.NAV.arrows.left, Data.NAV.arrows.down, Data.NAV.arrows.right],
        arrowUnit,
        'arrow-row'
    ));
    return block;
}

// Layout: Classic — alpha + nav cluster + numpad
function renderClassicKeyboard(container, unit) {
    container.innerHTML = '';
    container.style.gap = `${unit * 0.4}px`;
    container.appendChild(buildAlphaBlock(unit));

    const rightSection = document.createElement('div');
    rightSection.className = 'right-section';
    rightSection.style.gap = `${unit * KB_GAP_FACTOR}px`;
    rightSection.appendChild(buildNavCluster(unit));
    rightSection.appendChild(buildNumpad(unit));
    container.appendChild(rightSection);
}

// Layout: Laptop — только alpha + компактный inline-arrow-кластер справа снизу
function renderLaptopKeyboard(container, unit) {
    container.innerHTML = '';
    container.style.gap = `${unit * 0.3}px`;
    container.style.alignItems = 'flex-end';

    container.appendChild(buildAlphaBlock(unit));

    // Компактные стрелки прижаты к низу alpha-блока (alignItems: flex-end)
    const arrows = buildArrowCluster(unit, /* compact */ true);
    arrows.classList.add('arrow-block-laptop');
    container.appendChild(arrows);
}

// Public: переключение layout без полного reinit (используется onboarding-complete listener)
function renderKeyboard(variant, unit) {
    const container = document.querySelector('.keyboard-container');
    if (!container) return;
    const u = unit || KB_DEFAULT_UNIT;
    if (variant === 'laptop') {
        renderLaptopKeyboard(container, u);
    } else {
        renderClassicKeyboard(container, u);
    }
}

// ---------------------------------------------------------------------------
// Init + Public API
// ---------------------------------------------------------------------------

function readProfileKeyboardType() {
    try {
        const key = (window.Settings && window.Settings.get('storage.keys.userProfile'))
            || 'typing_trainer_user_profile';
        const raw = localStorage.getItem(key);
        if (!raw) return 'classic';
        const profile = JSON.parse(raw);
        return profile.keyboardType || 'classic';
    } catch (e) { return 'classic'; }
}

function initKeyboard() {
    console.log('🎹 Инициализация виртуальной клавиатуры (data-driven)...');
    try {
        const container = document.querySelector('.keyboard-container');
        if (!container) {
            console.error('.keyboard-container не найден');
            return;
        }

        const initialLayout = readProfileKeyboardType();
        renderKeyboard(initialLayout, KB_DEFAULT_UNIT);

        // Mouse-обработчики на клавишах — делегированно на контейнер
        container.addEventListener('mousedown', onKeyMouseDown);
        container.addEventListener('mouseup', onKeyMouseUp);
        container.addEventListener('contextmenu', preventContextOnKey);

        // Live re-render при смене профиля (welcome modal close → applyKeyboardLayout)
        document.addEventListener('typingtrainer:onboardingComplete', () => {
            renderKeyboard(readProfileKeyboardType(), KB_DEFAULT_UNIT);
        });

        console.log(`✅ Виртуальная клавиатура инициализирована (layout: ${initialLayout})`);
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
window.renderKeyboard = renderKeyboard;
window.highlightKey = highlightKey;
window.pressKey = pressKey;
window.releaseKey = releaseKey;
window.clearKeyHighlights = clearKeyHighlights;
window.clearAllKeyStates = clearAllKeyStates;
window.animateCorrectKey = animateCorrectKey;
window.animateIncorrectKey = animateIncorrectKey;
window.getKeyboardInfo = getKeyboardInfo;

console.log('🎹 Модуль клавиатуры загружен (data-driven renderer v2)');
