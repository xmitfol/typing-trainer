// app.jsx — Ergonomic split keyboard prototype: practice area + legend + tweaks

const { useState, useEffect, useRef, useMemo, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "layout": "ergonomic",
  "angle": 14,
  "gap": 96,
  "intensity": "full",
  "geometry": "staggered",
  "thumbCluster": "minimal",
  "viewport": "desktop",
  "showWristRest": true,
  "showFingerHint": true,
  "demoState": "live",
  "modifierStyle": "hatched"
}/*EDITMODE-END*/;

// ─────────────────────────────────────────────────────────────────────────────
// Practice text

const PRACTICE_TEXT = "Съешь же ещё этих мягких французских булок, да выпей чаю.";

// Map our finger codes to readable name
const FINGER_NAMES = {
  pink: 'Мизинец',
  orange: 'Безымянный',
  green: 'Средний',
  blue: 'Указательный',
  indigo: 'Указательный',
  purple: 'Большой',
};
const HAND_FROM_FINGER = (f, ch) => {
  // Determine left/right based on character — pinky/orange/green/blue is left, indigo is right.
  // For pink we use the actual key location: digits 7-= and ЗХЪ are right.
  if (f === 'indigo') return 'right';
  if (f === 'blue') return 'left';
  if (f === 'green' || f === 'orange') {
    const c = (ch || '').toLowerCase();
    // right side mid/ring: Ш Л Б (mid r); Щ Д Ю (ring r); also digits 8,9
    const rightMid = ['ш','л','б','8'];
    const rightRing = ['щ','д','ю','9'];
    if (rightMid.includes(c) || rightRing.includes(c)) return 'right';
    return 'left';
  }
  if (f === 'pink') {
    const c = (ch || '').toLowerCase();
    const leftPinky = ['ё','1','й','ф','я'];
    if (leftPinky.includes(c)) return 'left';
    return 'right';
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Practice area

function PracticeArea({ dark, onActiveKey, onErrorKey, onHandActive, currentChar, setCurrentChar }) {
  const [pos, setPos] = useState(0);
  const [errors, setErrors] = useState(0);
  const [typed, setTyped] = useState(''); // ✓ or x per char
  const text = PRACTICE_TEXT;
  const inputRef = useRef(null);

  useEffect(() => {
    setCurrentChar(text[pos] || '');
  }, [pos]);

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (pos > 0) {
        setPos(p => p - 1);
        setTyped(t => t.slice(0, -1));
      }
      return;
    }
    if (e.key.length !== 1) return;
    e.preventDefault();
    const expected = text[pos];
    if (!expected) return;
    const ok = e.key.toLowerCase() === expected.toLowerCase();
    if (ok) {
      onActiveKey(e.code);
      setTyped(t => t + '✓');
      setPos(p => p + 1);
    } else {
      onErrorKey(e.code);
      setErrors(n => n + 1);
      setTyped(t => t + 'x');
    }
  };

  const reset = () => {
    setPos(0);
    setErrors(0);
    setTyped('');
  };

  // Track hand active animation
  useEffect(() => {
    const ch = text[pos];
    if (!ch) return onHandActive(null);
    const f = window.CHAR_TO_FINGER[ch.toLowerCase()];
    onHandActive(HAND_FROM_FINGER(f, ch));
  }, [pos]);

  const accuracy = pos > 0 ? Math.round(((pos - errors) / pos) * 100) : 100;

  return (
    <div
      tabIndex={0}
      ref={inputRef}
      onKeyDown={handleKeyDown}
      onClick={() => inputRef.current?.focus()}
      style={{
        background: dark ? '#1d1d1b' : '#fbfaf6',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        borderRadius: 16,
        padding: '22px 26px',
        outline: 'none',
        cursor: 'text',
        position: 'relative',
        boxShadow: dark ? '0 1px 0 rgba(255,255,255,0.03) inset' : '0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(0,0,0,0.03)',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
      }}>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: dark ? 'rgba(243,241,234,0.45)' : 'rgba(26,26,23,0.45)',
        }}>Практика — кликни и печатай</div>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: dark ? 'rgba(243,241,234,0.55)' : 'rgba(26,26,23,0.55)' }}>
          <span>{pos}/{text.length}</span>
          <span>точность {accuracy}%</span>
          <button onClick={(e) => { e.stopPropagation(); reset(); inputRef.current?.focus(); }}
            style={{
              background: 'transparent',
              border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
              color: 'inherit',
              padding: '4px 10px',
              borderRadius: 6,
              fontFamily: 'inherit',
              fontSize: 11,
              cursor: 'pointer',
            }}>сброс</button>
        </div>
      </div>

      <div style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 22,
        lineHeight: 1.55,
        letterSpacing: '0.02em',
        color: dark ? 'rgba(243,241,234,0.35)' : 'rgba(26,26,23,0.35)',
        wordBreak: 'normal',
        overflowWrap: 'break-word',
      }}>
        {text.split('').map((ch, i) => {
          const isCur = i === pos;
          const isDone = i < pos;
          const ok = isDone && typed[i] === '✓';
          const bad = isDone && typed[i] === 'x';
          const finger = window.CHAR_TO_FINGER[ch.toLowerCase()];
          const fingerColor = finger ? window.FINGER[finger].solid : null;
          let color = 'inherit';
          let bg = 'transparent';
          let textShadow = 'none';
          if (isCur) {
            color = dark ? '#fff' : '#1a1a17';
            bg = fingerColor ? `${fingerColor}33` : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)');
          } else if (ok) {
            color = dark ? 'rgba(243,241,234,0.95)' : '#1a1a17';
          } else if (bad) {
            color = '#ff4757';
          }
          return (
            <span key={i} style={{
              color,
              background: bg,
              borderBottom: isCur ? `2px solid ${fingerColor || '#1a1a17'}` : '2px solid transparent',
              padding: '1px 1px',
              transition: 'all .12s ease',
              whiteSpace: 'pre-wrap',
            }}>{ch}</span>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Finger legend

function FingerLegend({ dark, intensity }) {
  const items = [
    { f: 'pink', label: 'Мизинец' },
    { f: 'orange', label: 'Безымянный' },
    { f: 'green', label: 'Средний' },
    { f: 'blue', label: 'Указательный лев.' },
    { f: 'indigo', label: 'Указательный прав.' },
    { f: 'purple', label: 'Большой (Space)' },
  ];
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 18,
      padding: '14px 20px',
      background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
      borderRadius: 12,
      fontFamily: '"Manrope", sans-serif',
      fontSize: 12.5,
      color: dark ? 'rgba(243,241,234,0.7)' : 'rgba(26,26,23,0.7)',
    }}>
      {items.map(it => (
        <div key={it.f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-block',
            width: 18,
            height: 12,
            borderRadius: 3,
            background: window.FINGER[it.f].fill,
            boxShadow: `0 0 0 1px ${dark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)'}`,
          }} />
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// App shell

const VIEWPORTS = {
  desktop: { w: 1400, label: 'Desktop · 1400', unit: 60, mobile: false },
  laptop:  { w: 1180, label: 'Laptop · 1180', unit: 48, mobile: false },
  tablet:  { w: 820,  label: 'Tablet · 820', unit: 38, mobile: false },
  mobile:  { w: 420,  label: 'Mobile · 420', unit: 22, mobile: true },
};

const LAYOUTS = {
  classic:   { label: 'Classic',    sub: 'full-size · numpad',  icon: '⌨' },
  laptop:    { label: 'Laptop',     sub: 'без numpad',           icon: '💻' },
  ergonomic: { label: 'Ergonomic',  sub: 'split · split-Space',  icon: '⎈' },
};

// Top-toolbar feature buttons (mock / non-functional — design surface only)
const TOOLBAR_FEATURES = [
  { id: 'colors',     label: 'Палитра',    glyph: 'rect', tone: 'palette' },
  { id: 'symbols',    label: 'Символы',    glyph: 'A',  state: 'on' },
  { id: 'errors',     label: 'Ошибки',     glyph: 'A',  state: 'wave' },
  { id: 'case',       label: 'Регистр',    glyph: 'A',  state: 'plain' },
  { id: 'yo',         label: 'Ё в тексте', glyph: 'Ё' },
  { id: 'hands',      label: 'Не подсматривай', glyph: 'hand', state: 'off' },
  { id: 'sound',      label: 'Звук',       glyph: 'eye', state: 'off' },
  { id: 'mute',       label: 'Метроном',   glyph: 'metro', state: 'off' },
  { id: 'voice',      label: 'Озвучка',    glyph: 'voice', state: 'off' },
  { id: 'lang',       label: 'Язык',       glyph: 'globe' },
];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [activeCode, setActiveCode] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [currentChar, setCurrentChar] = useState('');
  const [activeHand, setActiveHand] = useState(null);

  // Frame scale-to-fit
  const frameOuterRef = useRef(null);
  const [frameScale, setFrameScale] = useState(1);
  const vp = VIEWPORTS[t.viewport];

  useEffect(() => {
    if (!frameOuterRef.current) return;
    const recalc = () => {
      const aw = frameOuterRef.current.clientWidth - 8;
      setFrameScale(Math.min(1, aw / vp.w));
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(frameOuterRef.current);
    return () => ro.disconnect();
  }, [vp.w]);

  const onActiveKey = (code) => {
    setActiveCode(code);
    setErrorCode(null);
    clearTimeout(window.__activeT);
    window.__activeT = setTimeout(() => setActiveCode(null), 160);
  };
  const onErrorKey = (code) => {
    setErrorCode(code);
    clearTimeout(window.__errorT);
    window.__errorT = setTimeout(() => setErrorCode(null), 280);
  };

  // Demo state override: when not 'live', force a fixed state for the screenshot use case
  const demoOverrides = useMemo(() => {
    if (t.demoState === 'hover')     return { hoverCode: 'KeyF' };
    if (t.demoState === 'active')    return { activeCode: 'KeyF' };
    if (t.demoState === 'highlight') return { highlightChar: currentChar || 'с' };
    if (t.demoState === 'error')     return { errorCode: 'KeyF' };
    return null;
  }, [t.demoState, currentChar]);

  const bgColor = t.dark ? '#161614' : '#f5f4f0';
  const fgColor = t.dark ? '#f3f1ea' : '#1a1a17';
  const subtle = t.dark ? 'rgba(243,241,234,0.55)' : 'rgba(26,26,23,0.55)';

  return (
    <div style={{
      minHeight: '100vh',
      background: bgColor,
      color: fgColor,
      fontFamily: '"Manrope", sans-serif',
      padding: '28px 28px 80px',
      transition: 'background .25s ease, color .25s ease',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        maxWidth: 1480,
        margin: '0 auto 20px',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)',
            display: 'grid', placeItems: 'center',
            color: '#fff', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace',
            fontSize: 13, letterSpacing: '-0.04em',
            boxShadow: '0 4px 12px rgba(116,185,255,0.3)',
          }}>Ё</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>Тренажёр слепой печати</div>
            <div style={{ fontSize: 12, color: subtle, fontFamily: '"JetBrains Mono", monospace' }}>spec 009 · 3 раскладки · ЙЦУКЕН</div>
          </div>
        </div>

        {/* Layout switcher — Classic / Laptop / Ergonomic */}
        <div style={{
          display: 'flex',
          gap: 6,
          padding: 5,
          background: t.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          borderRadius: 12,
        }}>
          {Object.entries(LAYOUTS).map(([k, v]) => (
            <button key={k} onClick={() => setTweak('layout', k)} style={{
              background: t.layout === k ? (t.dark ? '#2a2a27' : '#fff') : 'transparent',
              color: 'inherit',
              border: 'none',
              padding: '8px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: '"Manrope", sans-serif',
              fontSize: 13,
              fontWeight: t.layout === k ? 700 : 500,
              boxShadow: t.layout === k ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textAlign: 'left',
              transition: 'all .15s ease',
            }}>
              <span style={{ fontSize: 14 }}>{v.icon}</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                <span>{v.label}</span>
                <span style={{
                  fontSize: 10,
                  fontFamily: '"JetBrains Mono", monospace',
                  opacity: 0.55,
                  fontWeight: 500,
                }}>{v.sub}</span>
              </div>
            </button>
          ))}
        </div>

        <div style={{
          display: 'flex',
          gap: 6,
          padding: 4,
          background: t.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          borderRadius: 10,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
        }}>
          {Object.entries(VIEWPORTS).map(([k, v]) => (
            <button key={k} onClick={() => setTweak('viewport', k)} style={{
              background: t.viewport === k ? (t.dark ? '#2a2a27' : '#fff') : 'transparent',
              color: 'inherit',
              border: 'none',
              padding: '6px 10px',
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 11,
              fontWeight: t.viewport === k ? 600 : 500,
              boxShadow: t.viewport === k ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>{v.label}</button>
          ))}
        </div>
      </div>

      {/* Viewport canvas */}
      <div style={{
        margin: '0 auto',
        maxWidth: 1480,
      }}>
        <div ref={frameOuterRef} style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <div style={{
            transform: `scale(${frameScale})`,
            transformOrigin: 'top center',
            width: vp.w,
            marginBottom: frameScale < 1 ? `-${(1 - frameScale) * 800}px` : 0,
          }}>
          <div style={{
          maxWidth: 'unset',
          margin: '0 auto',
          width: vp.w,
          background: t.dark ? '#1d1d1b' : '#ffffff',
          border: `1px solid ${t.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          borderRadius: 20,
          padding: vp.mobile ? '18px' : '32px',
          boxShadow: t.dark
            ? '0 30px 80px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset'
            : '0 30px 80px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,1) inset',
          position: 'relative',
          transition: 'width .35s cubic-bezier(.4,0,.2,1), background .25s ease',
        }}>
          {/* Viewport chrome label */}
          <div style={{
            position: 'absolute',
            top: -10,
            left: 24,
            background: t.dark ? '#1d1d1b' : '#ffffff',
            padding: '2px 10px',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            color: subtle,
            border: `1px solid ${t.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            borderRadius: 999,
            letterSpacing: '0.04em',
          }}>{vp.label}</div>

          {/* Top function toolbar (mock — non-functional, design surface for the trainer chrome) */}
          {!vp.mobile && (
            <FeatureToolbar dark={t.dark} layout={t.layout} setLayout={(v) => setTweak('layout', v)} />
          )}

          <div style={{ marginBottom: vp.mobile ? 14 : 22 }}>
            <PracticeArea
              dark={t.dark}
              onActiveKey={onActiveKey}
              onErrorKey={onErrorKey}
              onHandActive={setActiveHand}
              currentChar={currentChar}
              setCurrentChar={setCurrentChar}
            />
          </div>

          {/* Keyboard — choose by layout */}
          <div style={{ display: 'flex', justifyContent: 'center', overflow: 'visible' }}>
            {t.layout === 'ergonomic' ? (
              vp.mobile ? (
                <MobileErgoKeyboard
                  unit={vp.unit}
                  intensity={t.intensity}
                  dark={t.dark}
                  activeCode={demoOverrides?.activeCode ?? activeCode}
                  highlightChar={demoOverrides?.highlightChar ?? (t.showFingerHint ? currentChar : null)}
                  activeHand={activeHand}
                />
              ) : (
                <ErgoKeyboard
                  unit={vp.unit}
                  angle={t.angle}
                  gap={t.gap * (vp.unit / 60)}
                  intensity={t.intensity}
                  dark={t.dark}
                  geometry={t.geometry}
                  thumbCluster={t.thumbCluster}
                  modifierStyle={t.modifierStyle}
                  activeCode={demoOverrides?.activeCode ?? activeCode}
                  errorCode={demoOverrides?.errorCode ?? errorCode}
                  hoverCode={demoOverrides?.hoverCode}
                  highlightChar={demoOverrides?.highlightChar ?? (t.showFingerHint ? currentChar : null)}
                />
              )
            ) : (
              <ClassicKeyboard
                unit={vp.unit * (t.layout === 'laptop' ? 0.95 : 0.88)}
                intensity={t.intensity}
                dark={t.dark}
                variant={t.layout}
                modifierStyle={t.modifierStyle}
                activeCode={demoOverrides?.activeCode ?? activeCode}
                errorCode={demoOverrides?.errorCode ?? errorCode}
                hoverCode={demoOverrides?.hoverCode}
                highlightChar={demoOverrides?.highlightChar ?? (t.showFingerHint ? currentChar : null)}
              />
            )}
          </div>

          {/* Finger hint below keyboard */}
          {t.showFingerHint && currentChar && (
            <div style={{
              marginTop: vp.mobile ? 12 : 22,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 12,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 12,
              color: subtle,
            }}>
              <span>след. символ →</span>
              <span style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 18,
                fontWeight: 700,
                padding: '4px 10px',
                background: window.CHAR_TO_FINGER[currentChar.toLowerCase()]
                  ? `${window.FINGER[window.CHAR_TO_FINGER[currentChar.toLowerCase()]].solid}22`
                  : 'transparent',
                borderRadius: 6,
                color: t.dark ? '#fff' : '#1a1a17',
              }}>{currentChar === ' ' ? '␣' : currentChar.toUpperCase()}</span>
              {window.CHAR_TO_FINGER[currentChar.toLowerCase()] && (
                <>
                  <span style={{
                    display: 'inline-block', width: 10, height: 10, borderRadius: 2,
                    background: window.FINGER[window.CHAR_TO_FINGER[currentChar.toLowerCase()]].fill,
                  }} />
                  <span>{FINGER_NAMES[window.CHAR_TO_FINGER[currentChar.toLowerCase()]]} {activeHand === 'left' ? '(левая)' : activeHand === 'right' ? '(правая)' : ''}</span>
                </>
              )}
            </div>
          )}

          {!vp.mobile && (
            <div style={{ marginTop: 22 }}>
              <FingerLegend dark={t.dark} intensity={t.intensity} />
            </div>
          )}
          </div> {/* end inner canvas card */}
          </div> {/* end scaled wrapper */}
        </div> {/* end frameOuterRef */}

        {/* Notes panel — adapts to layout */}
        <div style={{
          maxWidth: vp.w,
          margin: '24px auto 0',
          display: 'grid',
          gridTemplateColumns: vp.mobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 16,
          fontFamily: '"Manrope", sans-serif',
          fontSize: 13,
          lineHeight: 1.5,
          color: subtle,
        }}>
          {t.layout === 'ergonomic' ? (
            <>
              <NoteCard dark={t.dark} title="Угол развёртки" body={`${t.angle}° на половину · симметрично. Стандарт MS Sculpt — 12-15°.`} />
              <NoteCard dark={t.dark} title="Разрыв (gap)" body={`${t.gap}px · место под подставку или thumb cluster.`} />
              <NoteCard dark={t.dark} title="Палитра пальцев" body="6 цветов из APP_CONFIG.keyboard.fingerColors — неизменяема." />
            </>
          ) : t.layout === 'laptop' ? (
            <>
              <NoteCard dark={t.dark} title="Без numpad" body="Урезанная nav-секция: только стрелки в нижне-правом углу." />
              <NoteCard dark={t.dark} title="Размер клавиш" body={`~${Math.round(vp.unit * 0.95)}px · компактная плотность.`} />
              <NoteCard dark={t.dark} title="Палитра пальцев" body="Идентична classic — переучиваться не нужно." />
            </>
          ) : (
            <>
              <NoteCard dark={t.dark} title="Numpad" body="Правый блок с раскраской пальцев: 5 — home (средний), 1/4/7 — указат., 0 — большой." />
              <NoteCard dark={t.dark} title="Модификаторы" body={t.modifierStyle === 'hatched' ? "Штриховка — Shift/Caps/Tab/Enter не входят в учебную методику." : "Однотонные · нейтральные."} />
              <NoteCard dark={t.dark} title="Палитра пальцев" body="6 цветов из APP_CONFIG.keyboard.fingerColors — неизменяема." />
            </>
          )}
        </div>
      </div>

      {/* Tweaks panel */}
      <TweaksPanel>
        <TweakSection label="Тема" />
        <TweakToggle label="Тёмная тема" value={t.dark} onChange={v => setTweak('dark', v)} />

        <TweakSection label="Геометрия" />
        <TweakRadio label="Сетка клавиш" value={t.geometry}
          options={['staggered', 'ortho']}
          onChange={v => setTweak('geometry', v)} />
        <TweakSlider label="Угол разворота" value={t.angle} min={0} max={25} step={1} unit="°"
          onChange={v => setTweak('angle', v)} />
        <TweakSlider label="Зазор между половин" value={t.gap} min={40} max={180} step={4} unit="px"
          onChange={v => setTweak('gap', v)} />
        <TweakRadio label="Thumb cluster" value={t.thumbCluster}
          options={['minimal', 'full']}
          onChange={v => setTweak('thumbCluster', v)} />

        <TweakSection label="Цвет и состояния" />
        <TweakSelect label="Интенсивность цвета" value={t.intensity}
          options={[
            { value: 'full', label: 'Полная заливка' },
            { value: 'strip', label: 'Полоска-акцент' },
            { value: 'highlight', label: 'Только подсказка' },
          ]}
          onChange={v => setTweak('intensity', v)} />
        <TweakRadio label="Модификаторы" value={t.modifierStyle}
          options={['solid', 'hatched']}
          onChange={v => setTweak('modifierStyle', v)} />
        <TweakSelect label="Демо-состояние" value={t.demoState}
          options={[
            { value: 'live', label: 'Живой режим' },
            { value: 'hover', label: 'Hover (на А)' },
            { value: 'active', label: 'Active (на А)' },
            { value: 'highlight', label: 'Highlight (подсказка)' },
            { value: 'error', label: 'Error (на А)' },
          ]}
          onChange={v => setTweak('demoState', v)} />
        <TweakToggle label="Подсказка пальца" value={t.showFingerHint} onChange={v => setTweak('showFingerHint', v)} />

        <TweakSection label="Viewport" />
        <TweakSelect label="Размер" value={t.viewport}
          options={Object.entries(VIEWPORTS).map(([k, v]) => ({ value: k, label: v.label }))}
          onChange={v => setTweak('viewport', v)} />
      </TweaksPanel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Top feature toolbar (mock, design surface only — non-functional)

function FeatureToolbar({ dark }) {
  const features = [
    { id: 'palette',   svg: <PaletteGlyph /> },
    { id: 'caps',      svg: <SymGlyph kind="A-on" /> },
    { id: 'wave',      svg: <SymGlyph kind="A-wave" /> },
    { id: 'plain',     svg: <SymGlyph kind="A-plain" /> },
    { id: 'yo',        svg: <SymGlyph kind="yo" /> },
    { id: 'hand',      svg: <BlockGlyph kind="hand" /> },
    { id: 'sound',     svg: <BlockGlyph kind="eye" /> },
    { id: 'metronome', svg: <BlockGlyph kind="metronome" /> },
    { id: 'voice',     svg: <BlockGlyph kind="voice" /> },
    { id: 'lang',      svg: <BlockGlyph kind="lang" /> },
  ];
  const bg = dark ? '#1d1d1b' : '#fbfaf6';
  const border = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const sub = dark ? 'rgba(243,241,234,0.55)' : 'rgba(26,26,23,0.55)';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 12,
      padding: '8px 12px',
      marginBottom: 18,
    }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {features.map((f, i) => (
          <button key={f.id} style={{
            width: 34, height: 34,
            display: 'grid', placeItems: 'center',
            background: 'transparent',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
            borderRadius: 8,
            color: dark ? '#d6d3c8' : '#3a3a35',
            cursor: 'pointer',
            transition: 'background .15s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >{f.svg}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: sub }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <KeyboardIconSmall dark={dark} /> RU [ЙЦУКЕН]
        </span>
        <span>ANSI</span>
      </div>
    </div>
  );
}

function PaletteGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18">
      <rect x="2"  y="2" width="7" height="7" rx="1.5" fill="#74b9ff" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" fill="#fdcb6e" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" fill="#00b894" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" fill="#a29bfe" />
    </svg>
  );
}
function SymGlyph({ kind }) {
  if (kind === 'yo') {
    return <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: 14, lineHeight: 1 }}>Ё</span>;
  }
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4">
      {kind === 'A-on' && <rect x="2" y="2" width="16" height="16" rx="3" strokeDasharray="2 2" />}
      {kind === 'A-wave' && <path d="M2 16 Q5 12 8 16 T14 16 T20 16" />}
      <text x="10" y="14.5" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor" stroke="none" fontFamily="JetBrains Mono">A</text>
    </svg>
  );
}
function BlockGlyph({ kind }) {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4">
      {kind === 'hand' && <path d="M6 4 v8 M9 3 v9 M12 4 v8 M5 10 q-1 4 3 6 h6 q3 0 3-3 v-3" />}
      {kind === 'eye'  && <><circle cx="10" cy="10" r="6" /><circle cx="10" cy="10" r="2" fill="currentColor" /></>}
      {kind === 'metronome' && <><path d="M6 17 L8 4 h4 l2 13 z" /><line x1="8" y1="11" x2="13" y2="6" /></>}
      {kind === 'voice' && <><rect x="8" y="3" width="4" height="9" rx="2" /><path d="M5 11 q0 4 5 4 t5 -4 M10 15 v3" /></>}
      {kind === 'lang' && <><circle cx="10" cy="10" r="7" /><path d="M3 10 h14 M10 3 q-4 7 0 14 M10 3 q4 7 0 14" /></>}
      {/* Red x-strike for off-state suggestion (subtle) */}
      {(kind === 'hand' || kind === 'eye' || kind === 'metronome' || kind === 'voice') && (
        <line x1="14" y1="6" x2="18" y2="2" stroke="#ff7675" strokeWidth="1.6" />
      )}
    </svg>
  );
}
function KeyboardIconSmall({ dark }) {
  return (
    <svg viewBox="0 0 20 14" width="20" height="14" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.7">
      <rect x="1" y="2" width="18" height="10" rx="1.5" />
      <line x1="4" y1="6" x2="16" y2="6" />
      <line x1="5" y1="9" x2="15" y2="9" />
    </svg>
  );
}

function NoteCard({ dark, title, body }) {
  return (
    <div style={{
      background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
      border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
      borderRadius: 10,
      padding: '14px 16px',
    }}>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        opacity: 0.6,
        marginBottom: 6,
      }}>{title}</div>
      <div>{body}</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
