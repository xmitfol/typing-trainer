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
    { l: '',  f: 'pink', mod: true, w: 1.25, code: 'MetaLeft' },
    { l: 'Alt',  f: 'pink', mod: true, w: 1.25, code: 'AltLeft' },
    { l: 'Space', f: 'purple', w: 6.5, code: 'Space' },
    { l: 'Alt',  f: 'pink', mod: true, w: 1.25, code: 'AltRight' },
    { l: '',   f: 'pink', mod: true, w: 1.25 },
    { l: 'Ctrl', f: 'pink', mod: true, w: 1.5, code: 'ControlRight' },
  ];

  // ─── Layout variants (label overrides by physical key code) ──────────────
  // Standard = base ROWS. Others override labels; finger colors stay by position.
  const LAYOUTS = {
    phonetic: {
      Backquote:{l:'Ю'}, Equal:{l:'Ч'},
      KeyQ:{l:'Я'},KeyW:{l:'В'},KeyE:{l:'Е'},KeyR:{l:'Р'},KeyT:{l:'Т'},
      KeyY:{l:'Ы'},KeyU:{l:'У'},KeyI:{l:'И'},KeyO:{l:'О'},KeyP:{l:'П'},
      BracketLeft:{l:'Ш'},BracketRight:{l:'Щ'},Backslash:{l:'Э'},
      KeyA:{l:'А'},KeyS:{l:'С'},KeyD:{l:'Д'},KeyF:{l:'Ф'},KeyG:{l:'Г'},
      KeyH:{l:'Х'},KeyJ:{l:'Й'},KeyK:{l:'К'},KeyL:{l:'Л'},Semicolon:{l:';'},Quote:{l:"'"},
      KeyZ:{l:'З'},KeyX:{l:'Ь'},KeyC:{l:'Ц'},KeyV:{l:'Ж'},KeyB:{l:'Б'},
      KeyN:{l:'Н'},KeyM:{l:'М'},Comma:{l:','},Period:{l:'.'},Slash:{l:'/'},
    },
    typewriter: {
      // Same ЙЦУКЕН letters; punctuation number row; Ё bottom-right
      Backquote:{l:'|'},Digit1:{l:'№'},Digit2:{l:'-'},Digit3:{l:'"'},Digit4:{l:':'},
      Digit5:{l:','},Digit6:{l:'.'},Digit7:{l:'_'},Digit8:{l:'?'},Digit9:{l:'%'},
      Digit0:{l:'!'},Minus:{l:';'},Equal:{l:':'},
      Slash:{l:'Ё'},
    },
    mac: {
      // Standard ЙЦУКЕН; Ё added on row1 end; backtick ">"
      Backquote:{l:'>',u:'<'},Slash:{l:'/'},
    },
  };

  // Apply a layout's overrides onto a fresh copy of ROWS + bottom.
  function applyLayout(layout) {
    const ov = LAYOUTS[layout];
    const clone = (k) => ({ ...k });
    const rows = ROWS.map(r => ({ left: r.left.map(clone), right: r.right.map(clone) }));
    if (ov) {
      rows.forEach(r => [r.left, r.right].forEach(side => side.forEach(k => {
        if (k.code && ov[k.code]) Object.assign(k, ov[k.code]);
      })));
      // Mac: append Ё after Ъ on row1 right
      if (layout === 'mac') {
        rows[1].right.push({ l: 'Ё', f: 'pink', code: 'IntlYen' });
      }
    }
    return rows;
  }

  let activeRows = ROWS;

  const THUMB_MIN = {
    left:  [
      { l: 'Ctrl', f: 'pink', w: 1.25, mod: true, code: 'ControlLeft' },
      { l: '',  f: 'pink', w: 1, mod: true, code: 'MetaLeft' },
      { l: 'Alt',  f: 'pink', w: 1, mod: true, code: 'AltLeft' },
      { l: 'Space', f: 'purple', w: 3, code: 'Space', spaceSide: 'left' },
    ],
    right: [
      { l: 'Space', f: 'purple', w: 3, code: 'Space', spaceSide: 'right' },
      { l: 'Alt',  f: 'pink', w: 1, mod: true, code: 'AltRight' },
      { l: '',   f: 'pink', w: 1, mod: true },
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
    .kb--split { display: flex; gap: var(--ergo-gap, 96px); align-items: flex-end; }
    .kb--split .half-left  { transform: rotate(calc(-1 * var(--angle, 14deg))); transform-origin: bottom right; }
    .kb--split .half-right { transform: rotate(var(--angle, 14deg)); transform-origin: bottom left; }
    .kb--ergo { display: flex; align-items: flex-start; justify-content: center; padding: calc(var(--unit, 56px) * 0.9) 0 calc(var(--unit, 56px) * 0.3); gap: calc(var(--unit, 56px) * 1.4); }
    .ergo-clusters { display: flex; align-items: flex-start; }

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

    /* Finger colors — PALE base (default). Dark text. Next-key highlight stands out. */
    .key[data-finger="pink"]   { background: #ffd9dd; color: #7d2840; border-color: rgba(0,0,0,0.05); }
    .key[data-finger="orange"] { background: #ffe9c2; color: #8a5a17; border-color: rgba(0,0,0,0.05); }
    .key[data-finger="green"]  { background: #c2ebda; color: #1c6b53; border-color: rgba(0,0,0,0.05); }
    .key[data-finger="blue"]   { background: #d3e8ff; color: #1f5d96; border-color: rgba(0,0,0,0.05); }
    .key[data-finger="indigo"] { background: #c2d8f7; color: #244a78; border-color: rgba(0,0,0,0.05); }
    .key[data-finger="purple"] { background: #e0dcfe; color: #4a3f8f; border-color: rgba(0,0,0,0.05); }

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

    /* Next-key HIGHLIGHT — bright fill + diagonal hatching + dark outline */
    .key[data-state="highlight"] {
      color: #fff !important;
      animation: pulse 1.4s ease-in-out infinite;
      z-index: 2;
    }
    .key[data-state="highlight"][data-finger="pink"]   { background: repeating-linear-gradient(45deg, #ff7675 0 7px, #f25a6f 7px 12px); box-shadow: 0 0 0 2.5px #d63031, 0 4px 14px rgba(214,48,49,0.5); }
    .key[data-state="highlight"][data-finger="orange"] { background: repeating-linear-gradient(45deg, #fdcb6e 0 7px, #f0a93c 7px 12px); color: #5a3a08 !important; box-shadow: 0 0 0 2.5px #e08e0b, 0 4px 14px rgba(224,142,11,0.5); }
    .key[data-state="highlight"][data-finger="green"]  { background: repeating-linear-gradient(45deg, #00b894 0 7px, #00a07f 7px 12px); box-shadow: 0 0 0 2.5px #009e7a, 0 4px 14px rgba(0,158,122,0.5); }
    .key[data-state="highlight"][data-finger="blue"]   { background: repeating-linear-gradient(45deg, #74b9ff 0 7px, #4a9eee 7px 12px); box-shadow: 0 0 0 2.5px #2d7fd6, 0 4px 14px rgba(45,127,214,0.5); }
    .key[data-state="highlight"][data-finger="indigo"] { background: repeating-linear-gradient(45deg, #4a90e2 0 7px, #2f6fc0 7px 12px); box-shadow: 0 0 0 2.5px #1e3a8a, 0 4px 14px rgba(30,58,138,0.5); }
    .key[data-state="highlight"][data-finger="purple"] { background: repeating-linear-gradient(45deg, #a29bfe 0 7px, #847cf0 7px 12px); box-shadow: 0 0 0 2.5px #6c5ce7, 0 4px 14px rgba(108,92,231,0.5); }

    /* Split-space — две половины (левый/правый большой палец). Подсвечивается
       нужная половина по атрибуту space-half; если half не задан — обе. */
    .key--space {
      background: #e0dcfe;
      border-color: rgba(0,0,0,0.05);
      padding: 0;
      overflow: hidden;
      display: flex;
    }
    .key--space-half {
      flex: 1;
      height: 100%;
    }
    .key--space-l { border-right: 1px solid rgba(108,92,231,0.45); }
    .key--space-half[data-state="highlight"] {
      background: repeating-linear-gradient(45deg, #a29bfe 0 7px, #847cf0 7px 12px);
      box-shadow: inset 0 0 0 2.5px #6c5ce7;
      animation: pulse 1.4s ease-in-out infinite;
    }

    /* ISO tall Enter */
    .iso-enter { z-index: 2; position: absolute; }

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
  // Производит e.key для click→keydown синтеза. Для алфавита/цифр/символов
  // это сам символ; для пробела ' '; для модификаторов/спец — по коду.
  function inferKey(data) {
    const code = data.code || '';
    if (code === 'Space') return ' ';
    if (!data.mod && data.l) return String(data.l).toLowerCase();
    // Модификаторы и спец-клавиши: derive from code
    if (code.startsWith('Shift')) return 'Shift';
    if (code.startsWith('Control')) return 'Control';
    if (code.startsWith('Alt')) return 'Alt';
    if (code.startsWith('Meta')) return 'Meta';
    if (code === 'CapsLock') return 'CapsLock';
    if (code === 'Tab') return 'Tab';
    if (code === 'Enter') return 'Enter';
    if (code === 'Backspace') return 'Backspace';
    if (code === 'Escape') return 'Escape';
    if (code.startsWith('Arrow')) return code;       // ArrowUp/Down/Left/Right
    // Fallback по label для стрелок и пр.
    const labelMap = { '↑': 'ArrowUp', '↓': 'ArrowDown', '←': 'ArrowLeft', '→': 'ArrowRight' };
    if (labelMap[data.l]) return labelMap[data.l];
    return data.l || '';
  }

  function keyHtml(data, unit, opts) {
    const w = (data.w || 1) * unit;
    const h = unit * 0.92;
    const isMod = data.mod;
    const isLongMod = isMod && data.l.length > 2;
    const dkey = inferKey(data);
    const dkAttr = dkey ? `data-key="${dkey.replace(/"/g, '&quot;')}"` : '';

    // Space — две половины (левый/правый большой палец). Когда пробел следующий
    // и задан space-half ('left'/'right') — подсвечиваем нужную половину; если
    // half не задан — обе (обратная совместимость).
    if (data.code === 'Space') {
      const isHl = opts.stateOf(data) === 'highlight';
      // Эргономика: пробел — отдельная физическая половина. Рендерим сплошной;
      // подсветка только у нужной стороны (фильтр по spaceSide в _stateOf).
      if (data.spaceSide) {
        const dstate = isHl ? ' data-state="highlight"' : '';
        return `<div class="key key--space" data-finger="purple" data-code="Space" data-key=" "
          data-space-side="${data.spaceSide}" style="width:${w}px;height:${h}px"${dstate}></div>`;
      }
      // Classic: единый пробел рисуем двумя половинами — подсказка нужного большого пальца.
      const half = (opts.spaceHalf && opts.spaceHalf()) || '';
      const lState = isHl && half !== 'right' ? ' data-state="highlight"' : '';
      const rState = isHl && half !== 'left' ? ' data-state="highlight"' : '';
      return `<div class="key key--space" data-finger="purple" data-code="Space" data-key=" "
        style="width:${w}px;height:${h}px">
        <div class="key--space-half key--space-l"${lState}></div>
        <div class="key--space-half key--space-r"${rState}></div>
      </div>`;
    }

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
    return `<div class="${cls.join(' ')}" ${ds} ${dc} ${dkAttr} ${dstate} style="${styleParts.join(';')}">
      ${data.u && !isMod ? `<span class="key__upper">${data.u}</span>` : ''}
      <span>${data.l}</span>
      ${data.home ? `<span class="key__bump"></span>` : ''}
    </div>`;
  }

  // Build the alpha block. format: 'ansi' (wide Enter on row2, \ on row1) |
  // 'iso' (tall L-Enter spanning rows 1-2, \ moves to row2).
  function renderAlpha(unit, opts, format) {
    const rowH = unit * 0.92;
    const gap = unit * 0.08;
    const merged = activeRows.map(r => [...r.left, ...r.right]);

    if (format !== 'iso') {
      // ANSI — current behaviour
      const { padded, padBot } = padRows(merged, CLASSIC_BOTTOM);
      const rows = padded.map(row =>
        `<div class="row" style="gap:${gap}px;height:${rowH}px">${row.map(k => keyHtml(k, unit, opts)).join('')}</div>`
      ).join('');
      const bottom = `<div class="row" style="gap:${gap}px;height:${rowH}px">${padBot.map(k => keyHtml(k, unit, opts)).join('')}</div>`;
      return `<div class="col" style="gap:${gap}px">${rows}${bottom}</div>`;
    }

    // ISO — tall L-shaped Enter spanning rows 1-2 (absolute, right-aligned)
    const row1Letters = merged[1].filter(k => k.code !== 'Backslash'); // Tab + 12 letters
    const row2Letters = merged[2].filter(k => k.l !== 'Enter');        // Caps + 11 letters
    // Align right edge: row0/row3/bottom = 15u. Letter rows end at 13.5u; enter fills 13.5→15u.
    // Standard padding for the rows that are NOT restructured (numbers, Shift, bottom).
    const { padded, padBot } = padRows(merged, CLASSIC_BOTTOM);
    const pRow0 = padded[0];
    const pRow3 = padded[3];
    const renderRow = (row) => row.map(k => keyHtml(k, unit, opts)).join('');
    // L-shaped Enter: wide top (1.5u), narrow bottom (1.25u), notch bottom-left.
    const enterTopW = unit * 1.5;
    const enterBotW = unit * 1.25;
    const enterH = rowH * 2 + gap;
    // clip-path: notch cut from bottom-left. cutX = how far the narrow part is inset from left.
    const cutXpct = ((enterTopW - enterBotW) / enterTopW * 100).toFixed(2);
    const midYpct = (rowH / enterH * 100).toFixed(2);
    const clip = `polygon(0 0, 100% 0, 100% 100%, ${cutXpct}% 100%, ${cutXpct}% ${midYpct}%, 0 ${midYpct}%)`;
    // Backslash sits on row2 just left of the narrow Enter bottom. Width tuned so right edges align.
    const backslash = keyHtml({ l: '\\', f: 'pink', mod: true, w: 1, code: 'Backslash' }, unit, opts);

    const midW = (15 * unit + 14 * gap - 3).toFixed(1);
    return `<div class="col" style="gap:${gap}px">
      <div class="row" style="gap:${gap}px;height:${rowH}px">${renderRow(pRow0)}</div>
      <div class="iso-mid" style="position:relative;display:flex;flex-direction:column;gap:${gap}px;width:${midW}px">
        <div class="row" style="gap:${gap}px;height:${rowH}px">${renderRow(row1Letters)}</div>
        <div class="row" style="gap:${gap}px;height:${rowH}px">${renderRow(row2Letters)}${backslash}</div>
        <div class="key key--mod iso-enter" data-code="Enter"
          style="position:absolute;right:0;top:0;width:${enterTopW}px;height:${enterH}px;clip-path:${clip};-webkit-clip-path:${clip}">
          <span style="position:absolute;right:${unit*0.22}px;bottom:${rowH*0.5}px">⏎</span>
        </div>
      </div>
      <div class="row" style="gap:${gap}px;height:${rowH}px">${renderRow(pRow3)}</div>
      <div class="row" style="gap:${gap}px;height:${rowH}px">${padBot.map(k => keyHtml(k, unit, opts)).join('')}</div>
    </div>`;
  }

  function renderClassic(unit, opts, format) {
    const alpha = renderAlpha(unit, opts, format);
    const nav = renderNav(unit, opts);
    const numpad = renderNumpad(unit, opts);
    return `<div class="kb" style="gap:${unit * 0.34}px;align-items:flex-start">${alpha}${nav}${numpad}</div>`;
  }

  function renderClassicOLD(unit, opts) {
    const rowH = unit * 0.92;
    const { padded, padBot } = padRows(activeRows.map(r => [...r.left, ...r.right]), CLASSIC_BOTTOM);
    const alphaRows = padded.map(row =>
      `<div class="row" style="gap:${unit * 0.08}px;height:${rowH}px">${row.map(k => keyHtml(k, unit, opts)).join('')}</div>`
    ).join('');
    const bottomRow = `<div class="row" style="gap:${unit * 0.08}px;height:${rowH}px">${padBot.map(k => keyHtml(k, unit, opts)).join('')}</div>`;
    const alpha = `<div class="col" style="gap:${unit * 0.08}px">${alphaRows}${bottomRow}</div>`;

    const nav = renderNav(unit, opts);
    const numpad = renderNumpad(unit, opts);

    return `<div class="kb" style="gap:${unit * 0.34}px;align-items:flex-start">${alpha}${nav}${numpad}</div>`;
  }

  function renderLaptop(unit, opts, format) {
    const alpha = renderAlpha(unit, opts, format);
    return `<div class="kb" style="gap:${unit * 0.4}px;align-items:flex-end">${alpha}</div>`;
  }

  function renderLaptopOLD(unit, opts) {
    const rowH = unit * 0.92;
    const { padded, padBot } = padRows(activeRows.map(r => [...r.left, ...r.right]), CLASSIC_BOTTOM);
    const alphaRows = padded.map(row =>
      `<div class="row" style="gap:${unit * 0.08}px;height:${rowH}px">${row.map(k => keyHtml(k, unit, opts)).join('')}</div>`
    ).join('');
    const bottomRow = `<div class="row" style="gap:${unit * 0.08}px;height:${rowH}px">${padBot.map(k => keyHtml(k, unit, opts)).join('')}</div>`;
    const alpha = `<div class="col" style="gap:${unit * 0.08}px">${alphaRows}${bottomRow}</div>`;
    // Laptop: no nav/arrows cluster — not relevant for the trainer.
    return `<div class="kb" style="gap:${unit * 0.4}px;align-items:flex-end">${alpha}</div>`;
  }

  function renderNav(unit, opts) {
    const rowH = unit * 0.92;
    const gap = unit * 0.08;
    const navKey = (l) => keyHtml({ l, mod: true }, unit, opts);
    // A row slot with explicit height = rowH so it aligns 1:1 with the alpha block rows.
    const slot = (inner = '') =>
      `<div class="row" style="gap:${gap}px;height:${rowH}px;justify-content:center">${inner}</div>`;
    // 5 slots, matching the 5 alpha rows exactly:
    //   row0 (numbers): Ins Home PgUp
    //   row1 (Tab):     Del End PgDn
    //   row2 (Caps):    empty
    //   row3 (Shift):   ↑ centered
    //   row4 (Ctrl):    ← ↓ →
    return `<div class="col" style="gap:${gap}px">
      ${slot(NAV_TOP[0].map(c => navKey(c.l)).join(''))}
      ${slot(NAV_TOP[1].map(c => navKey(c.l)).join(''))}
      ${slot('')}
      ${slot(`<div style="width:${unit}px"></div>${navKey('↑')}<div style="width:${unit}px"></div>`)}
      ${slot(`${navKey('←')}${navKey('↓')}${navKey('→')}`)}
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
    const leftKeys = activeRows.map(r => r.left);
    const rightKeys = activeRows.map(r => r.right);
    const thumbData = THUMB_MIN;
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

    // Upright nav + numpad clusters to the right (same as classic).
    const nav = renderNav(unit, opts);
    const numpad = renderNumpad(unit, opts);

    return `<div class="kb kb--ergo">
      <div class="kb--split" style="--angle:${angle}deg;--ergo-gap:${gap}px;margin-top:-30px">${leftHalf}${rightHalf}</div>
      <div class="ergo-clusters" style="gap:${unit * 0.34}px">${nav}${numpad}</div>
    </div>`;
  }

  // ─── Custom Element ──────────────────────────────────────────────────────
  class TypingKeyboard extends HTMLElement {
    static get observedAttributes() {
      return ['type', 'layout', 'format', 'intensity', 'modifier-style', 'theme',
              'unit', 'angle', 'gap', 'thumb',
              'active-key', 'highlight-char', 'error-key', 'space-half'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._errorTimer = null;
      // Click/touch на on-screen клавише → CustomEvent наружу с {key, code}.
      // composed:true чтобы событие пересекло границу Shadow DOM.
      this.shadowRoot.addEventListener('click', (e) => {
        const k = e.target.closest('.key');
        if (!k) return;
        const key = k.getAttribute('data-key') || '';
        const code = k.getAttribute('data-code') || '';
        if (!key && !code) return;
        this.dispatchEvent(new CustomEvent('kb-press', {
          detail: { key, code, label: (k.textContent || '').trim() },
          bubbles: true, composed: true
        }));
      });
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
      const rawHighlight = this.getAttribute('highlight-char') || '';
      const highlightChar = rawHighlight.toLowerCase();
      if (errorKey && code === errorKey) return 'error';
      if (activeKey && code === activeKey) return 'active';
      // Space matches by character (its label is "Space", not " ").
      // Эргономика: половина с spaceSide подсвечивается только если совпадает
      // с space-half (рука, противоположная предыдущей букве); иначе гаснет.
      if (code === 'Space' && rawHighlight === ' ') {
        const half = this.getAttribute('space-half');
        if (data.spaceSide && half && data.spaceSide !== half) return 'default';
        return 'highlight';
      }
      if (highlightChar && code !== 'Space' && label === highlightChar) return 'highlight';
      return 'default';
    }

    _render() {
      const type = this.getAttribute('type') || 'classic';
      const layout = this.getAttribute('layout') || 'standard';
      const format = this.getAttribute('format') || 'ansi';
      activeRows = applyLayout(layout);
      const unit = parseInt(this.getAttribute('unit') || '56', 10);
      const angle = parseInt(this.getAttribute('angle') || '8', 10);
      const gap = parseInt(this.getAttribute('gap') || '96', 10);
      const thumb = this.getAttribute('thumb') || 'minimal';

      const opts = { stateOf: this._stateOf.bind(this), spaceHalf: () => this.getAttribute('space-half') };

      let body;
      if (type === 'ergonomic') {
        body = renderErgo(unit, angle, gap, thumb, opts);
      } else if (type === 'laptop') {
        body = renderLaptop(unit, opts, format);
      } else {
        body = renderClassic(unit, opts, format);
      }

      this.shadowRoot.innerHTML = `<style>${css}</style>
        <div style="--unit:${unit}px">${body}</div>`;
    }
  }

  if (!customElements.get('typing-keyboard')) {
    customElements.define('typing-keyboard', TypingKeyboard);
  }
})();
