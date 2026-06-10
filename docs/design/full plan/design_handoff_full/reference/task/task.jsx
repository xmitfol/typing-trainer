// task.jsx — Exercise execution screen (focused typing mode)
// Modal-style overlay with mentor, keyboard, real-time metrics.

const { useState, useEffect } = React;

const C = {
  bg: '#f5f4f0', surface: '#ffffff', ink: '#1a1a17',
  sub: 'rgba(26,26,23,0.6)', faint: 'rgba(26,26,23,0.4)',
  divider: 'rgba(0,0,0,0.08)',
  accent: '#3b82f6', success: '#10b981', warm: '#f59e0b',
};
const fontUI = '"Manrope", ui-sans-serif, system-ui, sans-serif';
const fontMono = '"JetBrains Mono", ui-monospace, monospace';
const fontSerif = '"Source Serif 4", Georgia, serif';
const FP = { pink: '#ff7675', orange: '#fdcb6e', green: '#00b894', blue: '#74b9ff', indigo: '#0984e3', purple: '#a29bfe' };

// ─────────────────────────────────────────────────────────────────────────────
// Mini keyboard for exercise screen (classic layout, all keys colored)

const ROWS = [
  // row 0: numbers + backspace
  [
    { l: 'ё', u: '|', f: 'pink' }, { l: '1', u: '!', f: 'pink' },
    { l: '2', u: '"', f: 'orange' }, { l: '3', u: '№', f: 'green' },
    { l: '4', u: ';', f: 'blue' }, { l: '5', u: '%', f: 'blue' },
    { l: '6', u: ':', f: 'indigo' }, { l: '7', u: '?', f: 'indigo' },
    { l: '8', u: '*', f: 'green' }, { l: '9', u: '(', f: 'orange' },
    { l: '0', u: ')', f: 'pink' }, { l: '-', u: '_', f: 'pink' },
    { l: '=', u: '+', f: 'pink' }, { l: 'Backsp', f: null, mod: true, w: 2 },
  ],
  // row 1: Tab + ЙЦУКЕН...
  [
    { l: 'Tab', f: null, mod: true, w: 1.5 },
    { l: 'й', f: 'pink' }, { l: 'ц', f: 'orange' }, { l: 'у', f: 'green' },
    { l: 'к', f: 'blue' }, { l: 'е', f: 'blue' },
    { l: 'н', f: 'indigo' }, { l: 'г', f: 'indigo' }, { l: 'ш', f: 'green' },
    { l: 'щ', f: 'orange' }, { l: 'з', f: 'pink' }, { l: 'х', f: 'pink' },
    { l: 'ъ', f: 'pink' }, { l: '\\', f: null, mod: true, w: 1 },
  ],
  // row 2: Caps + ФЫВА...
  [
    { l: 'Caps', f: null, mod: true, w: 1.75 },
    { l: 'ф', f: 'pink' }, { l: 'ы', f: 'orange' }, { l: 'в', f: 'green' },
    { l: 'а', f: 'blue', home: true, current: true },
    { l: 'п', f: 'blue' },
    { l: 'р', f: 'indigo' }, { l: 'о', f: 'indigo', home: true },
    { l: 'л', f: 'green' }, { l: 'д', f: 'orange' },
    { l: 'ж', f: 'pink' }, { l: 'э', f: 'pink' },
    { l: 'Enter', f: null, mod: true, w: 1.75 },
  ],
  // row 3: Shift + ЯЧСМИ...
  [
    { l: 'Shift', f: null, mod: true, w: 2.25 },
    { l: 'я', f: 'pink' }, { l: 'ч', f: 'orange' }, { l: 'с', f: 'green' },
    { l: 'м', f: 'blue' }, { l: 'и', f: 'blue' },
    { l: 'т', f: 'indigo' }, { l: 'ь', f: 'indigo' },
    { l: 'б', f: 'green' }, { l: 'ю', f: 'orange' }, { l: '.', u: ',', f: 'pink' },
    { l: 'Shift', f: null, mod: true, w: 2.25 },
  ],
  // row 4: Ctrl/Win/Alt/Space/Alt/Fn/Ctrl
  [
    { l: 'Ctrl', f: null, mod: true, w: 1.5 },
    { l: 'Win', f: null, mod: true, w: 1.25 },
    { l: 'Alt', f: null, mod: true, w: 1.25 },
    { l: 'Space', f: 'purple', w: 6.5 },
    { l: 'Alt', f: null, mod: true, w: 1.25 },
    { l: 'Fn', f: null, mod: true, w: 1.25 },
    { l: 'Ctrl', f: null, mod: true, w: 1.5 },
  ],
];

