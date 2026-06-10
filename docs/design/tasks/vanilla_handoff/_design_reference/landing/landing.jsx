// landing.jsx — Landing page for typing-trainer
// Two states demonstrated:
//   – Anonymous: top-right has "Войти" and "Начать обучение"
//   – Authorized: top-right shows user profile dropdown
// Hero showcases our visual USP: split keyboard with finger colors.

const { useState } = React;

const L = {
  bg: '#f5f4f0',
  bgAlt: '#ecebe5',
  surface: '#ffffff',
  ink: '#1a1a17',
  sub: 'rgba(26,26,23,0.6)',
  faint: 'rgba(26,26,23,0.4)',
  divider: 'rgba(0,0,0,0.08)',
  accent: '#3b82f6',
  green: '#10b981',
  pink: '#ec4899',
};

const fontUI = '"Manrope", ui-sans-serif, system-ui, sans-serif';
const fontMono = '"JetBrains Mono", ui-monospace, monospace';

// Finger color palette — same as keyboard
const FP = {
  pink: '#ff7675', orange: '#fdcb6e', green: '#00b894',
  blue: '#74b9ff', indigo: '#0984e3', purple: '#a29bfe',
};

// ─────────────────────────────────────────────────────────────────────────────
// Header

function Header({ authed, name = 'Анна', gender = 'f', onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(245,244,240,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${L.divider}`,
      padding: '14px 32px',
      display: 'flex', alignItems: 'center', gap: 32,
    }}>
      {/* Logo */}
      <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: L.ink }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)',
          display: 'grid', placeItems: 'center',
          color: '#fff', fontFamily: fontMono, fontWeight: 700, fontSize: 13,
          boxShadow: '0 3px 10px rgba(116,185,255,0.3)',
        }}>Ё</div>
        <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em' }}>typing-trainer</div>
      </a>

      {/* Nav */}
      <nav style={{ display: 'flex', gap: 24, fontSize: 13.5, fontWeight: 500, color: L.sub, flex: 1 }}>
        <a href="#how" style={{ color: 'inherit', textDecoration: 'none' }}>Как это работает</a>
        <a href="#kb" style={{ color: 'inherit', textDecoration: 'none' }}>Клавиатуры</a>
        <a href="#audience" style={{ color: 'inherit', textDecoration: 'none' }}>Для кого</a>
        <a href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Тарифы</a>
        <a href="#faq" style={{ color: 'inherit', textDecoration: 'none' }}>Вопросы</a>
      </nav>

      {/* Right side */}
      {!authed ? (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button style={{
            background: 'transparent', border: 'none', color: L.ink,
            fontSize: 13.5, fontWeight: 600, fontFamily: fontUI, cursor: 'pointer',
            padding: '8px 14px',
          }}>Войти</button>
          <button style={{
            background: L.accent, color: '#fff',
            border: 'none', borderRadius: 9,
            padding: '10px 18px',
            fontSize: 13.5, fontWeight: 700, fontFamily: fontUI, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
          }}>Начать бесплатно</button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: L.surface, border: `1px solid ${L.divider}`,
            borderRadius: 999, padding: '4px 14px 4px 4px',
            cursor: 'pointer', fontFamily: fontUI,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            {window.UserPortrait
              ? <window.UserPortrait audience="adult" gender={gender} size={32} />
              : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fce7f3' }} />}
            <span style={{ fontSize: 13.5, fontWeight: 600, color: L.ink }}>{name}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" style={{ marginLeft: 2, opacity: 0.5 }}>
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              width: 240,
              background: L.surface,
              border: `1px solid ${L.divider}`,
              borderRadius: 12,
              boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
              padding: 6,
              fontFamily: fontUI,
            }}>
              <div style={{ padding: '12px 14px 10px', borderBottom: `1px solid ${L.divider}`, marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: L.ink }}>{name}</div>
                <div style={{ fontSize: 12, color: L.faint, fontFamily: fontMono }}>anna@example.com</div>
              </div>
              {[
                { icon: '◐', label: 'Мой курс', sub: 'Урок 12 · 87%' },
                { icon: '↗', label: 'Прогресс' },
                { icon: '⚑', label: 'Достижения' },
                { icon: '⚙', label: 'Настройки' },
              ].map((it, i) => (
                <button key={i} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', background: 'transparent', border: 'none',
                  fontSize: 13.5, fontWeight: 500, color: L.ink,
                  borderRadius: 8, cursor: 'pointer', textAlign: 'left', fontFamily: fontUI,
                }}>
                  <span style={{ fontFamily: fontMono, color: L.faint, fontSize: 14, width: 16 }}>{it.icon}</span>
                  <span style={{ flex: 1 }}>{it.label}</span>
                  {it.sub && <span style={{ fontSize: 11, color: L.faint, fontFamily: fontMono }}>{it.sub}</span>}
                </button>
              ))}
              <div style={{ height: 1, background: L.divider, margin: '6px 0' }} />
              <button onClick={onLogout} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', background: 'transparent', border: 'none',
                fontSize: 13.5, fontWeight: 500, color: '#ef4444',
                borderRadius: 8, cursor: 'pointer', textAlign: 'left', fontFamily: fontUI,
              }}>
                <span style={{ fontFamily: fontMono, fontSize: 14, width: 16 }}>↩</span>
                <span>Выйти</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero

function MiniKeyboard() {
  // Small inline visual of the split keyboard hero
  const rows = [
    [
      { l: 'Й', f: 'pink' }, { l: 'Ц', f: 'orange' }, { l: 'У', f: 'green' }, { l: 'К', f: 'blue' }, { l: 'Е', f: 'blue' },
    ],
    [
      { l: 'Ф', f: 'pink', home: false }, { l: 'Ы', f: 'orange' }, { l: 'В', f: 'green' }, { l: 'А', f: 'blue', home: true }, { l: 'П', f: 'blue' },
    ],
    [
      { l: 'Я', f: 'pink' }, { l: 'Ч', f: 'orange' }, { l: 'С', f: 'green' }, { l: 'М', f: 'blue' }, { l: 'И', f: 'blue' },
    ],
  ];
  const rowsR = [
    [
      { l: 'Н', f: 'indigo' }, { l: 'Г', f: 'indigo' }, { l: 'Ш', f: 'green' }, { l: 'Щ', f: 'orange' }, { l: 'З', f: 'pink' },
    ],
    [
      { l: 'Р', f: 'indigo' }, { l: 'О', f: 'indigo', home: true }, { l: 'Л', f: 'green' }, { l: 'Д', f: 'orange' }, { l: 'Ж', f: 'pink' },
    ],
    [
      { l: 'Т', f: 'indigo' }, { l: 'Ь', f: 'indigo' }, { l: 'Б', f: 'green' }, { l: 'Ю', f: 'orange' }, { l: '.', f: 'pink' },
    ],
  ];
  const Key = ({ l, f, home, highlight }) => (
    <div style={{
      width: 38, height: 36,
      background: highlight
        ? `linear-gradient(180deg, ${FP[f]} 0%, ${FP[f]}dd 100%)`
        : `linear-gradient(180deg, ${FP[f]} 0%, ${FP[f]}cc 100%)`,
      borderRadius: 6,
      display: 'grid', placeItems: 'center',
      color: '#fff', fontFamily: fontMono, fontWeight: 700, fontSize: 14,
      boxShadow: highlight
        ? `0 0 0 3px ${FP[f]}40, 0 6px 12px ${FP[f]}66, 0 1px 0 rgba(255,255,255,0.3) inset`
        : '0 1px 0 rgba(255,255,255,0.3) inset, 0 2px 4px rgba(0,0,0,0.1)',
      position: 'relative',
      transition: 'all .2s ease',
    }}>
      {l}
      {home && <span style={{
        position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
        width: 8, height: 2, background: 'rgba(255,255,255,0.7)', borderRadius: 999,
      }} />}
    </div>
  );
  return (
    <div style={{
      display: 'flex', gap: 32, padding: '24px 16px',
      background: 'linear-gradient(135deg, #ffffff 0%, #f5f4f0 100%)',
      borderRadius: 18,
      boxShadow: '0 24px 60px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,1) inset',
      border: `1px solid ${L.divider}`,
    }}>
      <div style={{
        transform: 'rotate(-10deg)', transformOrigin: 'bottom right',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: 4, transform: `translateX(${i * 8}px)` }}>
            {row.map((k, j) => <Key key={j} {...k} highlight={i === 1 && j === 3} />)}
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <div style={{
            width: 110, height: 18,
            background: `linear-gradient(180deg, ${FP.purple} 0%, ${FP.purple}cc 100%)`,
            borderRadius: 6,
            boxShadow: '0 1px 0 rgba(255,255,255,0.3) inset, 0 2px 4px rgba(0,0,0,0.1)',
          }} />
        </div>
      </div>
      <div style={{
        transform: 'rotate(10deg)', transformOrigin: 'bottom left',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {rowsR.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: 4, transform: `translateX(-${i * 8}px)` }}>
            {row.map((k, j) => <Key key={j} {...k} />)}
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 8 }}>
          <div style={{
            width: 110, height: 18,
            background: `linear-gradient(180deg, ${FP.purple} 0%, ${FP.purple}cc 100%)`,
            borderRadius: 6,
            boxShadow: '0 1px 0 rgba(255,255,255,0.3) inset, 0 2px 4px rgba(0,0,0,0.1)',
          }} />
        </div>
      </div>
    </div>
  );
}

function Hero({ authed }) {
  return (
    <section style={{
      padding: '60px 32px 64px',
      maxWidth: 1200, margin: '0 auto',
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48,
      alignItems: 'center',
    }}>
      <div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px',
          background: 'rgba(59,130,246,0.1)',
          color: L.accent,
          borderRadius: 999,
          fontSize: 12, fontWeight: 700, fontFamily: fontMono,
          letterSpacing: '0.04em',
          marginBottom: 22,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: L.accent,
            boxShadow: `0 0 0 4px ${L.accent}22`,
          }} />
          СЛЕПАЯ ПЕЧАТЬ · ЙЦУКЕН / QWERTY
        </div>

        <h1 style={{
          margin: 0, fontSize: 56, fontWeight: 800,
          letterSpacing: '-0.03em', lineHeight: 1.02,
          color: L.ink,
        }}>
          Печатай <span style={{
            background: 'linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>не глядя</span><br />
          на клавиатуру
        </h1>

        <p style={{
          margin: '20px 0 28px', fontSize: 17, color: L.sub,
          lineHeight: 1.5, maxWidth: 460,
        }}>
          6 цветов пальцев, 3 типа клавиатуры (включая эргономическую), наставник под возраст. От «двух пальцев» до 60+ знаков в минуту за 4 недели.
        </p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 28 }}>
          <button style={{
            background: L.accent, color: '#fff',
            border: 'none', borderRadius: 12,
            padding: '15px 26px',
            fontSize: 15, fontWeight: 700, fontFamily: fontUI, cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(59,130,246,0.35)',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            {authed ? 'Продолжить обучение' : 'Начать бесплатно'}
            <span style={{ fontSize: 16 }}>→</span>
          </button>
          {!authed && (
            <button style={{
              background: 'transparent', color: L.ink,
              border: `1.5px solid ${L.divider}`, borderRadius: 12,
              padding: '14px 22px',
              fontSize: 14, fontWeight: 600, fontFamily: fontUI, cursor: 'pointer',
            }}>Посмотреть демо</button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 24, fontSize: 12.5, color: L.sub, fontFamily: fontMono }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckGlyph /> Бесплатный старт
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckGlyph /> Без рекламы
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckGlyph /> Сертификат
          </span>
        </div>
      </div>

      <div>
        <MiniKeyboard />
      </div>
    </section>
  );
}

function CheckGlyph() {
  return <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 7.5L6 10L11 4" stroke={L.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Keyboards section

function KeyboardsSection() {
  const items = [
    { id: 'classic', label: 'Полноразмерная', sub: 'С цифровым блоком и nav-кластером', shape: 'classic' },
    { id: 'laptop',  label: 'Ноутбук',         sub: 'Без numpad, компактная',          shape: 'laptop' },
    { id: 'ergonomic', label: 'Эргономическая', sub: 'Split-раскладка для рук',        shape: 'ergo' },
  ];
  return (
    <section id="kb" style={{
      padding: '72px 32px',
      maxWidth: 1200, margin: '0 auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 36 }}>
        <div>
          <div style={{ fontFamily: fontMono, fontSize: 11, color: L.faint, letterSpacing: '0.08em', marginBottom: 8 }}>
            01 · ПОДДЕРЖИВАЕМ
          </div>
          <h2 style={{ margin: 0, fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Работаем с любой клавиатурой
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: L.sub, maxWidth: 360, lineHeight: 1.5 }}>
          Тренажёр подстраивается под вашу железку. Геометрию выберете в онбординге.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {items.map(it => (
          <div key={it.id} style={{
            background: L.surface,
            border: `1px solid ${L.divider}`,
            borderRadius: 18,
            padding: 24,
            transition: 'transform .2s ease',
          }}>
            <div style={{
              height: 130, display: 'grid', placeItems: 'center',
              background: 'linear-gradient(135deg, #f5f4f0 0%, #ecebe5 100%)',
              borderRadius: 12, marginBottom: 18,
            }}>
              <KbShape shape={it.shape} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{it.label}</div>
            <div style={{ fontSize: 13, color: L.sub, lineHeight: 1.5 }}>{it.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function KbShape({ shape }) {
  if (shape === 'classic') {
    return (
      <svg width="180" height="90" viewBox="0 0 180 90" fill="none">
        <rect x="6" y="20" width="120" height="60" rx="6" fill="#fff" stroke={L.divider} strokeWidth="1.5" />
        <rect x="132" y="30" width="42" height="50" rx="5" fill="#fff" stroke={L.divider} strokeWidth="1.5" />
        {[0,1,2,3,4].map(r => Array.from({length:12}).map((_, c) => (
          <rect key={`${r}-${c}`} x={10 + c * 9.5} y={24 + r * 10} width="7" height="7" rx="1" fill={r === 2 && c === 4 ? FP.blue : r === 1 && [0,1,2,3,4].includes(c) ? [FP.pink, FP.orange, FP.green, FP.blue, FP.blue][c] : '#f5f4f0'} />
        )))}
        {/* numpad */}
        {[0,1,2,3].map(r => [0,1,2].map(c => (
          <rect key={`n-${r}-${c}`} x={135 + c * 12} y={34 + r * 10} width="9" height="7" rx="1" fill={c === 0 ? FP.blue : c === 1 ? FP.green : FP.orange} />
        )))}
      </svg>
    );
  }
  if (shape === 'laptop') {
    return (
      <svg width="180" height="90" viewBox="0 0 180 90" fill="none">
        <rect x="12" y="8" width="156" height="62" rx="6" fill="#2d3436" />
        <rect x="16" y="12" width="148" height="54" rx="3" fill="#74b9ff" opacity="0.2" />
        <rect x="4" y="68" width="172" height="12" rx="3" fill="#dfe6e9" />
        {[0,1,2,3].map(r => Array.from({length:12}).map((_, c) => (
          <rect key={`${r}-${c}`} x={20 + c * 11.5} y={16 + r * 9} width="9" height="6" rx="1"
            fill={r === 2 && c === 3 ? FP.blue : '#fff'} opacity="0.85" />
        )))}
      </svg>
    );
  }
  // ergo
  return (
    <svg width="180" height="90" viewBox="0 0 180 90" fill="none">
      <g transform="rotate(-12 50 70)">
        <rect x="10" y="32" width="72" height="46" rx="6" fill="#fff" stroke={L.divider} strokeWidth="1.5" />
        {[0,1,2,3].map(r => Array.from({length:6}).map((_, c) => (
          <rect key={`l-${r}-${c}`} x={14 + c * 11} y={36 + r * 10} width="9" height="7" rx="1"
            fill={[FP.pink, FP.orange, FP.green, FP.blue, FP.blue, FP.indigo][c]} />
        )))}
        <rect x="35" y="78" width="40" height="6" rx="2" fill={FP.purple} />
      </g>
      <g transform="rotate(12 130 70)">
        <rect x="98" y="32" width="72" height="46" rx="6" fill="#fff" stroke={L.divider} strokeWidth="1.5" />
        {[0,1,2,3].map(r => Array.from({length:6}).map((_, c) => (
          <rect key={`r-${r}-${c}`} x={102 + c * 11} y={36 + r * 10} width="9" height="7" rx="1"
            fill={[FP.indigo, FP.indigo, FP.green, FP.orange, FP.pink, FP.pink][c]} />
        )))}
        <rect x="105" y="78" width="40" height="6" rx="2" fill={FP.purple} />
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Audience section

function AudienceSection() {
  const items = [
    { id: 'adult', label: 'Взрослый', age: '18+', lessons: '99 уроков', desc: 'Профессиональная программа, психотренинг, темп под взрослого', accent: FP.blue, portrait: 'adult' },
    { id: 'teen',  label: 'Подросток', age: '12-17', lessons: '75 уроков', desc: 'Мемы, темы про игры/соц-сети, Кнопыч ведёт', accent: FP.green, portrait: 'teen' },
    { id: 'kid',   label: 'Ребёнок',   age: '6-11',  lessons: '50 уроков', desc: 'Сказки, короткие слова, Клавочка рядом', accent: FP.pink, portrait: 'kid' },
  ];
  return (
    <section id="audience" style={{
      padding: '72px 32px',
      maxWidth: 1200, margin: '0 auto',
      background: 'transparent',
    }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: L.faint, letterSpacing: '0.08em', marginBottom: 8 }}>
          02 · АДАПТИРУЕМ
        </div>
        <h2 style={{ margin: 0, fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Курс под возраст
        </h2>
        <p style={{ margin: '10px 0 0', fontSize: 14.5, color: L.sub, maxWidth: 500, lineHeight: 1.5 }}>
          Тон, темы, длительность урока — разные для взрослого, подростка и ребёнка. И наставник у каждого свой.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {items.map(it => (
          <div key={it.id} style={{
            background: L.surface,
            border: `1px solid ${L.divider}`,
            borderRadius: 18,
            padding: 26,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -40, right: -40,
              width: 160, height: 160, borderRadius: '50%',
              background: `${it.accent}22`,
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{ marginBottom: 16 }}>
                {window.UserPortrait
                  ? <window.UserPortrait audience={it.id} gender={it.id === 'adult' ? 'm' : it.id === 'teen' ? 'f' : 'm'} size={72} />
                  : <div style={{ width: 72, height: 72, borderRadius: '50%', background: it.accent }} />}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{it.label}</div>
                <div style={{ fontSize: 12, color: L.faint, fontFamily: fontMono }}>{it.age}</div>
              </div>
              <div style={{ fontSize: 13.5, color: L.sub, lineHeight: 1.5, marginBottom: 16 }}>{it.desc}</div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px',
                background: 'rgba(0,0,0,0.04)',
                borderRadius: 999,
                fontSize: 11, color: L.ink, fontFamily: fontMono,
              }}>{it.lessons}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// How it works (3 steps)

function HowSection() {
  const steps = [
    { n: '01', title: 'Регистрация', body: 'Email + пароль или соцсеть. Минимум полей — 30 секунд.' },
    { n: '02', title: 'Онбординг', body: 'Имя, возраст, клавиатура — за пару кликов. Курс адаптируется автоматически.' },
    { n: '03', title: 'Первый урок', body: 'Сразу за клавиатуру. Подсветка пальцев, метроном, мгновенная обратная связь.' },
  ];
  return (
    <section id="how" style={{
      padding: '72px 32px',
      maxWidth: 1200, margin: '0 auto',
    }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: L.faint, letterSpacing: '0.08em', marginBottom: 8 }}>
          03 · ПРОСТО
        </div>
        <h2 style={{ margin: 0, fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Как начать
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {steps.map((s, i) => (
          <div key={s.n} style={{
            background: L.surface,
            border: `1px solid ${L.divider}`,
            borderRadius: 18,
            padding: 28,
          }}>
            <div style={{
              fontFamily: fontMono, fontSize: 13, fontWeight: 700,
              color: L.accent, marginBottom: 14,
            }}>{s.n}</div>
            <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
            <div style={{ fontSize: 13.5, color: L.sub, lineHeight: 1.5 }}>{s.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pricing

function Pricing() {
  const tiers = [
    {
      id: 'free', label: 'Старт', price: '0', sub: 'навсегда',
      features: ['Базовые уроки 1–20', 'Один тип клавиатуры', '1 язык'],
      cta: 'Начать бесплатно',
      featured: false,
    },
    {
      id: 'pro', label: 'Полный', price: '490', sub: '₽ / мес',
      features: ['Все 99 уроков', 'Все 3 типа клавиатуры', 'Все языки и алфавиты', 'Тренажёр скорости', 'Сертификат'],
      cta: 'Попробовать 7 дней',
      featured: true,
    },
    {
      id: 'family', label: 'Семейный', price: '890', sub: '₽ / мес · до 5 чел.',
      features: ['Всё из Полного', 'До 5 профилей', 'Подростковый и детский курсы', 'Родительская статистика'],
      cta: 'Подключить',
      featured: false,
    },
  ];
  return (
    <section id="pricing" style={{
      padding: '72px 32px',
      maxWidth: 1200, margin: '0 auto',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: L.faint, letterSpacing: '0.08em', marginBottom: 8 }}>
          04 · ЧЕСТНО
        </div>
        <h2 style={{ margin: 0, fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Тарифы без подвохов
        </h2>
        <p style={{ margin: '10px 0 0', fontSize: 14.5, color: L.sub, lineHeight: 1.5 }}>
          Отменить можно в любой момент. Без авто-продления без согласия.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {tiers.map(t => (
          <div key={t.id} style={{
            background: t.featured ? '#1a1a17' : L.surface,
            border: `1px solid ${t.featured ? '#1a1a17' : L.divider}`,
            borderRadius: 20,
            padding: 28,
            color: t.featured ? '#fff' : L.ink,
            position: 'relative',
            boxShadow: t.featured ? '0 30px 60px rgba(0,0,0,0.18)' : 'none',
            transform: t.featured ? 'scale(1.02)' : 'none',
          }}>
            {t.featured && (
              <div style={{
                position: 'absolute', top: -10, left: 28,
                padding: '4px 12px', borderRadius: 999,
                background: L.accent, color: '#fff',
                fontSize: 11, fontFamily: fontMono, fontWeight: 700, letterSpacing: '0.04em',
              }}>ПОПУЛЯРНО</div>
            )}
            <div style={{ fontSize: 14, fontWeight: 700, opacity: t.featured ? 0.85 : 0.7, marginBottom: 14 }}>{t.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', fontFamily: fontMono }}>{t.price}</span>
              <span style={{ fontSize: 13, opacity: 0.7 }}>{t.sub}</span>
            </div>
            <div style={{ height: 1, background: t.featured ? 'rgba(255,255,255,0.15)' : L.divider, margin: '20px 0' }} />
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {t.features.map((f, i) => (
                <li key={i} style={{ fontSize: 13.5, display: 'flex', gap: 10, alignItems: 'flex-start', opacity: t.featured ? 0.9 : 1 }}>
                  <svg width="16" height="16" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                    <path d="M3 7.5L6 10L11 4" stroke={t.featured ? '#22c55e' : L.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button style={{
              width: '100%', padding: '13px 18px',
              background: t.featured ? '#fff' : L.accent,
              color: t.featured ? '#1a1a17' : '#fff',
              border: 'none', borderRadius: 11,
              fontSize: 13.5, fontWeight: 700, fontFamily: fontUI, cursor: 'pointer',
            }}>{t.cta}</button>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats strip + footer

function StatsStrip() {
  const stats = [
    { v: '166K+', l: 'Учеников' },
    { v: '12K', l: 'Закончили курс' },
    { v: '4.9 ★', l: 'Рейтинг' },
    { v: '40ч', l: 'До результата' },
  ];
  return (
    <section style={{
      padding: '40px 32px',
      maxWidth: 1200, margin: '0 auto',
    }}>
      <div style={{
        background: '#1a1a17', color: '#fff',
        borderRadius: 20, padding: '32px 40px',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18,
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{ borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none', paddingLeft: i > 0 ? 24 : 0 }}>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em', fontFamily: fontMono, marginBottom: 4 }}>{s.v}</div>
            <div style={{ fontSize: 12.5, opacity: 0.6, fontFamily: fontMono, letterSpacing: '0.04em' }}>{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{
      padding: '48px 32px 32px',
      background: 'transparent',
      borderTop: `1px solid ${L.divider}`,
      marginTop: 40,
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 32,
        marginBottom: 32,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)',
              display: 'grid', placeItems: 'center',
              color: '#fff', fontFamily: fontMono, fontWeight: 700, fontSize: 12,
            }}>Ё</div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>typing-trainer</div>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: L.sub, lineHeight: 1.55, maxWidth: 320 }}>
            Современный тренажёр слепой печати с поддержкой эргономических клавиатур и адаптацией под возраст.
          </p>
        </div>
        {[
          { h: 'Продукт', l: ['Возможности', 'Тарифы', 'Раскладки', 'Тренажёр скорости'] },
          { h: 'Компания', l: ['О нас', 'Блог', 'Контакты', 'Карьера'] },
          { h: 'Помощь', l: ['Поддержка', 'FAQ', 'Соглашение', 'Конфиденциальность'] },
        ].map((c, i) => (
          <div key={i}>
            <div style={{ fontSize: 12, fontWeight: 700, fontFamily: fontMono, color: L.faint, letterSpacing: '0.06em', marginBottom: 12 }}>
              {c.h.toUpperCase()}
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {c.l.map(item => (
                <li key={item}><a href="#" style={{ color: L.ink, textDecoration: 'none', fontSize: 13 }}>{item}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 20, borderTop: `1px solid ${L.divider}`,
        fontSize: 12, color: L.faint, fontFamily: fontMono,
      }}>
        <span>© 2026 typing-trainer</span>
        <div style={{ display: 'flex', gap: 14 }}>
          <a href="#" style={{ color: 'inherit' }}>RU</a>
          <a href="#" style={{ color: 'inherit' }}>EN</a>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page

function LandingPage({ authed }) {
  return (
    <div style={{
      width: '100%', minHeight: '100%',
      background: L.bg, color: L.ink, fontFamily: fontUI,
    }}>
      <Header authed={authed} name="Анна" gender="f" />
      <Hero authed={authed} />
      <KeyboardsSection />
      <AudienceSection />
      <HowSection />
      <Pricing />
      <StatsStrip />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <DesignCanvas defaultZoom={0.45}>
      <DCSection id="anon" title="Лендинг · анонимный посетитель" subtitle="Шапка справа: «Войти» (вторичная) + «Начать бесплатно» (primary). Hero ведёт к регистрации.">
        <DCArtboard id="landing-anon" label="Anonymous · кнопки Войти / Начать бесплатно" width={1280} height={3200}>
          <LandingPage authed={false} />
        </DCArtboard>
      </DCSection>

      <DCSection id="authed" title="Лендинг · авторизованный пользователь" subtitle="То же содержимое, но справа в шапке — профиль с дропдауном (Мой курс / Прогресс / Достижения / Настройки / Выйти). Hero CTA меняется на «Продолжить обучение». Видно сохранение состояния прогресса.">
        <DCArtboard id="landing-authed" label="Authorized · профиль-дропдаун + Продолжить обучение" width={1280} height={3200}>
          <LandingPage authed={true} />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
