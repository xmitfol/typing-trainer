// assets/js/keyboard-data.js
// Декларативные данные клавиатуры. Используются renderer'ом в keyboard.js
// для построения DOM любого layout-варианта (classic/laptop/ergonomic).
// Источник правды для всех трёх раскладок — единая структура.

// ---------------------------------------------------------------------------
// Палитра пальцев (НЕ менять — пользовательская инструкция, не декор)
// Дублирует config/settings.js APP_CONFIG.keyboard.fingerColors, но добавляет
// gradient/label/css-class — это специфика рендерера.
// ---------------------------------------------------------------------------
const FINGER = {
    pink: {
        solid: '#ff7675',
        fill: 'linear-gradient(180deg, #ff7675 0%, #e84393 100%)',
        label: 'Мизинец',
        cssClass: 'pink'
    },
    orange: {
        solid: '#fdcb6e',
        fill: 'linear-gradient(180deg, #fdcb6e 0%, #f39c12 100%)',
        label: 'Безымянный',
        cssClass: 'orange'
    },
    green: {
        solid: '#00b894',
        fill: 'linear-gradient(180deg, #00b894 0%, #00a085 100%)',
        label: 'Средний',
        cssClass: 'green'
    },
    blue: {
        solid: '#74b9ff',
        fill: 'linear-gradient(180deg, #74b9ff 0%, #0984e3 100%)',
        label: 'Указательный левый',
        cssClass: 'blue'
    },
    indigo: {
        solid: '#0984e3',
        fill: 'linear-gradient(180deg, #4a90e2 0%, #2d3436 100%)',
        label: 'Указательный правый',
        cssClass: 'indigo'
    },
    purple: {
        solid: '#a29bfe',
        fill: 'linear-gradient(180deg, #a29bfe 0%, #6c5ce7 100%)',
        label: 'Большой',
        cssClass: 'purple'
    }
};

// ---------------------------------------------------------------------------
// Алфавитный блок (4 ряда) — каждый ряд разделён на { left, right }
// Поля клавиши: l=label, u=upper(Shift-символ), f=finger, w=width units,
//               home=home-row bump, mod=модификатор, code=physical KeyboardEvent.code,
//               alt=альт. символ для матчинга
// ---------------------------------------------------------------------------
const ROWS = [
    // Row 0 — цифровой ряд
    {
        left: [
            { l: 'ё', u: '|', f: 'pink', code: 'Backquote' },
            { l: '1', u: '!', f: 'pink', code: 'Digit1' },
            { l: '2', u: '"', f: 'orange', code: 'Digit2' },
            { l: '3', u: '№', f: 'green', code: 'Digit3' },
            { l: '4', u: ';', f: 'blue', code: 'Digit4' },
            { l: '5', u: '%', f: 'blue', code: 'Digit5' },
        ],
        right: [
            { l: '6', u: ':', f: 'indigo', code: 'Digit6' },
            { l: '7', u: '?', f: 'indigo', code: 'Digit7' },
            { l: '8', u: '*', f: 'green', code: 'Digit8' },
            { l: '9', u: '(', f: 'orange', code: 'Digit9' },
            { l: '0', u: ')', f: 'pink', code: 'Digit0' },
            { l: '-', u: '_', f: 'pink', code: 'Minus' },
            { l: '=', u: '+', f: 'pink', code: 'Equal' },
            { l: 'Backsp', f: 'pink', w: 2, mod: true, code: 'Backspace', key: 'Backspace' },
        ],
    },
    // Row 1 — Й Ц У К Е | Н Г Ш Щ З Х Ъ
    {
        left: [
            { l: 'Tab', f: 'pink', w: 1.5, mod: true, code: 'Tab', key: 'Tab' },
            { l: 'й', f: 'pink', code: 'KeyQ' },
            { l: 'ц', f: 'orange', code: 'KeyW' },
            { l: 'у', f: 'green', code: 'KeyE' },
            { l: 'к', f: 'blue', code: 'KeyR' },
            { l: 'е', f: 'blue', code: 'KeyT' },
        ],
        right: [
            { l: 'н', f: 'indigo', code: 'KeyY' },
            { l: 'г', f: 'indigo', code: 'KeyU' },
            { l: 'ш', f: 'green', code: 'KeyI' },
            { l: 'щ', f: 'orange', code: 'KeyO' },
            { l: 'з', f: 'pink', code: 'KeyP' },
            { l: 'х', f: 'pink', code: 'BracketLeft' },
            { l: 'ъ', f: 'pink', code: 'BracketRight' },
            { l: '\\', f: 'pink', mod: true, code: 'Backslash' },
        ],
    },
    // Row 2 — Ф Ы В А П | Р О Л Д Ж Э
    {
        left: [
            { l: 'Caps Lock', f: 'pink', w: 1.75, mod: true, code: 'CapsLock', key: 'CapsLock' },
            { l: 'ф', f: 'pink', code: 'KeyA' },
            { l: 'ы', f: 'orange', code: 'KeyS' },
            { l: 'в', f: 'green', code: 'KeyD' },
            { l: 'а', f: 'blue', home: true, code: 'KeyF' },
            { l: 'п', f: 'blue', code: 'KeyG' },
        ],
        right: [
            { l: 'р', f: 'indigo', code: 'KeyH' },
            { l: 'о', f: 'indigo', home: true, code: 'KeyJ' },
            { l: 'л', f: 'green', code: 'KeyK' },
            { l: 'д', f: 'orange', code: 'KeyL' },
            { l: 'ж', f: 'pink', code: 'Semicolon' },
            { l: 'э', f: 'pink', code: 'Quote' },
            { l: 'Enter', f: 'pink', w: 1.75, mod: true, code: 'Enter', key: 'Enter' },
        ],
    },
    // Row 3 — Я Ч С М И | Т Ь Б Ю .
    {
        left: [
            { l: 'Shift', f: 'pink', w: 2.25, mod: true, code: 'ShiftLeft', key: 'Shift' },
            { l: 'я', f: 'pink', code: 'KeyZ' },
            { l: 'ч', f: 'orange', code: 'KeyX' },
            { l: 'с', f: 'green', code: 'KeyC' },
            { l: 'м', f: 'blue', code: 'KeyV' },
            { l: 'и', f: 'blue', code: 'KeyB' },
        ],
        right: [
            { l: 'т', f: 'indigo', code: 'KeyN' },
            { l: 'ь', f: 'indigo', code: 'KeyM' },
            { l: 'б', f: 'green', code: 'Comma' },
            { l: 'ю', f: 'orange', code: 'Period' },
            { l: '.', u: ',', f: 'pink', code: 'Slash' },
            { l: 'Shift', f: 'pink', w: 2.25, mod: true, code: 'ShiftRight', key: 'Shift' },
        ],
    },
];