const NAV_BLOCK = [
  ['Ins', 'Home', 'PgUp'],
  ['Del', 'End', 'PgDn'],
];

const NUMPAD = [
  [{ l: 'Num', f: null, mod: true }, { l: '/', f: 'green' }, { l: '*', f: 'orange' }, { l: '-', f: 'orange' }],
  [{ l: '7', f: 'blue' }, { l: '8', f: 'green' }, { l: '9', f: 'orange' }, { l: '+', f: 'orange', tall: true }],
  [{ l: '4', f: 'blue' }, { l: '5', f: 'green', home: true }, { l: '6', f: 'orange' }],
  [{ l: '1', f: 'blue' }, { l: '2', f: 'green' }, { l: '3', f: 'orange' }, { l: 'Ent', f: null, mod: true, tall: true }],
  [{ l: '0', f: 'purple', wide: true }, { l: ',', f: 'orange' }],
];

function ExerciseKey({ data, unit }) {
  const w = (data.w || 1) * unit;
  const h = unit * 0.92;
  const colored = data.f && !data.mod;
  const bg = colored ? FP[data.f] : '#fff';
  const fg = colored ? '#1a1a17' : (data.mod ? C.sub : C.ink);
  const isMod = data.mod;
  const isLong = isMod && data.l.length > 2;
  const current = data.current;

  return (
    <div style={{
      width: w, height: h,
      background: bg,
      border: current ? `2px solid ${FP[data.f]}` : `1px solid ${data.mod ? C.divider : 'rgba(0,0,0,0.06)'}`,
      borderRadius: 7,
      display: 'flex',
      alignItems: isMod ? 'center' : 'flex-end',
      justifyContent: isMod ? 'center' : 'flex-start',
      padding: 6,
      fontFamily: isLong ? fontUI : fontMono,
      fontWeight: 600,
      fontSize: isLong ? 11 : 14,
      color: fg,
      position: 'relative',
      boxShadow: current
        ? `0 0 0 4px ${FP[data.f]}55, 0 4px 8px ${FP[data.f]}66`
        : '0 1px 2px rgba(0,0,0,0.04)',
      backgroundImage: current
        ? `repeating-linear-gradient(45deg, transparent 0 4px, rgba(255,255,255,0.4) 4px 6px)`
        : 'none',
    }}>
      {data.u && !isMod && (
        <span style={{
          position: 'absolute', top: 4, right: 5,
          fontSize: 9, opacity: 0.55, fontWeight: 500,
        }}>{data.u}</span>
      )}
      <span>{data.l}</span>
      {data.home && (
        <span style={{
          position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
          width: 10, height: 2, background: 'rgba(0,0,0,0.4)', borderRadius: 999,
        }} />
      )}
    </div>
  );
}

