// assets/js/keyboard.js - Управление виртуальной клавиатурой.
// Phase 1: data-driven renderer из keyboard-data.js (Classic layout).
// Сохраняет публичный API initKeyboard/highlightKey/pressKey/releaseKey/etc.
// и data-key атрибуты — back-compat с main.js (input → highlight).

const KB_GAP_FACTOR = 0.08;       // gap = unit * 0.08
const KB_KEY_HEIGHT_FACTOR = 0.92;

// Responsive unit table из дизайн-handoff'а
// (window width >= breakpoint → выбранный unit). Mobile <420 — fallback.
const KB_UNIT_BREAKPOINTS = [
    { minWidth: 1400, unit: 60 },   // Desktop
    { minWidth: 1180, unit: 48 },   // Laptop
    { minWidth: 820,  unit: 38 },   // Tablet
    { minWidth: 0,    unit: 22 },   // Mobile
];

function getResponsiveUnit() {
    const w = window.innerWidth || 1400;
    const found = KB_UNIT_BREAKPOINTS.find(b => w >= b.minWidth);
    return (found && found.unit) || 50;
}

// Legacy alias (некоторые места всё ещё могут вызывать без unit)
const KB_DEFAULT_UNIT = 50;

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

// Половина клавиатуры для ergonomic (rows + thumb-row для своей стороны)
function buildKeyboardHalf(side, unit) {
    const Data = window.KeyboardData;
    const gap = unit * KB_GAP_FACTOR;

    const half = document.createElement('div');
    half.className = `ergo-half ergo-half-${side}`;
    half.style.display = 'flex';
    half.style.flexDirection = 'column';
    half.style.gap = `${gap}px`;

    // Staggered offset — каждый ряд ниже сдвинут наружу от центра (левая — влево, правая — вправо)
    const offsets = [0, 0, unit * 0.25, unit * 0.5];

    Data.ROWS.forEach((rowData, ri) => {
        const keys = rowData[side];
        const row = createRow(keys, unit);
        row.style.gap = `${gap}px`;
        // justify: левая половина — flex-end (прижать к gap), правая — flex-start
        row.style.justifyContent = side === 'left' ? 'flex-end' : 'flex-start';
        const off = offsets[ri] || 0;
        if (off) {
            row.style.transform = `translateX(${side === 'left' ? -off : off}px)`;
        }
        half.appendChild(row);
    });

    // Thumb row (split-Space + модификаторы для своей стороны)
    const thumb = Data.THUMB_ROWS.minimal[side];
    const thumbRow = createRow(thumb, unit);
    thumbRow.style.gap = `${gap}px`;
    thumbRow.style.justifyContent = side === 'left' ? 'flex-end' : 'flex-start';
    thumbRow.style.marginTop = `${unit * 0.12}px`;
    half.appendChild(thumbRow);

    return half;
}

// Layout: Ergonomic — две половины с rotate ±angle и gap между ними
function renderErgoKeyboard(container, unit, options) {
    const angle = (options && options.angle) || 14;
    const gap = (options && options.gap) || 96;

    container.innerHTML = '';
    container.style.gap = `${gap}px`;
    container.style.alignItems = 'flex-end';
    container.style.justifyContent = 'center';

    // Левая половина — поворот -angle вокруг bottom-right
    const leftWrap = document.createElement('div');
    leftWrap.style.transform = `rotate(-${angle}deg)`;
    leftWrap.style.transformOrigin = 'bottom right';
    leftWrap.appendChild(buildKeyboardHalf('left', unit));
    container.appendChild(leftWrap);

    // Правая половина — поворот +angle вокруг bottom-left
    const rightWrap = document.createElement('div');
    rightWrap.style.transform = `rotate(${angle}deg)`;
    rightWrap.style.transformOrigin = 'bottom left';
    rightWrap.appendChild(buildKeyboardHalf('right', unit));
    container.appendChild(rightWrap);
}

// Public: переключение layout без полного reinit (используется onboarding-complete + resize listeners)
function _renderKeyboardImmediate(container, variant, unit) {
    container.dataset.layout = variant || 'classic';
    if (variant === 'laptop') {
        renderLaptopKeyboard(container, unit);
    } else if (variant === 'ergonomic') {
        renderErgoKeyboard(container, unit);
    } else {
        renderClassicKeyboard(container, unit);
    }
}