// Нижний ряд для Classic/Laptop (с одним Space-баром на 6.5u)
const CLASSIC_BOTTOM = [
    { l: 'Ctrl', f: 'pink', w: 1.5, mod: true, code: 'ControlLeft', key: 'Control' },
    { l: '⊞', f: 'pink', w: 1.25, mod: true, code: 'MetaLeft', key: 'Meta' },
    { l: 'Alt', f: 'pink', w: 1.25, mod: true, code: 'AltLeft', key: 'Alt' },
    { l: 'Пробел', f: 'purple', w: 6.5, code: 'Space', key: ' ' },
    { l: 'Alt', f: 'pink', w: 1.25, mod: true, code: 'AltRight', key: 'AltGraph' },
    { l: '⊞', f: 'pink', w: 1.25, mod: true, code: 'MetaRight', key: 'Meta' },
    { l: 'Ctrl', f: 'pink', w: 1.5, mod: true, code: 'ControlRight', key: 'Control' },
];

// Нижние ряды для эргономической (split-Space, см. spec 008)
const THUMB_ROWS = {
    minimal: {
        left: [
            { l: 'Ctrl', f: 'pink', w: 1.25, mod: true, code: 'ControlLeft', key: 'Control' },
            { l: '⊞', f: 'pink', mod: true, code: 'MetaLeft', key: 'Meta' },
            { l: 'Alt', f: 'pink', mod: true, code: 'AltLeft', key: 'Alt' },
            { l: 'Пробел', f: 'purple', w: 3, code: 'Space', key: ' ', spaceSide: 'left' },
        ],
        right: [
            { l: 'Пробел', f: 'purple', w: 3, code: 'Space', key: ' ', spaceSide: 'right' },
            { l: 'Alt', f: 'pink', mod: true, code: 'AltRight', key: 'AltGraph' },
            { l: 'Fn', f: 'pink', mod: true },
            { l: 'Ctrl', f: 'pink', w: 1.25, mod: true, code: 'ControlRight', key: 'Control' },
        ],
    },
};

// Numpad (4 cols × 5 rows). Поля: l, f, gc (gridColumn), gr (gridRow), mod, home
const NUMPAD = [
    // Row 1
    { l: 'Num Lock', f: 'pink', mod: true, gc: '1', gr: '1', code: 'NumLock', key: 'NumLock' },
    { l: '/', f: 'green', gc: '2', gr: '1', code: 'NumpadDivide' },
    { l: '*', f: 'orange', gc: '3', gr: '1', code: 'NumpadMultiply' },
    { l: '-', f: 'orange', gc: '4', gr: '1', code: 'NumpadSubtract' },
    // Row 2
    { l: '7', f: 'blue', gc: '1', gr: '2', code: 'Numpad7' },
    { l: '8', f: 'green', gc: '2', gr: '2', code: 'Numpad8' },
    { l: '9', f: 'orange', gc: '3', gr: '2', code: 'Numpad9' },
    { l: '+', f: 'orange', gc: '4', gr: '2 / span 2', code: 'NumpadAdd' },
    // Row 3
    { l: '4', f: 'blue', gc: '1', gr: '3', code: 'Numpad4' },
    { l: '5', f: 'green', home: true, gc: '2', gr: '3', code: 'Numpad5' },
    { l: '6', f: 'orange', gc: '3', gr: '3', code: 'Numpad6' },
    // Row 4
    { l: '1', f: 'blue', gc: '1', gr: '4', code: 'Numpad1' },
    { l: '2', f: 'green', gc: '2', gr: '4', code: 'Numpad2' },
    { l: '3', f: 'orange', gc: '3', gr: '4', code: 'Numpad3' },
    { l: 'Enter', f: 'pink', mod: true, gc: '4', gr: '4 / span 2', code: 'NumpadEnter', key: 'Enter' },
    // Row 5
    { l: '0', f: 'purple', gc: '1 / span 2', gr: '5', code: 'Numpad0' },
    { l: ',', f: 'orange', gc: '3', gr: '5', code: 'NumpadDecimal' },
];