function ClassicKeyboard({ unit = 36 }) {
  const gap = 4;
  const rowH = unit * 0.92;
  // pad rows so right edge aligns
  const sumW = (row) => row.reduce((s, k) => s + (k.w || 1), 0) + (row.length - 1) * (gap / unit);
  const maxW = Math.max(...ROWS.map(sumW));
  const padded = ROWS.map((row, ri) => {
    const deficit = maxW - sumW(row);
    if (deficit <= 0.001) return row;
    // distribute deficit
    if (ri === 0 || ri === 1) {
      // row 0/1: add to last key
      return row.map((k, i) => i === row.length - 1 ? { ...k, w: (k.w || 1) + deficit } : k);
    }
    if (ri === 2 || ri === 3) {
      // row 2/3: split between first and last
      return row.map((k, i) => (i === 0 || i === row.length - 1) ? { ...k, w: (k.w || 1) + deficit / 2 } : k);
    }
    // row 4: space absorbs
    return row.map(k => k.l === 'Space' ? { ...k, w: (k.w || 1) + deficit } : k);
  });

  return (
    <div style={{ display: 'flex', gap: unit * 0.4, justifyContent: 'center' }}>
      {/* Alpha block */}
      <div style={{ display: 'flex', flexDirection: 'column', gap }}>
        {padded.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap }}>
            {row.map((k, ki) => <ExerciseKey key={ki} data={k} unit={unit} />)}
          </div>
        ))}
      </div>

      {/* Nav cluster */}
      <div style={{ display: 'flex', flexDirection: 'column', gap, alignItems: 'center' }}>
        <div style={{ height: rowH }} />
        {NAV_BLOCK.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap }}>
            {row.map((l, i) => <ExerciseKey key={i} data={{ l, mod: true }} unit={unit} />)}
          </div>
        ))}
        <div style={{ height: rowH }} />
        <ExerciseKey data={{ l: '↑', mod: true }} unit={unit} />
        <div style={{ display: 'flex', gap }}>
          {['←','↓','→'].map(l => <ExerciseKey key={l} data={{ l, mod: true }} unit={unit} />)}
        </div>
      </div>

      {/* Numpad */}
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(4, ${unit}px)`,
        gridTemplateRows: `repeat(5, ${rowH}px)`, gap,
      }}>
        {NUMPAD.flat().map((k, i) => {
          // figure out grid positions
          let gc, gr;
          // simple positional walk
          return null; // handled below explicitly
        })}
        {/* row 1 */}
        <div style={{ gridColumn: '1', gridRow: '1' }}><ExerciseKey data={NUMPAD[0][0]} unit={unit} /></div>
        <div style={{ gridColumn: '2', gridRow: '1' }}><ExerciseKey data={NUMPAD[0][1]} unit={unit} /></div>
        <div style={{ gridColumn: '3', gridRow: '1' }}><ExerciseKey data={NUMPAD[0][2]} unit={unit} /></div>
        <div style={{ gridColumn: '4', gridRow: '1' }}><ExerciseKey data={NUMPAD[0][3]} unit={unit} /></div>
        {/* row 2 */}
        <div style={{ gridColumn: '1', gridRow: '2' }}><ExerciseKey data={NUMPAD[1][0]} unit={unit} /></div>
        <div style={{ gridColumn: '2', gridRow: '2' }}><ExerciseKey data={NUMPAD[1][1]} unit={unit} /></div>
        <div style={{ gridColumn: '3', gridRow: '2' }}><ExerciseKey data={NUMPAD[1][2]} unit={unit} /></div>
        <div style={{ gridColumn: '4', gridRow: '2 / span 2' }}>
          <div style={{ width: unit, height: rowH * 2 + gap, background: '#fff', border: `1px solid ${C.divider}`, borderRadius: 7, display: 'grid', placeItems: 'center', fontFamily: fontMono, fontWeight: 600, fontSize: 14, color: C.ink, backgroundColor: FP.orange }}>+</div>
        </div>
        {/* row 3 */}
        <div style={{ gridColumn: '1', gridRow: '3' }}><ExerciseKey data={NUMPAD[2][0]} unit={unit} /></div>
        <div style={{ gridColumn: '2', gridRow: '3' }}><ExerciseKey data={NUMPAD[2][1]} unit={unit} /></div>
        <div style={{ gridColumn: '3', gridRow: '3' }}><ExerciseKey data={NUMPAD[2][2]} unit={unit} /></div>
        {/* row 4 */}
        <div style={{ gridColumn: '1', gridRow: '4' }}><ExerciseKey data={NUMPAD[3][0]} unit={unit} /></div>
        <div style={{ gridColumn: '2', gridRow: '4' }}><ExerciseKey data={NUMPAD[3][1]} unit={unit} /></div>
        <div style={{ gridColumn: '3', gridRow: '4' }}><ExerciseKey data={NUMPAD[3][2]} unit={unit} /></div>
        <div style={{ gridColumn: '4', gridRow: '4 / span 2' }}>
          <div style={{ width: unit, height: rowH * 2 + gap, background: '#fff', border: `1px solid ${C.divider}`, borderRadius: 7, display: 'grid', placeItems: 'center', fontFamily: fontUI, fontWeight: 600, fontSize: 11, color: C.sub }}>Ent</div>
        </div>
        {/* row 5 */}
        <div style={{ gridColumn: '1 / span 2', gridRow: '5' }}>
          <div style={{ width: unit * 2 + gap, height: rowH, background: FP.purple, border: `1px solid rgba(0,0,0,0.06)`, borderRadius: 7, display: 'grid', placeItems: 'center', fontFamily: fontMono, fontWeight: 600, fontSize: 14, color: '#1a1a17' }}>0</div>
        </div>
        <div style={{ gridColumn: '3', gridRow: '5' }}><ExerciseKey data={NUMPAD[4][1]} unit={unit} /></div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Toolbar above keyboard

function ToolbarButton({ children, active, off }) {
  return (
    <button style={{
      width: 36, height: 36, borderRadius: 8,
      background: active ? C.ink : 'transparent',
      border: `1px solid ${C.divider}`,
      color: active ? '#fff' : C.ink,
      cursor: 'pointer',
      display: 'grid', placeItems: 'center',
      position: 'relative',
    }}>
      {children}
      {off && (
        <span style={{
          position: 'absolute', top: 5, right: 5,
          width: 6, height: 6, borderRadius: '50%', background: '#ef4444',
        }} />
      )}
    </button>
  );
}

function KeyboardToolbar() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '6px 12px',
      background: C.surface,
      border: `1px solid ${C.divider}`,
      borderRadius: 10,
      marginBottom: 14,
    }}>
      <ToolbarButton active>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="5" height="5" rx="1" fill="#74b9ff" />
          <rect x="9" y="2" width="5" height="5" rx="1" fill="#fdcb6e" />
          <rect x="2" y="9" width="5" height="5" rx="1" fill="#00b894" />
          <rect x="9" y="9" width="5" height="5" rx="1" fill="#a29bfe" />
        </svg>
      </ToolbarButton>
      <ToolbarButton><span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 13 }}>А</span></ToolbarButton>
      <ToolbarButton><span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 13, textDecoration: 'underline wavy', textUnderlineOffset: 3 }}>А</span></ToolbarButton>
      <ToolbarButton><span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 13 }}>A</span></ToolbarButton>
      <ToolbarButton><span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 13 }}>Ё</span></ToolbarButton>
      <div style={{ width: 1, height: 24, background: C.divider, margin: '0 4px' }} />
      <ToolbarButton title="Скрыть индикатор набора">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="6" width="3" height="4" rx="0.5" fill="currentColor" />
          <rect x="6.5" y="6" width="3" height="4" rx="0.5" fill="currentColor" opacity="0.4" />
          <rect x="11" y="6" width="3" height="4" rx="0.5" fill="currentColor" opacity="0.15" />
          <line x1="1" y1="14" x2="15" y2="2" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </ToolbarButton>
      <ToolbarButton off>👁</ToolbarButton>
      <ToolbarButton off>🔊</ToolbarButton>
      <ToolbarButton off>⏱</ToolbarButton>
      <ToolbarButton off>🎤</ToolbarButton>
      <ToolbarButton><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" /><path d="M2 8h12M8 2v12" stroke="currentColor" strokeWidth="1.5" /></svg></ToolbarButton>
      <div style={{ flex: 1 }} />
      <LayoutSelector />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 12px', background: '#f5f4f0', borderRadius: 8,
        fontFamily: fontMono, fontSize: 11.5, color: C.ink, fontWeight: 600,
      }}>ANSI<span style={{ opacity: 0.5 }}>▾</span></div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Finger legend

function LayoutSelector() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('standard');
  const variants = [
    { id: 'standard',   label: 'Стандартная',  sub: 'ЙЦУКЕН по умолчанию · совместима с большинством компьютеров' },
    { id: 'phonetic',   label: 'Фонетическая', sub: 'ЯВЕРТЫ · буквы по похожему звучанию (Я=Y, Б=B, ...)' },
    { id: 'typewriter', label: 'Машинопись',   sub: 'Историческая раскладка профессиональных машинисток' },
    { id: 'mac',        label: 'МАС',          sub: 'Раскладка для macOS · небольшие отличия' },
  ];
  const activeLabel = variants.find(v => v.id === active).label.toUpperCase();
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 12px', background: '#f5f4f0',
        border: `1px solid ${C.divider}`, borderRadius: 8,
        fontFamily: fontMono, fontSize: 11.5, color: C.ink, fontWeight: 700,
        cursor: 'pointer',
      }}>
        <span>⌨</span> RU [{activeLabel}]
        <span style={{ opacity: 0.5 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 30,
          background: '#fff', border: `1px solid ${C.divider}`,
          borderRadius: 12, padding: 4,
          width: 320,
          boxShadow: '0 18px 40px rgba(0,0,0,0.12)',
        }}>
          <div style={{
            padding: '10px 12px 6px',
            fontFamily: fontMono, fontSize: 10, color: C.faint, letterSpacing: '0.06em',
          }}>РАСКЛАДКА ВВОДА</div>
          {variants.map(v => (
            <button key={v.id} onClick={() => { setActive(v.id); setOpen(false); }} style={{
              width: '100%', padding: '10px 12px',
              background: active === v.id ? '#eef4ff' : 'transparent',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              textAlign: 'left', fontFamily: fontUI,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                border: `2px solid ${active === v.id ? C.accent : C.divider}`,
                display: 'grid', placeItems: 'center',
              }}>
                {active === v.id && <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent }} />}
              </span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: active === v.id ? 700 : 600, color: C.ink }}>{v.label}</div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 2, lineHeight: 1.35 }}>{v.sub}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FingerLegend() {
  const items = [
    { f: 'pink',   l: 'Мизинец' },
    { f: 'orange', l: 'Безымянный' },
    { f: 'green',  l: 'Средний' },
    { f: 'blue',   l: 'Указ. левый' },
    { f: 'indigo', l: 'Указ. правый' },
    { f: 'purple', l: 'Большой' },
  ];
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 12,
      padding: '4px 0',
    }}>
      {items.map(it => (
        <div key={it.f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            background: FP[it.f],
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }} />
          <span style={{ fontSize: 13.5, color: C.ink, fontWeight: 500 }}>{it.l}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mentor with speech bubble

function MentorBubble({ mentorId = 'maxim', tip, hint, bouncing = true }) {
  return (
    <div style={{
      position: 'absolute', top: -86, right: 24,
      display: 'flex', alignItems: 'flex-end', gap: 14, zIndex: 5,
    }}>
      <div style={{
        background: '#fef9c3',
        border: '1px solid #fde68a',
        borderRadius: 14,
        padding: '14px 18px',
        maxWidth: 520,
        position: 'relative',
        boxShadow: '0 10px 24px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 26, height: 26, borderRadius: 7,
            background: '#facc15', color: '#451a03',
            fontSize: 13, fontWeight: 800, fontFamily: fontMono,
            flexShrink: 0, marginTop: 2,
          }}>i</span>
          <div>
            <div style={{
              fontFamily: fontUI, fontSize: 11, color: '#92400e',
              fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4,
            }}>СОВЕТ НАСТАВНИКА</div>
            <div style={{
              fontFamily: fontUI, fontSize: 14, color: '#451a03',
              lineHeight: 1.45, fontWeight: 600,
            }}>{tip}</div>
            {hint && <div style={{
              fontSize: 11.5, color: '#92400e', marginTop: 6,
              fontFamily: fontUI, fontStyle: 'italic',
            }}>{hint}</div>}
          </div>
        </div>
        <div style={{
          position: 'absolute', right: -8, bottom: 18,
          width: 0, height: 0,
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderLeft: '8px solid #fef9c3',
          filter: 'drop-shadow(1px 0 0 #fde68a)',
        }} />
      </div>

      <div style={{
        width: 88, height: 88, borderRadius: '50%',
        background: '#fff',
        border: '2px solid #fde68a',
        display: 'grid', placeItems: 'center',
        boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
        animation: bouncing ? 'bobble 2.4s ease-in-out infinite' : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {window.MentorPortrait
          ? <window.MentorPortrait id={mentorId} size={80} />
          : <span style={{ fontSize: 40 }}>🤖</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Target text display

function TargetDisplay({ target, typed }) {
  const chars = target.split('');
  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${C.divider}`,
      borderRadius: 12,
      padding: '22px 26px',
      fontFamily: fontMono,
      fontSize: 28, lineHeight: 1.4,
      color: C.faint, letterSpacing: '0.08em',
      position: 'relative',
      minHeight: 80,
    }}>
      {chars.map((ch, i) => {
        const isDone = i < typed;
        const isCur = i === typed;
        return (
          <span key={i} style={{
            color: isDone ? C.ink : isCur ? C.ink : C.faint,
            background: isCur ? '#1a1a17' : 'transparent',
            padding: isCur ? '2px 4px' : 0,
            borderRadius: isCur ? 4 : 0,
            ...(isCur ? { color: '#fff' } : {}),
          }}>{ch === ' ' ? '\u00A0' : ch}</span>
        );
      })}
      <span style={{
        position: 'absolute', right: 14, top: 14,
        fontFamily: fontMono, fontSize: 11, color: C.success, fontWeight: 700,
      }}>{Math.ceil(target.length / 18)}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Speed graph (small chart)