// Public: переключение layout. Опция animated:true делает fade-transition
// (для user-initiated смены через toolbar). Initial render / resize — instant.
function renderKeyboard(variant, unit, options) {
    const container = document.querySelector('.keyboard-container');
    if (!container) return;
    const u = unit || getResponsiveUnit();
    const animated = options && options.animated;

    if (!animated) {
        _renderKeyboardImmediate(container, variant, u);
        return;
    }

    // Fade-out + лёгкий scale-down, потом re-render и fade-in
    container.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
    container.style.opacity = '0';
    container.style.transform = 'scale(0.98)';

    setTimeout(() => {
        _renderKeyboardImmediate(container, variant, u);
        requestAnimationFrame(() => {
            container.style.opacity = '1';
            container.style.transform = 'scale(1)';
        });
        setTimeout(() => { container.style.transition = ''; }, 240);
    }, 220);
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

function writeProfileKeyboardType(layout) {
    try {
        const key = (window.Settings && window.Settings.get('storage.keys.userProfile'))
            || 'typing_trainer_user_profile';
        const raw = localStorage.getItem(key);
        const profile = raw ? JSON.parse(raw) : {};
        profile.keyboardType = layout;
        localStorage.setItem(key, JSON.stringify(profile));
    } catch (e) { /* silent */ }
}

// ---------------------------------------------------------------------------
// Top function toolbar (Phase 7) — функциональный layout-switcher +
// мок toggles для display опций + read-only layout info chip.
// ---------------------------------------------------------------------------

const LAYOUT_OPTIONS = [
    { id: 'classic',   label: 'Classic',   icon: '⌨️' },
    { id: 'laptop',    label: 'Laptop',    icon: '💻' },
    { id: 'ergonomic', label: 'Ergonomic', icon: '🎯' },
];

// Language options — UI scaffold. EN пока без курса (ждёт контента),
// клик показывает info-toast вместо реального переключения.
const LANGUAGE_OPTIONS = [
    { id: 'ru', label: 'RU', flag: '🇷🇺', layoutName: 'ЙЦУКЕН', available: true },
    { id: 'en', label: 'EN', flag: '🇬🇧', layoutName: 'QWERTY',  available: false },
];

function readProfileLanguage() {
    try {
        const key = (window.Settings && window.Settings.get('storage.keys.userProfile'))
            || 'typing_trainer_user_profile';
        const raw = localStorage.getItem(key);
        if (!raw) return 'ru';
        return (JSON.parse(raw).language) || 'ru';
    } catch (e) { return 'ru'; }
}

// Display toggles. Все 4 функциональные:
// - symbols/shift через CSS-класс на .keyboard-container
// - sound через Web Audio API (audio.js) при нажатиях
// - rhythm — метроном по target_wpm урока (audio.js)
const DISPLAY_TOGGLES = [
    { id: 'symbols', label: 'Символы',  default: true,  hint: 'Показывать буквы на клавишах' },
    { id: 'shift',   label: 'Shift',     default: true,  hint: 'Показывать Shift-символы в углу' },
    { id: 'sound',   label: 'Звук',      default: false, hint: 'Beep при нажатии (высокий — правильно, низкий — ошибка)' },
    { id: 'rhythm',  label: 'Метроном', default: false, hint: 'Тик по target WPM текущего урока' },
];

// Маппинг toggle ID → CSS-класс на контейнере (когда toggle OFF, добавляется класс kb-hide-*)
const TOGGLE_CSS_CLASS = {
    symbols: 'kb-hide-symbols',
    shift:   'kb-hide-shift',
};

function getDisplayTogglesStorageKey() {
    return (window.Settings && window.Settings.get('storage.keys.displayToggles'))
        || 'typing_trainer_display_toggles';
}

function loadDisplayToggleStates() {
    try {
        const raw = localStorage.getItem(getDisplayTogglesStorageKey());
        const saved = raw ? JSON.parse(raw) : {};
        // Слой defaults поверх saved (чтобы новые toggle подхватывались с default)
        const state = {};
        DISPLAY_TOGGLES.forEach(t => {
            state[t.id] = saved.hasOwnProperty(t.id) ? !!saved[t.id] : t.default;
        });
        return state;
    } catch (e) {
        const fallback = {};
        DISPLAY_TOGGLES.forEach(t => { fallback[t.id] = t.default; });
        return fallback;
    }
}

function saveDisplayToggleState(id, value) {
    try {
        const key = getDisplayTogglesStorageKey();
        const raw = localStorage.getItem(key);
        const all = raw ? JSON.parse(raw) : {};
        all[id] = !!value;
        localStorage.setItem(key, JSON.stringify(all));
    } catch (e) { /* silent */ }
}

// Применить toggle к DOM/audio: символы/Shift через CSS, sound/rhythm
// через Web Audio API (state читается из localStorage в audio.js)
function applyDisplayToggle(id, isOn) {
    const container = document.querySelector('.keyboard-container');
    if (container) {
        const cls = TOGGLE_CSS_CLASS[id];
        if (cls) container.classList.toggle(cls, !isOn);
    }
    // Для rhythm: если выключили во время активного теста — остановить метроном.
    // Включение нового метронома произойдёт при следующем startNewTest.
    if (id === 'rhythm' && !isOn && window.AudioFeedback) {
        window.AudioFeedback.stopMetronome();
    }
    // sound: state читается audio.js'ом из localStorage перед каждым beep,
    // никакого DOM-эффекта не нужно
}

function applyAllDisplayToggles() {
    const state = loadDisplayToggleStates();
    Object.keys(state).forEach(id => applyDisplayToggle(id, state[id]));
}

function renderKeyboardToolbar() {
    const toolbar = document.getElementById('keyboardToolbar');
    if (!toolbar) return;

    const currentLayout = readProfileKeyboardType();
    const toggleState = loadDisplayToggleStates();

    toolbar.innerHTML = `
        <div class="kbt-section kbt-layout-switcher" role="radiogroup" aria-label="Раскладка клавиатуры">
            ${LAYOUT_OPTIONS.map(opt => `
                <button type="button" class="kbt-pill kbt-layout${opt.id === currentLayout ? ' kbt-active' : ''}"
                        data-layout="${opt.id}" role="radio" aria-checked="${opt.id === currentLayout}">
                    <span class="kbt-icon">${opt.icon}</span>
                    <span>${opt.label}</span>
                </button>
            `).join('')}
        </div>

        <div class="kbt-section kbt-toggles" aria-label="Опции отображения">
            ${DISPLAY_TOGGLES.map(t => {
                const isOn = !!toggleState[t.id];
                return `<button type="button" class="kbt-pill kbt-toggle${isOn ? ' kbt-on' : ''}"
                            data-toggle="${t.id}" title="${t.hint}">
                    <span class="kbt-check">${isOn ? '☑' : '☐'}</span>
                    <span>${t.label}</span>
                </button>`;
            }).join('')}
        </div>

        <div class="kbt-section kbt-language" role="radiogroup" aria-label="Язык курса">
            ${LANGUAGE_OPTIONS.map(l => {
                const active = l.id === readProfileLanguage();
                const disabledCls = !l.available ? ' kbt-disabled' : '';
                return `<button type="button" class="kbt-pill kbt-lang${active ? ' kbt-active' : ''}${disabledCls}"
                            data-lang="${l.id}" role="radio" aria-checked="${active}"
                            title="${l.available ? `Курс ${l.label} · ${l.layoutName}` : `${l.label} — в разработке, ждём контент`}">
                    <span class="kbt-icon">${l.flag}</span>
                    <span>${l.label}</span>
                </button>`;
            }).join('')}
            <span class="kbt-chip kbt-layout-info" title="Текущая раскладка">ЙЦУКЕН</span>
        </div>
    `;

    // Layout-switcher — функциональный, с fade-анимацией перехода
    toolbar.querySelectorAll('.kbt-layout').forEach(btn => {
        btn.addEventListener('click', () => {
            const layout = btn.dataset.layout;
            if (layout === readProfileKeyboardType()) return; // тот же layout — no-op
            writeProfileKeyboardType(layout);
            renderKeyboard(layout, null, { animated: true });
            renderKeyboardToolbar();
            // Display toggles переприменяются после animation-завершения
            setTimeout(applyAllDisplayToggles, 250);
        });
    });

    // Display toggles — символы/Shift функциональные, sound/rhythm пока mock
    toolbar.querySelectorAll('.kbt-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.toggle;
            const newState = !btn.classList.contains('kbt-on');
            btn.classList.toggle('kbt-on', newState);
            const check = btn.querySelector('.kbt-check');
            if (check) check.textContent = newState ? '☑' : '☐';
            saveDisplayToggleState(id, newState);
            applyDisplayToggle(id, newState);
        });
    });

    // Language pills — RU функциональный, EN показывает info-toast
    toolbar.querySelectorAll('.kbt-lang').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            const opt = LANGUAGE_OPTIONS.find(l => l.id === lang);
            if (!opt) return;
            if (!opt.available) {
                if (window.toastManager) {
                    window.toastManager.show(
                        `Курс ${opt.label} ещё в разработке — контент будет добавлен в следующих релизах.`,
                        opt.flag,
                        4000,
                        { type: 'info' }
                    );
                }
                return;
            }
            // RU — уже active, тут пока нет действия (EN-курс единственный возможный switch)
        });
    });
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
        renderKeyboard(initialLayout);
        renderKeyboardToolbar();
        applyAllDisplayToggles();

        // Mouse-обработчики на клавишах — делегированно на контейнер
        container.addEventListener('mousedown', onKeyMouseDown);
        container.addEventListener('mouseup', onKeyMouseUp);
        container.addEventListener('contextmenu', preventContextOnKey);

        // Live re-render при смене профиля (welcome modal close → applyKeyboardLayout)
        document.addEventListener('typingtrainer:onboardingComplete', () => {
            renderKeyboard(readProfileKeyboardType());
            renderKeyboardToolbar();
        });

        // Responsive: re-render с новым unit при ресайзе окна (debounced).
        // Только если unit реально поменялся — иначе full DOM перерисовка ничего не стоит зря.
        let resizeTimer = null;
        let lastUnit = getResponsiveUnit();
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const newUnit = getResponsiveUnit();
                if (newUnit !== lastUnit) {
                    lastUnit = newUnit;
                    const layout = (container.dataset.layout) || readProfileKeyboardType();
                    renderKeyboard(layout, newUnit);
                }
            }, 150);
        });

        console.log(`✅ Виртуальная клавиатура инициализирована (layout: ${initialLayout}, unit: ${getResponsiveUnit()}px)`);
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