// Нав-кластер (3×2 nav + 3×2 стрелки)
const NAV = {
    top: [
        [
            { l: 'Ins', f: 'pink', mod: true, code: 'Insert', key: 'Insert' },
            { l: 'Home', f: 'pink', mod: true, code: 'Home', key: 'Home' },
            { l: 'PgUp', f: 'pink', mod: true, code: 'PageUp', key: 'PageUp' },
        ],
        [
            { l: 'Del', f: 'pink', mod: true, code: 'Delete', key: 'Delete' },
            { l: 'End', f: 'pink', mod: true, code: 'End', key: 'End' },
            { l: 'PgDn', f: 'pink', mod: true, code: 'PageDown', key: 'PageDown' },
        ],
    ],
    arrows: {
        up: { l: '↑', f: 'pink', mod: true, code: 'ArrowUp', key: 'ArrowUp' },
        left: { l: '←', f: 'pink', mod: true, code: 'ArrowLeft', key: 'ArrowLeft' },
        down: { l: '↓', f: 'pink', mod: true, code: 'ArrowDown', key: 'ArrowDown' },
        right: { l: '→', f: 'pink', mod: true, code: 'ArrowRight', key: 'ArrowRight' },
    },
};

// Карта символ→палец (для подсветки во время печати).
// Строим один раз из ROWS + THUMB_ROWS на загрузке.
const CHAR_TO_FINGER = (function () {
    const m = {};
    const allRows = [
        ...ROWS,
        { left: THUMB_ROWS.minimal.left, right: THUMB_ROWS.minimal.right },
    ];
    allRows.forEach(r => {
        [...r.left, ...r.right].forEach(k => {
            if (!k.l) return;
            const ch = k.l.toLowerCase();
            if (ch.length === 1) m[ch] = k.f;
            if (k.alt) m[k.alt.toLowerCase()] = k.f;
        });
    });
    m[' '] = 'purple';
    return m;
})();

// ---------------------------------------------------------------------------
// Алгоритм padRow — выравнивает правый край всех 5 рядов классической
// клавиатуры по самому широкому ряду, докидывая «дефицит» ширины на
// designated клавиши (Tab / Caps / Enter / Shift / Space) — см. README handoff.
// ---------------------------------------------------------------------------

const GAP_U = 0.08; // gap между клавишами в "u"

function rowWidthU(row) {
    const keys = row.reduce((s, k) => s + (k.w || 1), 0);
    const gaps = (row.length - 1) * GAP_U;
    return keys + gaps;
}

// На какие индексы клавиш разносить дефицит каждого ряда
const PAD_INDICES = {
    0: [],              // row 0 — самый широкий, без подгонки
    1: [0],             // row 1 — на Tab (\\ остаётся 1u)
    2: [0, 'last'],     // row 2 — Caps + Enter поровну
    3: [0, 'last'],     // row 3 — оба Shift поровну
};

function padRow(row, indices, anchorU) {
    const deficit = anchorU - rowWidthU(row);
    if (deficit <= 0.0001 || !indices.length) return row;
    const realIdx = indices.map(i => i === 'last' ? row.length - 1 : i);
    const perKey = deficit / realIdx.length;
    return row.map((k, i) => realIdx.includes(i)
        ? Object.assign({}, k, { w: (k.w || 1) + perKey })
        : k);
}

// Все 5 рядов с подгонкой; CLASSIC_BOTTOM получает весь дефицит на Space.
function buildAlignedRows() {
    const merged = ROWS.map(r => [...r.left, ...r.right]);
    const all = [...merged, CLASSIC_BOTTOM];
    const anchorU = Math.max(...all.map(rowWidthU));

    const alphaPadded = merged.map((row, ri) => padRow(row, PAD_INDICES[ri] || [], anchorU));

    const bottomDeficit = anchorU - rowWidthU(CLASSIC_BOTTOM);
    const bottomPadded = CLASSIC_BOTTOM.map(k =>
        k.code === 'Space'
            ? Object.assign({}, k, { w: (k.w || 1) + bottomDeficit })
            : k
    );

    return { alpha: alphaPadded, bottom: bottomPadded, anchorU };
}

// Экспорт
window.KeyboardData = {
    FINGER,
    ROWS,
    CLASSIC_BOTTOM,
    THUMB_ROWS,
    NUMPAD,
    NAV,
    CHAR_TO_FINGER,
    GAP_U,
    rowWidthU,
    padRow,
    buildAlignedRows,
};
