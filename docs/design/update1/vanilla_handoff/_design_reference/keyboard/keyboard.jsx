// keyboard.jsx
// Split ergonomic keyboard component for Russian ЙЦУКЕН layout.
// Finger colors are STRICT — defined by the project's design brief and config/settings.js.

const FINGER = {
  pink:   { fill: 'linear-gradient(180deg, #ff7675 0%, #e84393 100%)', solid: '#ff7675', label: 'Мизинец' },
  orange: { fill: 'linear-gradient(180deg, #fdcb6e 0%, #f39c12 100%)', solid: '#fdcb6e', label: 'Безымянный' },
  green:  { fill: 'linear-gradient(180deg, #00b894 0%, #00a085 100%)', solid: '#00b894', label: 'Средний' },
  blue:   { fill: 'linear-gradient(180deg, #74b9ff 0%, #0984e3 100%)', solid: '#74b9ff', label: 'Указательный лев.' },
  indigo: { fill: 'linear-gradient(180deg, #4a90e2 0%, #2d3436 100%)', solid: '#0984e3', label: 'Указательный прав.' },
  purple: { fill: 'linear-gradient(180deg, #a29bfe 0%, #6c5ce7 100%)', solid: '#a29bfe', label: 'Большой' },
};

// Layout data. Each row is split into {left, right} arrays of keys.
// Key shape: { l: lower, u?: upper, f: finger, w?: width units (default 1), home?: bool, code?: physical code }
const ROWS = [
  // row 0 — number row (15u total: Ё 1 2 3 4 5 | 6 7 8 9 0 - = ⌫)
  {
    left: [
      { l: 'Ё', u: '|', f: 'pink', w: 1, code: 'Backquote' },
      { l: '1', u: '!', f: 'pink', code: 'Digit1', alt: '1' },
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
  // row 1 — Й Ц У К Е | Н Г Ш Щ З Х Ъ
  {
    left: [
      { l: 'Tab', f: 'pink', w: 1.5, mod: true, code: 'Tab' },
      { l: 'Й', f: 'pink', code: 'KeyQ' },
      { l: 'Ц', f: 'orange', code: 'KeyW' },
      { l: 'У', f: 'green', code: 'KeyE' },
      { l: 'К', f: 'blue', code: 'KeyR' },
      { l: 'Е', f: 'blue', code: 'KeyT' },
    ],
    right: [
      { l: 'Н', f: 'indigo', code: 'KeyY' },
      { l: 'Г', f: 'indigo', code: 'KeyU' },
      { l: 'Ш', f: 'green', code: 'KeyI' },
      { l: 'Щ', f: 'orange', code: 'KeyO' },
      { l: 'З', f: 'pink', code: 'KeyP' },
      { l: 'Х', f: 'pink', code: 'BracketLeft' },
      { l: 'Ъ', f: 'pink', code: 'BracketRight' },
      { l: '\\', f: 'pink', w: 1, mod: true, code: 'Backslash' },
    ],
  },
  // row 2 — Ф Ы В А П | Р О Л Д Ж Э
  {
    left: [
      { l: 'Caps', f: 'pink', w: 1.75, mod: true, code: 'CapsLock' },
      { l: 'Ф', f: 'pink', code: 'KeyA' },
      { l: 'Ы', f: 'orange', code: 'KeyS' },
      { l: 'В', f: 'green', code: 'KeyD' },
      { l: 'А', f: 'blue', home: true, code: 'KeyF' },
      { l: 'П', f: 'blue', code: 'KeyG' },
    ],
    right: [
      { l: 'Р', f: 'indigo', code: 'KeyH' },
      { l: 'О', f: 'indigo', home: true, code: 'KeyJ' },
      { l: 'Л', f: 'green', code: 'KeyK' },
      { l: 'Д', f: 'orange', code: 'KeyL' },
      { l: 'Ж', f: 'pink', code: 'Semicolon' },
      { l: 'Э', f: 'pink', code: 'Quote' },
      { l: 'Enter', f: 'pink', w: 1.75, mod: true, code: 'Enter' },
    ],
  },
  // row 3 — Я Ч С М И | Т Ь Б Ю .
  {
    left: [
      { l: 'Shift', f: 'pink', w: 2.25, mod: true, code: 'ShiftLeft' },
      { l: 'Я', f: 'pink', code: 'KeyZ' },
      { l: 'Ч', f: 'orange', code: 'KeyX' },
      { l: 'С', f: 'green', code: 'KeyC' },
      { l: 'М', f: 'blue', code: 'KeyV' },
      { l: 'И', f: 'blue', code: 'KeyB' },
    ],
    right: [
      { l: 'Т', f: 'indigo', code: 'KeyN' },
      { l: 'Ь', f: 'indigo', code: 'KeyM' },
      { l: 'Б', f: 'green', code: 'Comma' },
      { l: 'Ю', f: 'orange', code: 'Period' },
      { l: '.', u: ',', f: 'pink', code: 'Slash' },
      { l: 'Shift', f: 'pink', w: 2.25, mod: true, code: 'ShiftRight' },
    ],
  },
];

// Thumb row depends on cluster mode
const THUMB_ROWS = {
  minimal: {
    left:  [{ l: 'Ctrl', f: 'pink', w: 1.25, mod: true, code: 'ControlLeft' },
            { l: 'Win',  f: 'pink', w: 1, mod: true, code: 'MetaLeft' },
            { l: 'Alt',  f: 'pink', w: 1, mod: true, code: 'AltLeft' },
            { l: 'Space', f: 'purple', w: 3, code: 'Space' }],
    right: [{ l: 'Space', f: 'purple', w: 3, code: 'Space' },
            { l: 'Alt',  f: 'pink', w: 1, mod: true, code: 'AltRight' },
            { l: 'Fn',   f: 'pink', w: 1, mod: true },
            { l: 'Ctrl', f: 'pink', w: 1.25, mod: true, code: 'ControlRight' }],
  },
  full: {
    // Moonlander-style: bigger thumb cluster with additional keys
    left:  [{ l: 'Ctrl', f: 'pink', w: 1.25, mod: true, code: 'ControlLeft' },
            { l: 'Win',  f: 'pink', w: 1, mod: true, code: 'MetaLeft' },
            { l: 'Alt',  f: 'pink', w: 1, mod: true, code: 'AltLeft' },
            { l: 'Space', f: 'purple', w: 2, code: 'Space' },
            { l: '⌫',   f: 'purple', w: 1.25, mod: true, code: 'Backspace', cluster: true }],
    right: [{ l: 'Enter', f: 'purple', w: 1.25, mod: true, code: 'Enter', cluster: true },
            { l: 'Space', f: 'purple', w: 2, code: 'Space' },
            { l: 'Alt',  f: 'pink', w: 1, mod: true, code: 'AltRight' },
            { l: 'Fn',   f: 'pink', w: 1, mod: true },
            { l: 'Ctrl', f: 'pink', w: 1.25, mod: true, code: 'ControlRight' }],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Key component

function Key({ data, unit, intensity, state, dark, geometry, rowIdx, modifierStyle = 'solid' }) {
  // state: 'default' | 'hover' | 'active' | 'highlight' | 'error'
  const finger = FINGER[data.f];
  const width = (data.w || 1) * unit;
  const height = unit * 0.92;

  // Visual treatment based on intensity tweak
  const showFullFill = intensity === 'full' && !data.mod;
  const showAccentStrip = intensity === 'strip' && !data.mod;
  const isActive = state === 'active';
  const isHighlight = state === 'highlight';
  const isHover = state === 'hover';
  const isError = state === 'error';

  // base background
  let bg = dark ? '#2a2a27' : '#ffffff';
  let labelColor = dark ? '#f3f1ea' : '#1a1a17';
  let borderColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  let shadow = dark
    ? '0 1px 0 rgba(255,255,255,0.04) inset, 0 2px 4px rgba(0,0,0,0.5)'
    : '0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04)';

  if (showFullFill) {
    bg = finger.fill;
    labelColor = '#ffffff';
    borderColor = 'rgba(0,0,0,0.06)';
  } else if (data.mod) {
    bg = dark ? '#23231f' : '#f1efe8';
    labelColor = dark ? '#bcb9af' : '#6e6a5f';
    if (modifierStyle === 'hatched') {
      // Diagonal-stripe pattern via repeating-linear-gradient
      const baseColor = dark ? '#23231f' : '#f1efe8';
      const stripeColor = dark ? '#1a1a17' : '#e3e0d5';
      bg = `repeating-linear-gradient(135deg, ${baseColor} 0 6px, ${stripeColor} 6px 9px)`;
    }
  }

  // State overrides
  if (isActive) {
    bg = finger.fill;
    labelColor = '#ffffff';
    shadow = `0 0 0 2px ${finger.solid}, 0 0 0 6px ${finger.solid}33, 0 4px 12px ${finger.solid}66`;
  } else if (isHighlight) {
    // pulsing border — use solid color outline
    shadow = `0 0 0 2px ${finger.solid}, 0 0 18px ${finger.solid}66, ${shadow}`;
    if (!showFullFill) {
      bg = dark ? `${finger.solid}22` : `${finger.solid}1a`;
      labelColor = dark ? '#ffffff' : '#1a1a17';
    }
  } else if (isError) {
    bg = '#ff4757';
    labelColor = '#ffffff';
    shadow = '0 0 0 2px #ff4757, 0 4px 12px rgba(255,71,87,0.5)';
  } else if (isHover) {
    shadow = `0 0 0 1.5px ${finger.solid}99, ${shadow}`;
  }

  // Center alignment for ALL modifier keys (incl. short ones like arrows)
  const isMod = data.mod;
  const centered = isMod;
  const isLongMod = isMod && data.l.length > 2;

  return (
    <div
      className="ergo-key"
      data-finger={data.f}
      data-code={data.code}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background: bg,
        color: labelColor,
        border: `1px solid ${borderColor}`,
        boxShadow: shadow,
        borderRadius: `${unit * 0.14}px`,
        position: 'relative',
        display: 'flex',
        alignItems: centered ? 'center' : 'flex-end',
        justifyContent: centered ? 'center' : 'flex-start',
        padding: `${unit * 0.12}px`,
        fontFamily: isLongMod ? '"Manrope", sans-serif' : '"JetBrains Mono", ui-monospace, monospace',
        fontWeight: 600,
        fontSize: isLongMod ? `${unit * 0.22}px` : `${unit * 0.32}px`,
        transition: 'all .15s ease',
        flexShrink: 0,
      }}
    >
      {/* Accent strip (intensity='strip' mode) */}
      {showAccentStrip && (
        <span style={{
          position: 'absolute',
          left: `${unit * 0.14}px`,
          right: `${unit * 0.14}px`,
          top: `${unit * 0.1}px`,
          height: `${unit * 0.06}px`,
          background: finger.fill,
          borderRadius: '999px',
        }} />
      )}

      {/* Upper character */}
      {data.u && !centered && (
        <span style={{
          position: 'absolute',
          top: `${unit * 0.1}px`,
          right: `${unit * 0.14}px`,
          fontSize: `${unit * 0.2}px`,
          opacity: 0.55,
          fontWeight: 500,
        }}>{data.u}</span>
      )}

      {/* Main label */}
      <span style={{
        textAlign: centered ? 'center' : 'left',
        lineHeight: 1,
        userSelect: 'none',
      }}>{data.l}</span>

      {/* Home row bump indicator (under А and О) */}
      {data.home && (
        <span style={{
          position: 'absolute',
          bottom: `${unit * 0.08}px`,
          left: '50%',
          width: `${unit * 0.22}px`,
          height: `${unit * 0.05}px`,
          background: isActive || (showFullFill) ? 'rgba(255,255,255,0.8)' : (dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'),
          borderRadius: '999px',
          transform: 'translateX(-50%)',
        }} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single half of the keyboard

function KeyboardHalf({ side, unit, intensity, dark, hand, geometry, thumbCluster, getState, modifierStyle = 'solid' }) {
  const rows = ROWS.map(r => r[side]);
  const thumb = THUMB_ROWS[thumbCluster][side];

  // Geometry shift per row (only matters for staggered)
  // Standard staggered offsets: row0:0, row1:0.5, row2:0.75 (right side mirrored)
  // For column-stagger we shift individual keys vertically
  const rowOffsets = geometry === 'ortho'
    ? [0, 0, 0, 0]
    : (side === 'left'
        ? [0, 0, unit * 0.25, unit * 0.5]  // left grows
        : [0, 0, unit * 0.25, unit * 0.5]); // right grows mirrored

  // Column vertical offsets for column-stagger (per finger column, fingers fan out)
  // Outer pinky drops, middle/ring rise — Ergodox-style
  const colOffsets = (key, idxInRow) => {
    if (geometry !== 'column-stagger') return 0;
    // map finger to offset
    const offMap = { pink: 4, orange: -4, green: -6, blue: -2, indigo: -2, purple: 0 };
    return offMap[key.f] || 0;
  };

  const gap = unit * 0.08;

  return (
    <div
      className={`ergo-half ergo-half-${side}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: `${gap}px`,
        flexShrink: 0,
      }}
    >
      {rows.map((row, rIdx) => {
        // For staggered, right side rows shift inward (away from gap) progressively
        const justify = side === 'left' ? 'flex-end' : 'flex-start';
        return (
          <div key={rIdx} style={{
            display: 'flex',
            gap: `${gap}px`,
            justifyContent: justify,
            transform: geometry === 'staggered' ? `translateX(${side === 'left' ? -rowOffsets[rIdx] : rowOffsets[rIdx]}px)` : 'none',
          }}>
            {row.map((k, kIdx) => (
              <div key={kIdx} style={{ transform: `translateY(${colOffsets(k, kIdx)}px)` }}>
                <Key data={k} unit={unit} intensity={intensity} dark={dark}
                     geometry={geometry} rowIdx={rIdx} modifierStyle={modifierStyle}
                     state={getState(k, rIdx, side)} />
              </div>
            ))}
          </div>
        );
      })}
      {/* Thumb row */}
      <div style={{
        display: 'flex',
        gap: `${gap}px`,
        justifyContent: side === 'left' ? 'flex-end' : 'flex-start',
        marginTop: `${unit * 0.12}px`,
      }}>
        {thumb.map((k, kIdx) => {
          const cluster = k.cluster;
          return (
            <div key={kIdx} style={{
              transform: cluster ? `translateY(${-unit * 0.45}px)` : 'none',
            }}>
              <Key data={k} unit={unit} intensity={intensity} dark={dark}
                   geometry={geometry} rowIdx={4} modifierStyle={modifierStyle}
                   state={getState(k, 4, side)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Full ergonomic keyboard

function ErgoKeyboard({
  unit = 56,
  angle = 14,
  gap = 96,
  intensity = 'full',     // 'full' | 'strip' | 'highlight'
  dark = false,
  geometry = 'staggered', // 'staggered' | 'ortho' | 'column-stagger'
  thumbCluster = 'minimal', // 'minimal' | 'full'
  activeCode = null,
  highlightChar = null,
  errorCode = null,
  hoverCode = null,
  showWristRest = true,
  modifierStyle = 'solid',
}) {
  // resolve which key matches a typed char
  const matchHighlight = (k) => {
    if (!highlightChar) return false;
    const ch = highlightChar.toLowerCase();
    if ((k.l || '').toLowerCase() === ch) return true;
    if (k.alt && k.alt === ch) return true;
    return false;
  };

  const getState = (k, rIdx, side) => {
    if (errorCode && k.code === errorCode) return 'error';
    if (activeCode && k.code === activeCode) return 'active';
    if (matchHighlight(k)) return 'highlight';
    if (hoverCode && k.code === hoverCode) return 'hover';
    return 'default';
  };

  // wrist rest shape between halves
  const wristW = gap * 0.7;
  const wristH = unit * 1.6;

  return (
    <div
      className="ergo-keyboard"
      style={{
        display: 'flex',
        gap: `${gap}px`,
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: `${unit * 0.4}px ${unit * 0.4}px ${unit * 0.2}px`,
        perspective: '1200px',
      }}
    >
      <div style={{
        transform: `rotate(-${angle}deg)`,
        transformOrigin: 'bottom right',
      }}>
        <KeyboardHalf side="left" unit={unit} intensity={intensity} dark={dark}
                      geometry={geometry} thumbCluster={thumbCluster} getState={getState} modifierStyle={modifierStyle} />
      </div>

      <div style={{
        transform: `rotate(${angle}deg)`,
        transformOrigin: 'bottom left',
      }}>
        <KeyboardHalf side="right" unit={unit} intensity={intensity} dark={dark}
                      geometry={geometry} thumbCluster={thumbCluster} getState={getState} modifierStyle={modifierStyle} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile/compact variant — two halves butted together, no rotation

function MobileErgoKeyboard({ unit = 32, intensity = 'full', dark = false, activeCode, highlightChar, activeHand = null }) {
  const matchHighlight = (k) => {
    if (!highlightChar) return false;
    const ch = highlightChar.toLowerCase();
    if ((k.l || '').toLowerCase() === ch) return true;
    if (k.alt && k.alt === ch) return true;
    return false;
  };
  const getState = (k) => {
    if (activeCode && k.code === activeCode) return 'active';
    if (matchHighlight(k)) return 'highlight';
    return 'default';
  };

  return (
    <div style={{
      display: 'flex',
      gap: `${unit * 0.25}px`,
      justifyContent: 'center',
      alignItems: 'flex-end',
      padding: `${unit * 0.4}px`,
    }}>
      <div style={{ opacity: activeHand === 'right' ? 0.4 : 1, transition: 'opacity .25s ease' }}>
        <KeyboardHalf side="left" unit={unit} intensity={intensity} dark={dark}
                      geometry="staggered" thumbCluster="minimal" getState={getState} />
      </div>
      <div style={{ opacity: activeHand === 'left' ? 0.4 : 1, transition: 'opacity .25s ease' }}>
        <KeyboardHalf side="right" unit={unit} intensity={intensity} dark={dark}
                      geometry="staggered" thumbCluster="minimal" getState={getState} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Finger color → which key each char belongs to (for typing practice highlight)

const CHAR_TO_FINGER = (() => {
  const m = {};
  [...ROWS, { left: THUMB_ROWS.minimal.left, right: THUMB_ROWS.minimal.right }].forEach(row => {
    [...row.left, ...row.right].forEach(k => {
      if (!k.l) return;
      const ch = k.l.toLowerCase();
      if (ch.length === 1) m[ch] = k.f;
      if (k.alt) m[k.alt.toLowerCase()] = k.f;
    });
  });
  m[' '] = 'purple';
  return m;
})();

// ─────────────────────────────────────────────────────────────────────────────
// Numpad data (right-side numpad, conventional Russian touch-typing fingers)
//   Index:  1, 4, 7, Num /
//   Middle: 2, 5, 8, Num *
//   Ring:   3, 6, 9, Num -
//   Pinky:  +, Enter, NumLock (rightmost edge)
//   Thumb:  0

const NUMPAD = [
  [
    { l: 'Num', f: 'pink', mod: true },
    { l: '/', f: 'blue' },
    { l: '*', f: 'green' },
    { l: '-', f: 'orange' },
  ],
  [
    { l: '7', f: 'blue' },
    { l: '8', f: 'green' },
    { l: '9', f: 'orange' },
    { l: '+', f: 'pink', mod: true, tallH: 2 },
  ],
  [
    { l: '4', f: 'blue' },
    { l: '5', f: 'green', home: true },
    { l: '6', f: 'orange' },
  ],
  [
    { l: '1', f: 'blue' },
    { l: '2', f: 'green' },
    { l: '3', f: 'orange' },
    { l: 'Ent', f: 'pink', mod: true, tallH: 2 },
  ],
  [
    { l: '0', f: 'purple', w: 2 },
    { l: ',', f: 'pink' },
  ],
];

// Nav cluster (Ins/Home/PgUp / Del/End/PgDn) + arrows row
const NAV = {
  top: [
    [{ l: 'Ins', f: 'pink', mod: true }, { l: 'Home', f: 'pink', mod: true }, { l: 'PgUp', f: 'pink', mod: true }],
    [{ l: 'Del', f: 'pink', mod: true }, { l: 'End', f: 'pink', mod: true }, { l: 'PgDn', f: 'pink', mod: true }],
  ],
  arrows: {
    up: { l: '↑', f: 'pink', mod: true },
    left: { l: '←', f: 'pink', mod: true },
    down: { l: '↓', f: 'pink', mod: true },
    right: { l: '→', f: 'pink', mod: true },
  },
};

// Classic keyboard bottom (modifier row, single Space) — totals 15u
const CLASSIC_BOTTOM = [
  { l: 'Ctrl', f: 'pink', mod: true, w: 1.5, code: 'ControlLeft' },
  { l: 'Win', f: 'pink', mod: true, w: 1.25, code: 'MetaLeft' },
  { l: 'Alt', f: 'pink', mod: true, w: 1.25, code: 'AltLeft' },
  { l: 'Space', f: 'purple', w: 6.5, code: 'Space' },
  { l: 'Alt', f: 'pink', mod: true, w: 1.25, code: 'AltRight' },
  { l: 'Fn', f: 'pink', mod: true, w: 1.25 },
  { l: 'Ctrl', f: 'pink', mod: true, w: 1.5, code: 'ControlRight' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Classic/Laptop keyboard (single-piece, no rotation)
// Layout uses a fixed 5-row grid shared across alpha / nav / numpad sections,
// so every cluster lines up horizontally like a real full-size keyboard.

function ClassicKeyboard({
  unit = 50,
  intensity = 'full',
  dark = false,
  variant = 'classic',
  activeCode = null,
  highlightChar = null,
  errorCode = null,
  hoverCode = null,
  modifierStyle = 'solid',
}) {
  const matchHighlight = (k) => {
    if (!highlightChar) return false;
    const ch = highlightChar.toLowerCase();
    if ((k.l || '').toLowerCase() === ch) return true;
    if (k.alt && k.alt === ch) return true;
    return false;
  };
  const getState = (k) => {
    if (errorCode && k.code === errorCode) return 'error';
    if (activeCode && k.code === activeCode) return 'active';
    if (matchHighlight(k)) return 'highlight';
    if (hoverCode && k.code === hoverCode) return 'hover';
    return 'default';
  };

  const gap = unit * 0.08;
  const rowH = unit * 0.92;
  const rowPitch = rowH + gap;
  const sectionGap = unit * 0.55;

  // Build merged main rows
  const merged = ROWS.map(r => [...r.left, ...r.right]);

  // ── Row-edge alignment ────────────────────────────────────────────────
  // Each row may have a different TOTAL width (keys + gaps). We pick the
  // widest row as the anchor, then pad shorter rows by adding width to a
  // designated pad key so every row's right edge lands on the same line.
  const gapInU = 0.08;
  const rowWidthU = (row) => {
    const keys = row.reduce((s, k) => s + (k.w || 1), 0);
    const gaps = (row.length - 1) * gapInU;
    return keys + gaps;
  };
  const allRows = [...merged, CLASSIC_BOTTOM];
  const anchorU = Math.max(...allRows.map(rowWidthU));

  // Which keys absorb the deficit per row, kept symmetric where there's a pair
  const padIndices = {
    0: ['last'],        // row 0: Backspace (or just shift right edge)
    1: [0],             // row 1: Tab (\\ stays 1u)
    2: [0, 'last'],     // row 2: Caps + Enter (kept equal)
    3: [0, 'last'],     // row 3: both Shifts (kept equal)
  };
  const padRow = (row, indices) => {
    const deficit = anchorU - rowWidthU(row);
    if (deficit <= 0.0001 || !indices.length) return row;
    const real = indices.map(i => i === 'last' ? row.length - 1 : i);
    const perKey = deficit / real.length;
    return row.map((k, i) => real.includes(i)
      ? { ...k, w: (k.w || 1) + perKey }
      : k);
  };
  const mergedPadded = merged.map((row, ri) => padRow(row, padIndices[ri] || []));
  // Bottom row: all deficit goes to Space
  const bottomPadded = (() => {
    const deficit = anchorU - rowWidthU(CLASSIC_BOTTOM);
    return CLASSIC_BOTTOM.map((k) =>
      k.l === 'Space' ? { ...k, w: (k.w || 1) + deficit } : k);
  })();

  // A grid row container: same fixed height for every section's row
  const RowSlot = ({ children, justify = 'flex-start' }) => (
    <div style={{
      height: rowH,
      display: 'flex',
      gap: `${gap}px`,
      justifyContent: justify,
      alignItems: 'center',
    }}>{children}</div>
  );

  const renderKey = (k, i) => (
    <Key key={i} data={k} unit={unit} intensity={intensity} dark={dark}
         geometry="staggered" rowIdx={0} state={getState(k)} modifierStyle={modifierStyle} />
  );

  // ── Alpha block (5 rows) ────────────────────────────────────────────────
  const alpha = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
      {mergedPadded.map((row, ri) => (
        <RowSlot key={ri}>{row.map(renderKey)}</RowSlot>
      ))}
      <RowSlot>{bottomPadded.map(renderKey)}</RowSlot>
    </div>
  );

  // ── Nav cluster (3 cols × 5 rows) ──────────────────────────────────────
  const navTopA = [
    { l: 'Ins', f: 'pink', mod: true }, { l: 'Home', f: 'pink', mod: true }, { l: 'PgUp', f: 'pink', mod: true },
  ];
  const navTopB = [
    { l: 'Del', f: 'pink', mod: true }, { l: 'End', f: 'pink', mod: true }, { l: 'PgDn', f: 'pink', mod: true },
  ];
  const ArrowKey = (data) => (
    <Key data={data} unit={unit} intensity={intensity} dark={dark}
         geometry="staggered" rowIdx={0} state={getState(data)} modifierStyle={modifierStyle} />
  );

  const nav = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
      <RowSlot>{navTopA.map(renderKey)}</RowSlot>
      <RowSlot>{navTopB.map(renderKey)}</RowSlot>
      <RowSlot />
      <RowSlot justify="center">
        {/* spacer for left position to keep up arrow centered */}
        <div style={{ width: unit }} />
        {ArrowKey({ l: '↑', f: 'pink', mod: true })}
        <div style={{ width: unit }} />
      </RowSlot>
      <RowSlot>
        {ArrowKey({ l: '←', f: 'pink', mod: true })}
        {ArrowKey({ l: '↓', f: 'pink', mod: true })}
        {ArrowKey({ l: '→', f: 'pink', mod: true })}
      </RowSlot>
    </div>
  );

  // ── Numpad (4 cols × 5 rows, CSS Grid with tall + and Enter) ────────────
  // Color scheme matches reference: NumLock & Enter neutral (mod);
  // col 1 (7,4,1) = blue (index); col 2 (/,8,5,2) = green (middle);
  // col 3 (*,9,6,3,,) = orange (ring); right-edge (-,+) = orange (ring reach);
  // 0 = purple (thumb).
  const numpadCells = [
    // row 1
    { l: 'Num', f: 'pink', mod: true, gc: '1', gr: '1' },
    { l: '/',   f: 'green',           gc: '2', gr: '1' },
    { l: '*',   f: 'orange',          gc: '3', gr: '1' },
    { l: '-',   f: 'orange',          gc: '4', gr: '1' },
    // row 2
    { l: '7',   f: 'blue',            gc: '1', gr: '2' },
    { l: '8',   f: 'green',           gc: '2', gr: '2' },
    { l: '9',   f: 'orange',          gc: '3', gr: '2' },
    { l: '+',   f: 'orange',          gc: '4', gr: '2 / span 2' },
    // row 3
    { l: '4',   f: 'blue',            gc: '1', gr: '3' },
    { l: '5',   f: 'green', home: true, gc: '2', gr: '3' },
    { l: '6',   f: 'orange',          gc: '3', gr: '3' },
    // row 4
    { l: '1',   f: 'blue',            gc: '1', gr: '4' },
    { l: '2',   f: 'green',           gc: '2', gr: '4' },
    { l: '3',   f: 'orange',          gc: '3', gr: '4' },
    { l: 'Ent', f: 'pink', mod: true, gc: '4', gr: '4 / span 2' },
    // row 5
    { l: '0',   f: 'purple',          gc: '1 / span 2', gr: '5' },
    { l: ',',   f: 'orange',          gc: '3', gr: '5' },
  ];

  const numpad = (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(4, ${unit}px)`,
      gridTemplateRows: `repeat(5, ${rowH}px)`,
      gap: `${gap}px`,
    }}>
      {numpadCells.map((c, i) => (
        <div key={i} style={{ gridColumn: c.gc, gridRow: c.gr }}>
          <GridKey data={c} unit={unit} intensity={intensity} dark={dark}
                   state={getState(c)} modifierStyle={modifierStyle} />
        </div>
      ))}
    </div>
  );

  // ── Laptop arrows (inline, bottom-right under main block) ──────────────
  const laptopArrows = (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(3, ${unit * 0.85}px)`,
      gridTemplateRows: `${rowH * 0.5}px ${rowH * 0.5}px`,
      gap: `${gap}px`,
      alignSelf: 'flex-end',
    }}>
      <div style={{ gridColumn: '2', gridRow: '1' }}>
        <Key data={{ l: '↑', f: 'pink', mod: true }} unit={unit * 0.85} intensity={intensity} dark={dark}
             geometry="staggered" rowIdx={0} state={getState({l:'↑'})} modifierStyle={modifierStyle} />
      </div>
      <div style={{ gridColumn: '1', gridRow: '2' }}>
        <Key data={{ l: '←', f: 'pink', mod: true }} unit={unit * 0.85} intensity={intensity} dark={dark}
             geometry="staggered" rowIdx={0} state={getState({l:'←'})} modifierStyle={modifierStyle} />
      </div>
      <div style={{ gridColumn: '2', gridRow: '2' }}>
        <Key data={{ l: '↓', f: 'pink', mod: true }} unit={unit * 0.85} intensity={intensity} dark={dark}
             geometry="staggered" rowIdx={0} state={getState({l:'↓'})} modifierStyle={modifierStyle} />
      </div>
      <div style={{ gridColumn: '3', gridRow: '2' }}>
        <Key data={{ l: '→', f: 'pink', mod: true }} unit={unit * 0.85} intensity={intensity} dark={dark}
             geometry="staggered" rowIdx={0} state={getState({l:'→'})} modifierStyle={modifierStyle} />
      </div>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      gap: `${sectionGap}px`,
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: `${unit * 0.3}px`,
    }}>
      {alpha}
      {variant === 'classic' && nav}
      {variant === 'classic' && numpad}
      {variant === 'laptop' && laptopArrows}
    </div>
  );
}

// Grid-placed key — accepts gc/gr metadata and fills its grid cell completely.
function GridKey({ data, unit, dark, intensity, state, modifierStyle }) {
  const finger = FINGER[data.f];
  const showFullFill = intensity === 'full' && !data.mod;
  const showAccentStrip = intensity === 'strip' && !data.mod;
  const isActive = state === 'active';
  const isHighlight = state === 'highlight';
  const isHover = state === 'hover';
  const isError = state === 'error';

  let bg = dark ? '#2a2a27' : '#ffffff';
  let labelColor = dark ? '#f3f1ea' : '#1a1a17';
  let borderColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  let shadow = dark
    ? '0 1px 0 rgba(255,255,255,0.04) inset, 0 2px 4px rgba(0,0,0,0.5)'
    : '0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04)';
  if (showFullFill) {
    bg = finger.fill; labelColor = '#ffffff'; borderColor = 'rgba(0,0,0,0.06)';
  } else if (data.mod) {
    bg = dark ? '#23231f' : '#f1efe8';
    labelColor = dark ? '#bcb9af' : '#6e6a5f';
    if (modifierStyle === 'hatched') {
      const a = dark ? '#23231f' : '#f1efe8';
      const b = dark ? '#1a1a17' : '#e3e0d5';
      bg = `repeating-linear-gradient(135deg, ${a} 0 6px, ${b} 6px 9px)`;
    }
  }
  if (isActive) {
    bg = finger.fill; labelColor = '#ffffff';
    shadow = `0 0 0 2px ${finger.solid}, 0 0 0 6px ${finger.solid}33, 0 4px 12px ${finger.solid}66`;
  } else if (isHighlight) {
    shadow = `0 0 0 2px ${finger.solid}, 0 0 18px ${finger.solid}66, ${shadow}`;
    if (!showFullFill) { bg = dark ? `${finger.solid}22` : `${finger.solid}1a`; labelColor = dark ? '#ffffff' : '#1a1a17'; }
  } else if (isError) {
    bg = '#ff4757'; labelColor = '#ffffff';
    shadow = '0 0 0 2px #ff4757, 0 4px 12px rgba(255,71,87,0.5)';
  } else if (isHover) {
    shadow = `0 0 0 1.5px ${finger.solid}99, ${shadow}`;
  }

  const isLongMod = data.mod && data.l && data.l.length > 2;

  return (
    <div className="ergo-key" style={{
      width: '100%', height: '100%',
      background: bg, color: labelColor,
      border: `1px solid ${borderColor}`,
      boxShadow: shadow,
      borderRadius: unit * 0.14,
      display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: isLongMod ? '"Manrope", sans-serif' : '"JetBrains Mono", ui-monospace, monospace',
      fontWeight: 600,
      fontSize: isLongMod ? unit * 0.22 : unit * 0.34,
      position: 'relative',
      transition: 'all .15s ease',
    }}>
      {showAccentStrip && (
        <span style={{
          position: 'absolute', left: unit * 0.14, right: unit * 0.14, top: unit * 0.1,
          height: unit * 0.06, background: finger.fill, borderRadius: '999px',
        }} />
      )}
      <span style={{ userSelect: 'none', lineHeight: 1 }}>{data.l}</span>
      {data.home && (
        <span style={{
          position: 'absolute', bottom: unit * 0.08, left: '50%',
          width: unit * 0.22, height: unit * 0.05,
          background: isActive || showFullFill ? 'rgba(255,255,255,0.8)' : (dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'),
          borderRadius: '999px', transform: 'translateX(-50%)',
        }} />
      )}
    </div>
  );
}

Object.assign(window, {
  ErgoKeyboard, MobileErgoKeyboard, ClassicKeyboard,
  FINGER, CHAR_TO_FINGER, ROWS, THUMB_ROWS, NUMPAD, NAV,
});