function SpeedGraph() {
  const data = Array.from({ length: 30 }, (_, i) => Math.sin(i * 0.3) * 30 + 250 + Math.random() * 80);
  const max = 600;
  return (
    <div style={{
      height: 92,
      background: '#fff',
      border: `1px solid ${C.divider}`,
      borderRadius: 8,
      padding: '10px 14px',
      position: 'relative',
    }}>
      {/* Y axis labels */}
      <div style={{
        position: 'absolute', left: 6, top: 8, bottom: 8,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        fontFamily: fontMono, fontSize: 8.5, color: C.faint,
      }}>
        <span>600</span><span>300</span><span>100</span>
      </div>
      {/* Grid */}
      <div style={{
        marginLeft: 26, height: '100%',
        background: 'repeating-linear-gradient(0deg, transparent 0, transparent 17px, rgba(0,0,0,0.04) 17px, rgba(0,0,0,0.04) 18px)',
        position: 'relative',
      }}>
        {/* Line chart */}
        <svg width="100%" height="100%" viewBox={`0 0 ${data.length * 10} 100`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
          <polyline
            points={data.map((v, i) => `${i * 10},${100 - (v / max) * 100}`).join(' ')}
            fill="none" stroke={C.accent} strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Side stats

function SideStats({ done = false, finalGrade = 3.5, finalTime = '00:13', finalSpeed = 173, finalRhythm = 87 }) {
  return (
    <div style={{
      width: 220,
      display: 'flex', flexDirection: 'column', gap: 18,
    }}>
      {/* Rating */}
      <div style={{
        background: '#fff', border: `1px solid ${C.divider}`,
        borderRadius: 12, padding: '14px 16px',
      }}>
        <div style={{
          fontFamily: fontMono, fontSize: 10, color: C.faint,
          letterSpacing: '0.06em', marginBottom: 6,
        }}>ОЦЕНКА</div>
        <div style={{ display: 'flex', gap: 2 }}>
          {[1,2,3,4,5].map(i => {
            const filled = done && i <= Math.floor(finalGrade);
            const half = done && i === Math.ceil(finalGrade) && finalGrade % 1 >= 0.5;
            return (
              <svg key={i} width="20" height="20" viewBox="0 0 14 14" fill="none">
                <defs>
                  <linearGradient id={`star-half-${i}`} x1="0" x2="1" y1="0" y2="0">
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#e5e3da" />
                  </linearGradient>
                </defs>
                <path d="M7 1.5L8.5 5L12 5.5L9.5 8L10 11.5L7 9.8L4 11.5L4.5 8L2 5.5L5.5 5Z"
                  fill={filled ? '#f59e0b' : half ? `url(#star-half-${i})` : '#e5e3da'}
                  stroke={filled || half ? '#d97706' : '#d6d3c8'}
                  strokeWidth="0.8" strokeLinejoin="round" />
              </svg>
            );
          })}
        </div>
        <div style={{ fontSize: 10.5, color: C.faint, marginTop: 5, fontFamily: fontMono }}>
          {done ? `${finalGrade.toFixed(1)} / 5.0 · отлично` : 'Будет начислена после окончания'}
        </div>
      </div>

      {/* Time */}
      <div style={{
        background: '#fff', border: `1px solid ${C.divider}`,
        borderRadius: 12, padding: '14px 16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <div style={{ fontFamily: fontMono, fontSize: 10, color: C.faint, letterSpacing: '0.06em' }}>ВРЕМЯ</div>
          <div style={{ fontFamily: fontMono, fontWeight: 800, fontSize: 22, color: C.ink, letterSpacing: '-0.02em' }}>{done ? finalTime : '00:14'}</div>
        </div>
        <div style={{ fontSize: 10.5, color: C.faint, fontFamily: fontMono }}>
          лучшее: <span style={{ color: C.faint }}>—:—</span>
        </div>
      </div>

      {/* Speed */}
      <div style={{
        background: '#fff', border: `1px solid ${C.divider}`,
        borderRadius: 12, padding: '14px 16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <div style={{ fontFamily: fontMono, fontSize: 10, color: C.faint, letterSpacing: '0.06em' }}>СКОРОСТЬ</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontFamily: fontMono, fontWeight: 800, fontSize: 22, color: done ? C.success : C.accent, letterSpacing: '-0.02em' }}>{done ? finalSpeed : 0}</span>
            <span style={{ fontFamily: fontMono, fontSize: 10.5, color: C.faint }}>зн/мин</span>
          </div>
        </div>
        <div style={{ fontSize: 10.5, color: C.faint, fontFamily: fontMono }}>
          максимум: <span style={{ color: C.faint }}>{done ? '—' : '—'}</span>
        </div>
      </div>

      {/* Ритмичность — shown on completion */}
      {done && (
        <div style={{
          background: '#fff', border: `1px solid ${C.divider}`,
          borderRadius: 12, padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <div style={{ fontFamily: fontMono, fontSize: 10, color: C.faint, letterSpacing: '0.06em' }}>РИТМИЧНОСТЬ</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: fontMono, fontWeight: 800, fontSize: 22, color: C.ink, letterSpacing: '-0.02em' }}>{finalRhythm}</span>
              <span style={{ fontFamily: fontMono, fontSize: 10.5, color: C.faint }}>%</span>
            </div>
          </div>
          <div style={{ fontSize: 10.5, color: C.faint, fontFamily: fontMono, display: 'flex', gap: 8 }}>
            <span>мин: 75%</span><span>·</span><span>макс: 91%</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Success screen — shown after task is completed

function SuccessScreen() {
  return (
    <div style={{
      width: '100%', minHeight: '100%',
      background: 'rgba(26,26,23,0.65)',
      fontFamily: fontUI,
      padding: '100px 32px 40px',
      position: 'relative',
    }}>
      <style>{`
        @keyframes bobble {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-6px) rotate(2deg); }
        }
        @keyframes celebrate {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div style={{
        maxWidth: 1100, margin: '0 auto',
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
        padding: '40px 36px 40px',
        position: 'relative',
      }}>
        {/* Mentor bubble + portrait — same pattern */}
        <MentorBubble
          mentorId="maxim"
          tip="Отлично — ритмичность 87%, это уверенно. Главное теперь — закрепить движение, не сбавляй темп."
          hint="Совет: на следующей попытке попробуй чуть ускориться. Если точность упадёт ниже 90% — вернись к этой."
        />

        {/* Close */}
        <button style={{
          position: 'absolute', top: 16, right: 16,
          width: 36, height: 36, borderRadius: '50%',
          background: '#fff', border: `1px solid ${C.divider}`,
          fontSize: 16, color: C.ink, cursor: 'pointer',
        }}>✕</button>

        <div style={{
          display: 'grid', gridTemplateColumns: '240px 1fr 240px',
          gap: 28, alignItems: 'center', marginTop: 14, minHeight: 380,
        }}>
          {/* Left: Big mentor visual */}
          <div style={{
            display: 'grid', placeItems: 'center',
            position: 'relative',
            animation: 'celebrate .55s cubic-bezier(.22,.61,.36,1) both',
          }}>
            <div style={{
              width: 220, height: 220, borderRadius: '50%',
              background: 'radial-gradient(circle, #dbeafe 0%, transparent 70%)',
              position: 'absolute',
            }} />
            {/* Confetti dots */}
            {[
              { x: 10, y: 30, c: FP.pink },
              { x: 30, y: 60, c: FP.orange },
              { x: 200, y: 40, c: FP.green },
              { x: 180, y: 130, c: FP.blue },
              { x: 30, y: 180, c: FP.purple },
              { x: 195, y: 200, c: FP.indigo },
              { x: 90, y: 12, c: FP.orange },
              { x: 130, y: 12, c: FP.pink },
            ].map((d, i) => (
              <div key={i} style={{
                position: 'absolute', left: d.x, top: d.y,
                width: 10, height: 10, borderRadius: 3,
                background: d.c,
                transform: `rotate(${i * 30}deg)`,
                opacity: 0.85,
              }} />
            ))}
            <div style={{
              width: 180, height: 180, borderRadius: '50%',
              background: '#dbeafe', border: '3px solid #93c5fd',
              display: 'grid', placeItems: 'center',
              boxShadow: '0 24px 48px rgba(30,64,175,0.25)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {window.MentorPortrait
                ? <window.MentorPortrait id="maxim" size={170} />
                : <span style={{ fontSize: 100 }}>🎉</span>}
            </div>
          </div>

          {/* Center: Success message + buttons */}
          <div>
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6,
            }}>
              <span style={{
                fontFamily: fontMono, fontSize: 36, fontWeight: 800, color: C.ink,
                letterSpacing: '-0.03em',
              }}>1.1</span>
              <span style={{ fontFamily: fontMono, fontSize: 12, color: C.faint }}>
                ( попытка: 1 )
              </span>
              <div style={{
                marginLeft: 'auto',
                padding: '4px 12px',
                background: C.success, color: '#fff',
                borderRadius: 999,
                fontFamily: fontMono, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 7.5L6 10L11 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ВЫПОЛНЕНО
              </div>
            </div>

            <h1 style={{
              margin: '14px 0 16px',
              fontFamily: fontSerif, fontSize: 54, fontWeight: 700,
              letterSpacing: '-0.02em', lineHeight: 1.05, color: C.ink,
            }}>Всё верно.</h1>

            <p style={{
              margin: '0 0 26px', fontFamily: fontSerif,
              fontSize: 17, color: C.sub, lineHeight: 1.55, maxWidth: 460,
            }}>
              Разминку прошла без ошибок. Указательный левой работает чётко, ритм ровный. Идём дальше — следующее упражнение немного длиннее.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{
                padding: '13px 22px',
                background: 'transparent', border: `1.5px solid ${C.divider}`,
                borderRadius: 11, color: C.ink,
                fontSize: 13.5, fontWeight: 700, fontFamily: fontUI,
                cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>↻ Повторить</button>
              <button style={{
                padding: '13px 26px',
                background: C.accent, color: '#fff',
                border: 'none', borderRadius: 11,
                fontSize: 13.5, fontWeight: 700, fontFamily: fontUI,
                cursor: 'pointer',
                boxShadow: '0 8px 18px rgba(59,130,246,0.35)',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>Продолжить · 1.2 →</button>
            </div>
          </div>

          {/* Right: Stats */}
          <SideStats done finalGrade={3.5} finalTime="00:13" finalSpeed={173} finalRhythm={87} />
        </div>
      </div>
    </div>
  );
}

function TaskScreen() {
  const target = 'аааааааааааааааааа';
  const typed = 1;

  return (
    <div style={{
      width: '100%', minHeight: '100%',
      background: 'rgba(26,26,23,0.65)',
      fontFamily: fontUI,
      padding: '100px 32px 40px',
      position: 'relative',
    }}>
      {/* Bobble animation */}
      <style>{`
        @keyframes bobble {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-6px) rotate(2deg); }
        }
      `}</style>

      {/* Modal card */}
      <div style={{
        maxWidth: 1320, margin: '0 auto',
        background: C.bg,
        borderRadius: 20,
        boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
        padding: '40px 36px 28px',
        position: 'relative',
      }}>
        {/* Mentor with speech bubble — overflows top */}
        <MentorBubble
          mentorId="maxim"
          tip="Не торопись — печатай ровно. Скорость придёт сама после 20-го урока."
          hint="Указательные пальцы держи на «а» и «о» — это твои якоря."
        />

        {/* Close button */}
        <button style={{
          position: 'absolute', top: 16, right: 16,
          width: 36, height: 36, borderRadius: '50%',
          background: '#fff', border: `1px solid ${C.divider}`,
          fontSize: 16, color: C.ink, cursor: 'pointer',
        }}>✕</button>

        {/* Body grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '180px 1fr 240px',
          gap: 24, alignItems: 'flex-start',
          marginTop: 14,
        }}>
          {/* Left: Exercise label + legend */}
          <div>
            <div style={{ marginBottom: 22 }}>
              <div style={{
                fontFamily: fontMono, fontWeight: 800, fontSize: 56, color: C.ink,
                letterSpacing: '-0.04em', lineHeight: 1,
              }}>1.1</div>
              <div style={{
                fontFamily: fontMono, fontSize: 11, color: C.faint, marginTop: 4,
              }}>( попытка: 1 )</div>
            </div>
            <FingerLegend />
          </div>

          {/* Center: Target + progress + chart */}
          <div>
            {/* Progress */}
            <div style={{ marginBottom: 14 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 12, color: C.sub, fontFamily: fontMono, marginBottom: 6,
              }}>
                <span style={{ fontWeight: 600 }}>Прогресс</span>
                <span>{typed}/{target.length}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  flex: 1, height: 6, background: C.divider, borderRadius: 999, overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${(typed / target.length) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #74b9ff 0%, #a29bfe 100%)',
                    borderRadius: 999,
                  }} />
                </div>
                <button style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: '#fff', border: `1px solid ${C.divider}`,
                  fontSize: 14, cursor: 'pointer', color: C.sub,
                }}>↻</button>
              </div>
            </div>

            {/* Target text */}
            <TargetDisplay target={target} typed={typed} />

            {/* Speed chart */}
            <div style={{ marginTop: 18 }}>
              <SpeedGraph />
            </div>
          </div>

          {/* Right: Stats */}
          <SideStats />
        </div>

        {/* Keyboard toolbar */}
        <div style={{ marginTop: 22 }}>
          <KeyboardToolbar />
        </div>

        {/* Keyboard */}
        <div style={{ marginTop: 4 }}>
          <ClassicKeyboard unit={42} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function App() {
  return (
    <DesignCanvas defaultZoom={0.5}>
      <DCSection id="task" title="Экран выполнения · в процессе" subtitle="Виртуальный наставник с реальным советом (не цитата автора). Тулбар включает кнопку «скрыть индикатор набора» — для тренировки вслепую без подсказок. Раскладка ввода переключается дропдауном: Стандартная / Фонетическая / Машинопись / МАС. Карточка «Повторить» удалена из правой колонки — она дублировала функционал.">
        <DCArtboard id="task-screen" label="Упражнение 1.1 · в процессе · текущая клавиша А" width={1440} height={1000}>
          <TaskScreen />
        </DCArtboard>
      </DCSection>

      <DCSection id="success" title="Экран завершения · «Всё верно»" subtitle="После выполнения задания — модал с заголовком в Serif, оценкой 3.5 звёзд, метриками (время / скорость / ритмичность 87%), персональным комментарием наставника. Слева — анимированный большой портрет наставника с пастельным фоном и конфетти-точками в цветах пальцев. Кнопки: Повторить (попробовать выше оценку) / Продолжить к 1.2.">
        <DCArtboard id="task-success" label="Завершено · 173 зн/мин · ★★★½" width={1200} height={700}>
          <SuccessScreen />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
