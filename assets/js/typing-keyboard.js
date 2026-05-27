// typing-keyboard.js — <typing-keyboard> Web Component
// Phase 1 · Core component · vanilla
//
// Usage:
//   <typing-keyboard type="classic" intensity="full"></typing-keyboard>
//   <typing-keyboard type="ergonomic" angle="14" gap="96"></typing-keyboard>
//
// Reactive attributes:
//   type           classic | laptop | ergonomic (default: classic)
//   layout         standard | phonetic | typewriter | mac (default: standard)
//   intensity      full | strip | highlight (default: full)
//   modifier-style solid | hatched (default: solid)
//   theme          light | dark (default: inherited)
//   unit           base key size in px (default: 56)
//   angle          ergo rotation degrees (default: 14)
//   gap            ergo half gap in px (default: 96)
//   thumb          minimal | full (ergo only, default: minimal)
//   active-key     a key code to highlight as "active" (e.g. "KeyF")
//   highlight-char a char to highlight as "next to press" (e.g. "а")
//   error-key      a key code to flash as "error"
//
// Events:
//   keydown — bubbles up when user actually presses physical key (we listen on host)

(function () {
  'use strict';

  // ─── Finger palette ──────────────────────────────────────────────────────
  const FINGER = {
    pink:   { solid: '#ff7675', grad: 'linear-gradient(180deg,#ff7675,#e84393)', label: 'Мизинец' },
    orange: { solid: '#fdcb6e', grad: 'linear-gradient(180deg,#fdcb6e,#f39c12)', label: 'Безымянный' },
    green:  { solid: '#00b894', grad: 'linear-gradient(180deg,#00b894,#00a085)', label: 'Средний' },
    blue:   { solid: '#74b9ff', grad: 'linear-gradient(180deg,#74b9ff,#0984e3)', label: 'Указ. левый' },
    indigo: { solid: '#0984e3', grad: 'linear-gradient(180deg,#4a90e2,#2d3436)', label: 'Указ. правый' },
    purple: { solid: '#a29bfe', grad: 'linear-gradient(180deg,#a29bfe,#6c5ce7)', label: 'Большой' },
  };

  // ─── Layout data (ЙЦУКЕН — standard) ─────────────────────────────────────
  const ROWS = [
    // row 0 — number row (15u)
    {
      left: [
        { l: 'Ё', u: '|', f: 'pink', code: 'Backquote' },
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
        { l: '⌫', f: 'pink', w: 2, mod: true, code: 'Backspace' },
      ],
    },
    // row 1 — Tab + ЙЦУКЕН...
    {
      left: [
        { l: 'Tab', f: 'pink', w: 1.5, mod: true, code: 'Tab' },
        { l: 'Й', f: 'pink', code: 'KeyQ' }, { l: 'Ц', f: 'orange', code: 'KeyW' },
        { l: 'У', f: 'green', code: 'KeyE' }, { l: 'К', f: 'blue', code: 'KeyR' },
        { l: 'Е', f: 'blue', code: 'KeyT' },
      ],
      right: [
        { l: 'Н', f: 'indigo', code: 'KeyY' }, { l: 'Г', f: 'indigo', code: 'KeyU' },
        { l: 'Ш', f: 'green', code: 'KeyI' }, { l: 'Щ', f: 'orange', code: 'KeyO' },
        { l: 'З', f: 'pink', code: 'KeyP' }, { l: 'Х', f: 'pink', code: 'BracketLeft' },
        { l: 'Ъ', f: 'pink', code: 'BracketRight' },
        { l: '\\', f: 'pink', w: 1, mod: true, code: 'Backslash' },
      ],
    },
    // row 2 — Caps + ФЫВА...
    {
      left: [
        { l: 'Caps', f: 'pink', w: 1.75, mod: true, code: 'CapsLock' },
        { l: 'Ф', f: 'pink', code: 'KeyA' }, { l: 'Ы', f: 'orange', code: 'KeyS' },
        { l: 'В', f: 'green', code: 'KeyD' },
        { l: 'А', f: 'blue', home: true, code: 'KeyF' },
        { l: 'П', f: 'blue', code: 'KeyG' },
      ],
      right: [
        { l: 'Р', f: 'indigo', code: 'KeyH' },
        { l: 'О', f: 'indigo', home: true, code: 'KeyJ' },
        { l: 'Л', f: 'green', code: 'KeyK' }, { l: 'Д', f: 'orange', code: 'KeyL' },
        { l: 'Ж', f: 'pink', code: 'Semicolon' }, { l: 'Э', f: 'pink', code: 'Quote' },
        { l: 'Enter', f: 'pink', w: 1.75, mod: true, code: 'Enter' },
      ],
    },
    // row 3 — Shift + ЯЧСМИ...
    {
      left: [
        { l: 'Shift', f: 'pink', w: 2.25, mod: true, code: 'ShiftLeft' },
        { l: 'Я', f: 'pink', code: 'KeyZ' }, { l: 'Ч', f: 'orange', code: 'KeyX' },
        { l: 'С', f: 'green', code: 'KeyC' }, { l: 'М', f: 'blue', code: 'KeyV' },
        { l: 'И', f: 'blue', code: 'KeyB' },
      ],
      right: [
        { l: 'Т', f: 'indigo', code: 'KeyN' }, { l: 'Ь', f: 'indigo', code: 'KeyM' },
        { l: 'Б', f: 'green', code: 'Comma' }, { l: 'Ю', f: 'orange', code: 'Period' },
        { l: '.', u: ',', f: 'pink', code: 'Slash' },
        { l: 'Shift', f: 'pink', w: 2.25, mod: true, code: 'ShiftRight' },
      ],
    },
  ];

  const CLASSIC_BOTTOM = [
    { l: 'Ctrl', f: 'pink', mod: true, w: 1.5, code: 'ControlLeft' },
    { l: 'Win',  f: 'pink', mod: true, w: 1.25, code: 'MetaLeft' },
    { l: 'Alt',  f: 'pink', mod: true, w: 1.25, code: 'AltLeft' },
    { l: 'Space', f: 'purple', w: 6.5, code: 'Space' },
    { l: 'Alt',  f: 'pink', mod: true, w: 1.25, code: 'AltRight' },
    { l: 'Fn',   f: 'pink', mod: true, w: 1.25 },
    { l: 'Ctrl', f: 'pink', mod: true, w: 1.5, code: 'ControlRight' },
  ];

  const THUMB_MIN = {
    left:  [
      { l: 'Ctrl', f: 'pink', w: 1.25, mod: true, code: 'ControlLeft' },
      { l: 'Win',  f: 'pink', w: 1, mod: true, code: 'MetaLeft' },
      { l: 'Alt',  f: 'pink', w: 1, mod: true, code: 'AltLeft' },
      { l: 'Space', f: 'purple', w: 3, code: 'Space' },
    ],
    right: [
      { l: 'Space', f: 'purple', w: 3, code: 'Space' },
      { l: 'Alt',  f: 'pink', w: 1, mod: true, code: 'AltRight' },
      { l: 'Fn',   f: 'pink', w: 1, mod: true },
      { l: 'Ctrl', f: 'pink', w: 1.25, mod: true, code: 'ControlRight' },
    ],
  };

  const NAV_TOP = [
    [{ l: 'Ins', mod: true }, { l: 'Home', mod: true }, { l: 'PgUp', mod: true }],
    [{ l: 'Del', mod: true }, { l: 'End', mod: true }, { l: 'PgDn', mod: true }],
  ];

  const NUMPAD = [
    // [label, finger, gridCol, gridRow]
    { l: 'Num', mod: true,        gc: '1', gr: '1' },
    { l: '/',   f: 'green',       gc: '2', gr: '1' },
    { l: '*',   f: 'orange',      gc: '3', gr: '1' },
    { l: '-',   f: 'orange',      gc: '4', gr: '1' },
    { l: '7',   f: 'blue',        gc: '1', gr: '2' },
    { l: '8',   f: 'green',       gc: '2', gr: '2' },
    { l: '9',   f: 'orange',      gc: '3', gr: '2' },
    { l: '+',   f: 'orange',      gc: '4', gr: '2 / span 2', tall: true },
    { l: '4',   f: 'blue',        gc: '1', gr: '3' },
    { l: '5',   f: 'green', home: true, gc: '2', gr: '3' },
    { l: '6',   f: 'orange',      gc: '3', gr: '3' },
    { l: '1',   f: 'blue',        gc: '1', gr: '4' },
    { l: '2',   f: 'green',       gc: '2', gr: '4' },
    { l: '3',   f: 'orange',      gc: '3', gr: '4' },
    { l: 'Ent', mod: true,        gc: '4', gr: '4 / span 2', tall: true },
    { l: '0',   f: 'purple',      gc: '1 / span 2', gr: '5', wide: true },
    { l: ',',   f: 'orange',      gc: '3', gr: '5' },
  ];

  // ─── Right-edge alignment for Classic/Laptop ─────────────────────────────
  function padRows(rows, bottom, gap = 0.08) {
    const rowWidth = (r) => r.reduce((s, k) => s + (k.w || 1), 0) + (r.length - 1) * gap;
    const all = [...rows, bottom];
    const maxW = Math.max(...all.map(rowWidth));
    const padOne = (row, padKeys) => {
      const deficit = maxW - rowWidth(row);
      if (deficit <= 0.001 || !padKeys.length) return row;
      const idxs = padKeys.map(i => i === 'last' ? row.length - 1 : i);
      const per = deficit / idxs.length;
      return row.map((k, i) => idxs.includes(i) ? { ...k, w: (k.w || 1) + per } : k);
    };
    const padded = [
      padOne(rows[0], ['last']),           // Backspace absorbs
      padOne(rows[1], [0]),                // Tab absorbs (\ stays normal)
      padOne(rows[2], [0, 'last']),        // Caps & Enter equal
      padOne(rows[3], [0, 'last']),        // both Shifts equal
    ];
    const padBot = padOne(bottom, [3]);    // Space absorbs (index 3 = Space)
    return { padded, padBot };
  }

  // ─── Shadow DOM CSS ──────────────────────────────────────────────────────
  const css = `
    :host {
      display: block;
      font-family: var(--font-ui, "Manrope", system-ui, sans-serif);
      color: var(--ink, #1a1a17);
      --kb-pink:   #ff7675;
      --kb-orange: #fdcb6e;
      --kb-green:  #00b894;
      --kb-blue:   #74b9ff;
      --kb-indigo: #0984e3;
      --kb-purple: #a29bfe;
    }
    :host([theme="dark"]) {
      color: #f3f1ea;
    }

    .kb { display: flex; gap: 12px; justify-content: center; padding: 12px; perspective: 1200px; }
    .kb--split { gap: var(--ergo-gap, 96px); align-items: flex-end; }

    .row { display: flex; align-items: center; }
    .col { display: flex; flex-direction: column; align-items: flex-start; }

    .key {
      box-sizing: border-box;
      border-radius: calc(var(--unit, 56px) * 0.14);
      border: 1px solid rgba(0,0,0,0.08);
      background: #fff;
      color: var(--ink, #1a1a17);
      font-family: var(--font-mono, "JetBrains Mono", monospace);
      font-weight: 600;
      font-size: calc(var(--unit, 56px) * 0.32);
      line-height: 1;
      box-shadow: 0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04);
      transition: all .15s ease;
      flex-shrink: 0;
      display: flex;
      position: relative;
      padding: calc(var(--unit, 56px) * 0.12);
      cursor: default;
      user-select: none;
    }
    .key--alpha {
      align-items: center;
      justify-content: center;
    }
    .key--mod {
      background: #f1efe8;
      color: #6e6a5f;
      align-items: center;
      justify-content: center;
      font-family: var(--font-ui, "Manrope", sans-serif);
      font-weight: 600;
      font-size: calc(var(--unit, 56px) * 0.22);
    }
    .key--mod-short {
      align-items: center;
      justify-content: center;
      font-size: calc(var(--unit, 56px) * 0.32);
    }
    :host([modifier-style="hatched"]) .key--mod {
      background: repeating-linear-gradient(135deg, #f1efe8 0 6px, #e3e0d5 6px 9px);
    }

    /* Finger colors — full intensity (default) */
    .key[data-finger="pink"]   { background: linear-gradient(180deg, var(--kb-pink) 0%, #e84393 100%); color: #fff; border-color: rgba(0,0,0,0.06); }
    .key[data-finger="orange"] { background: linear-gradient(180deg, var(--kb-orange) 0%, #f39c12 100%); color: #fff; border-color: rgba(0,0,0,0.06); }
    .key[data-finger="green"]  { background: linear-gradient(180deg, var(--kb-green) 0%, #00a085 100%); color: #fff; border-color: rgba(0,0,0,0.06); }
    .key[data-finger="blue"]   { background: linear-gradient(180deg, var(--kb-blue) 0%, #0984e3 100%); color: #fff; border-color: rgba(0,0,0,0.06); }
    .key[data-finger="indigo"] { background: linear-gradient(180deg, #4a90e2 0%, #2d3436 100%); color: #fff; border-color: rgba(0,0,0,0.06); }
    .key[data-finger="purple"] { background: linear-gradient(180deg, var(--kb-purple) 0%, #6c5ce7 100%); color: #fff; border-color: rgba(0,0,0,0.06); }

    /* Intensity: strip — neutral background, color accent strip on top */
    :host([intensity="strip"]) .key[data-finger]:not(.key--mod) {
      background: #fff;
      color: var(--ink, #1a1a17);
    }
    :host([intensity="strip"]) .key[data-finger]:not(.key--mod)::before {
      content: '';
      position: absolute;
      left: 12%; right: 12%; top: 12%;
      height: 8%;
      border-radius: 999px;
    }
    :host([intensity="strip"]) .key[data-finger="pink"]::before   { background: linear-gradient(180deg, var(--kb-pink), #e84393); }
    :host([intensity="strip"]) .key[data-finger="orange"]::before { background: linear-gradient(180deg, var(--kb-orange), #f39c12); }
    :host([intensity="strip"]) .key[data-finger="green"]::before  { background: linear-gradient(180deg, var(--kb-green), #00a085); }
    :host([intensity="strip"]) .key[data-finger="blue"]::before   { background: linear-gradient(180deg, var(--kb-blue), #0984e3); }
    :host([intensity="strip"]) .key[data-finger="indigo"]::before { background: linear-gradient(180deg, #4a90e2, #2d3436); }
    :host([intensity="strip"]) .key[data-finger="purple"]::before { background: linear-gradient(180deg, var(--kb-purple), #6c5ce7); }

    /* Intensity: highlight — neutral, color appears only on highlight state */
    :host([intensity="highlight"]) .key[data-finger]:not(.key--mod) {
      background: #fff;
      color: var(--ink, #1a1a17);
    }

    /* States */
    .key[data-state="hover"] {
      transform: translateY(-1px);
      filter: brightness(1.05);
    }
    .key[data-state="active"] {
      color: #fff;
      transform: translateY(1px);
    }
    .key[data-state="active"][data-finger="pink"]   { box-shadow: 0 0 0 2px var(--kb-pink), 0 0 0 6px rgba(255,118,117,0.2), 0 4px 12px rgba(255,118,117,0.4); }
    .key[data-state="active"][data-finger="orange"] { box-shadow: 0 0 0 2px var(--kb-orange), 0 0 0 6px rgba(253,203,110,0.2), 0 4px 12px rgba(253,203,110,0.4); }
    .key[data-state="active"][data-finger="green"]  { box-shadow: 0 0 0 2px var(--kb-green), 0 0 0 6px rgba(0,184,148,0.2), 0 4px 12px rgba(0,184,148,0.4); }
    .key[data-state="active"][data-finger="blue"]   { box-shadow: 0 0 0 2px var(--kb-blue), 0 0 0 6px rgba(116,185,255,0.2), 0 4px 12px rgba(116,185,255,0.4); }
    .key[data-state="active"][data-finger="indigo"] { box-shadow: 0 0 0 2px var(--kb-indigo), 0 0 0 6px rgba(9,132,227,0.2), 0 4px 12px rgba(9,132,227,0.4); }
    .key[data-state="active"][data-finger="purple"] { box-shadow: 0 0 0 2px var(--kb-purple), 0 0 0 6px rgba(162,155,254,0.2), 0 4px 12px rgba(162,155,254,0.4); }

    .key[data-state="highlight"][data-finger="pink"]   { box-shadow: 0 0 0 2px var(--kb-pink), 0 0 18px rgba(255,118,117,0.4); animation: pulse 1.4s ease-in-out infinite; }
    .key[data-state="highlight"][data-finger="orange"] { box-shadow: 0 0 0 2px var(--kb-orange), 0 0 18px rgba(253,203,110,0.4); animation: pulse 1.4s ease-in-out infinite; }
    .key[data-state="highlight"][data-finger="green"]  { box-shadow: 0 0 0 2px var(--kb-green), 0 0 18px rgba(0,184,148,0.4); animation: pulse 1.4s ease-in-out infinite; }
    .key[data-state="highlight"][data-finger="blue"]   { box-shadow: 0 0 0 2px var(--kb-blue), 0 0 18px rgba(116,185,255,0.4); animation: pulse 1.4s ease-in-out infinite; }
    .key[data-state="highlight"][data-finger="indigo"] { box-shadow: 0 0 0 2px var(--kb-indigo), 0 0 18px rgba(9,132,227,0.4); animation: pulse 1.4s ease-in-out infinite; }
    .key[data-state="highlight"][data-finger="purple"] { box-shadow: 0 0 0 2px var(--kb-purple), 0 0 18px rgba(162,155,254,0.4); animation: pulse 1.4s ease-in-out infinite; }

    /* In highlight mode, target key shows finger color when highlighted */
    :host([intensity="highlight"]) .key[data-state="highlight"][data-finger]:not(.key--mod) {
      background-color: rgba(0,0,0,0.04);
    }

    .key[data-state="error"] {
      background: #ef4444 !important;
      color: #fff;
      box-shadow: 0 0 0 2px #ef4444, 0 4px 12px rgba(239,68,68,0.5);
      animation: shake 0.3s ease-out;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-2px); }
      75% { transform: translateX(2px); }
    }

    /* Upper char */
    .key__upper {
      position: absolute;
      top: calc(var(--unit, 56px) * 0.08);
      right: calc(var(--unit, 56px) * 0.12);
      font-size: calc(var(--unit, 56px) * 0.2);
      opacity: 0.6;
      font-weight: 500;
    }
    /* Home row bump */
    .key__bump {
      position: absolute;
      bottom: calc(var(--unit, 56px) * 0.08);
      left: 50%;
      width: calc(var(--unit, 56px) * 0.22);
      height: calc(var(--unit, 56px) * 0.05);
      background: rgba(255,255,255,0.8);
      border-radius: 999px;
      transform: translateX(-50%);
    }
    :host([intensity="strip"]) .key__bump,
    :host([intensity="highlight"]) .key__bump {
      background: rgba(0,0,0,0.35);
    }
    :host([theme="dark"]) .key__bump {
      background: rgba(255,255,255,0.4);
    }

    /* Ergo halves */
    .half-left  { transform: rotate(calc(-1 * var(--angle, 14deg))); transform-origin: bottom right; }
    .half-right { transform: rotate(var(--angle, 14deg)); transform-origin: bottom left; }
    .half { display: flex; flex-direction: column; gap: calc(var(--unit, 56px) * 0.08); }
    .half__row { display: flex; gap: calc(var(--unit, 56px) * 0.08); }
    .half__row--left  { justify-content: flex-end; }
    .half__row--right { justify-content: flex-start; }

    /* Dark surface */
    :host([theme="dark"]) .key { background: #2a2a27; color: #f3f1ea; border-color: rgba(255,255,255,0.06); }
    :host([theme="dark"]) .key--mod { background: #23231f; color: #bcb9af; }
  `;

  // ─── Render helpers ──────────────────────────────────────────────────────
  function keyHtml(data, unit, opts) {
    const w = (data.w || 1) * unit;
    const h = unit * 0.92;
    const isMod = data.mod;
    const isLongMod = isMod && data.l.length > 2;
    const cls = ['key'];
    if (isMod) cls.push(isLongMod ? 'key--mod' : 'key--mod key--mod-short');
    else cls.push('key--alpha');
    const ds = data.f && !isMod ? `data-finger="${data.f}"` : '';
    const dc = data.code ? `data-code="${data.code}"` : '';
    const state = opts.stateOf(data);
    const dstate = state !== 'default' ? `data-state="${state}"` : '';
    const styleParts = [
      `width:${w}px`, `height:${h}px`,
    ];
    return `<div class="${cls.join(' ')}" ${ds} ${dc} ${dstate} style="${styleParts.join(';')}">
      ${data.u && !isMod ? `<span class="key__upper">${data.u}</span>` : ''}
      <span>${data.l}</span>
      ${data.home ? `<span class="key__bump"></span>` : ''}
    </div>`;
  }

  function renderClassic(unit, opts) {
    const rowH = unit * 0.92;
    const { padded, padBot } = padRows(ROWS.map(r => [...r.left, ...r.right]), CLASSIC_BOTTOM);
    const alphaRows = padded.map(row =>
      `<div class="row" style="gap:${unit * 0.08}px;height:${rowH}px">${row.map(k => keyHtml(k, unit, opts)).join('')}</div>`
    ).join('');
    const bottomRow = `<div class="row" style="gap:${unit * 0.08}px;height:${rowH}px">${padBot.map(k => keyHtml(k, unit, opts)).join('')}</div>`;
    const alpha = `<div class="col" style="gap:${unit * 0.08}px">${alphaRows}${bottomRow}</div>`;

    const nav = renderNav(unit, opts);
    const numpad = renderNumpad(unit, opts);

    return `<div class="kb" style="gap:${unit * 0.55}px;align-items:flex-start">${alpha}${nav}${numpad}</div>`;
  }

  function renderLaptop(unit, opts) {
    const rowH = unit * 0.92;
    const { padded, padBot } = padRows(ROWS.map(r => [...r.left, ...r.right]), CLASSIC_BOTTOM);
    const alphaRows = padded.map(row =>
      `<div class="row" style="gap:${unit * 0.08}px;height:${rowH}px">${row.map(k => keyHtml(k, unit, opts)).join('')}</div>`
    ).join('');
    const bottomRow = `<div class="row" style="gap:${unit * 0.08}px;height:${rowH}px">${padBot.map(k => keyHtml(k, unit, opts)).join('')}</div>`;
    const alpha = `<div class="col" style="gap:${unit * 0.08}px">${alphaRows}${bottomRow}</div>`;
    // Small arrows in bottom-right
    const arrows = `
      <div style="display:grid;grid-template-columns:repeat(3, ${unit * 0.85}px);grid-template-rows:${unit * 0.46}px ${unit * 0.46}px;gap:${unit * 0.08}px;align-self:flex-end">
        <div style="grid-column:2;grid-row:1">${keyHtml({ l: '↑', mod: true }, unit * 0.85, opts)}</div>
        <div style="grid-column:1;grid-row:2">${keyHtml({ l: '←', mod: true }, unit * 0.85, opts)}</div>
        <div style="grid-column:2;grid-row:2">${keyHtml({ l: '↓', mod: true }, unit * 0.85, opts)}</div>
        <div style="grid-column:3;grid-row:2">${keyHtml({ l: '→', mod: true }, unit * 0.85, opts)}</div>
      </div>
    `;
    return `<div class="kb" style="gap:${unit * 0.4}px;align-items:flex-end">${alpha}${arrows}</div>`;
  }

  function renderNav(unit, opts) {
    const rowH = unit * 0.92;
    const blank = `<div style="height:${rowH}px"></div>`;
    const navKey = (l) => keyHtml({ l, mod: true }, unit, opts);
    const navRow = (cells) => `<div class="row" style="gap:${unit * 0.08}px">${cells.map(c => navKey(c.l)).join('')}</div>`;
    const arrows = `
      <div class="col" style="gap:${unit * 0.08}px;align-items:center">
        <div class="row" style="gap:${unit * 0.08}px"><div style="width:${unit}px"></div>${navKey('↑')}<div style="width:${unit}px"></div></div>
        <div class="row" style="gap:${unit * 0.08}px">${navKey('←')}${navKey('↓')}${navKey('→')}</div>
      </div>
    `;
    return `<div class="col" style="gap:${unit * 0.08}px">
      ${blank}
      ${navRow(NAV_TOP[0])}
      ${navRow(NAV_TOP[1])}
      ${blank}
      ${arrows}
    </div>`;
  }

  function renderNumpad(unit, opts) {
    const cells = NUMPAD.map(c => {
      const wide = c.wide;
      const tall = c.tall;
      // Tall cells need explicit height
      let inner;
      if (tall || wide) {
        const w = wide ? unit * 2 + unit * 0.08 : unit;
        const h = tall ? unit * 0.92 * 2 + unit * 0.08 : unit * 0.92;
        const isMod = c.mod;
        const ds = c.f && !isMod ? `data-finger="${c.f}"` : '';
        const state = opts.stateOf(c);
        const dstate = state !== 'default' ? `data-state="${state}"` : '';
        const cls = ['key', isMod ? 'key--mod' : 'key--mod-short'];
        if (!isMod) cls.push('key--alpha');
        inner = `<div class="${cls.join(' ')}" ${ds} ${dstate} style="width:${w}px;height:${h}px;align-items:center;justify-content:center">${c.l}</div>`;
      } else {
        inner = keyHtml(c, unit, opts);
      }
      return `<div style="grid-column:${c.gc};grid-row:${c.gr}">${inner}</div>`;
    }).join('');
    return `<div style="display:grid;grid-template-columns:repeat(4, ${unit}px);grid-template-rows:repeat(5, ${unit * 0.92}px);gap:${unit * 0.08}px">${cells}</div>`;
  }

  function renderErgo(unit, angle, gap, thumb, opts) {
    const leftKeys = ROWS.map(r => r.left);
    const rightKeys = ROWS.map(r => r.right);
    const thumbData = thumb === 'minimal' ? THUMB_MIN : THUMB_MIN; // minimal-only for now
    const renderRow = (cells, side) =>
      `<div class="half__row half__row--${side}" style="gap:${unit * 0.08}px">${cells.map(k => keyHtml(k, unit, opts)).join('')}</div>`;
    const leftHalf = `<div class="half-left"><div class="half">
      ${leftKeys.map(r => renderRow(r, 'left')).join('')}
      ${renderRow(thumbData.left, 'left')}
    </div></div>`;
    const rightHalf = `<div class="half-right"><div class="half">
      ${rightKeys.map(r => renderRow(r, 'right')).join('')}
      ${renderRow(thumbData.right, 'right')}
    </div></div>`;
    return `<div class="kb kb--split" style="--angle:${angle}deg;--ergo-gap:${gap}px">${leftHalf}${rightHalf}</div>`;
  }

  // ─── Custom Element ──────────────────────────────────────────────────────
  class TypingKeyboard extends HTMLElement {
    static get observedAttributes() {
      return ['type', 'layout', 'intensity', 'modifier-style', 'theme',
              'unit', 'angle', 'gap', 'thumb',
              'active-key', 'highlight-char', 'error-key'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._errorTimer = null;
    }

    connectedCallback() {
      this._render();
    }

    attributeChangedCallback() {
      if (this.shadowRoot) this._render();
    }

    /** Flash a key as error for ~280ms; returns to default after. */
    flashError(code) {
      this.setAttribute('error-key', code);
      clearTimeout(this._errorTimer);
      this._errorTimer = setTimeout(() => this.removeAttribute('error-key'), 280);
    }

    /** Briefly highlight a key as "active" (key was pressed correctly). */
    flashActive(code, duration = 160) {
      this.setAttribute('active-key', code);
      clearTimeout(this._activeTimer);
      this._activeTimer = setTimeout(() => this.removeAttribute('active-key'), duration);
    }

    _stateOf(data) {
      const code = data.code;
      const label = (data.l || '').toLowerCase();
      const errorKey = this.getAttribute('error-key');
      const activeKey = this.getAttribute('active-key');
      const highlightChar = (this.getAttribute('highlight-char') || '').toLowerCase();
      if (errorKey && code === errorKey) return 'error';
      if (activeKey && code === activeKey) return 'active';
      if (highlightChar && label === highlightChar) return 'highlight';
      return 'default';
    }

    _render() {
      const type = this.getAttribute('type') || 'classic';
      const unit = parseInt(this.getAttribute('unit') || '56', 10);
      const angle = parseInt(this.getAttribute('angle') || '14', 10);
      const gap = parseInt(this.getAttribute('gap') || '96', 10);
      const thumb = this.getAttribute('thumb') || 'minimal';

      const opts = { stateOf: this._stateOf.bind(this) };

      let body;
      if (type === 'ergonomic') {
        body = renderErgo(unit, angle, gap, thumb, opts);
      } else if (type === 'laptop') {
        body = renderLaptop(unit, opts);
      } else {
        body = renderClassic(unit, opts);
      }

      this.shadowRoot.innerHTML = `<style>${css}</style>
        <div style="--unit:${unit}px">${body}</div>`;
    }
  }

  if (!customElements.get('typing-keyboard')) {
    customElements.define('typing-keyboard', TypingKeyboard);
  }
})();
