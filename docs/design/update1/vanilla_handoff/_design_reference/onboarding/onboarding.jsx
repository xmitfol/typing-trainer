// onboarding.jsx — three onboarding redesigns presented on a design canvas
// Variant A: Multi-step wizard (recommended) — one decision per screen
// Variant B: Single-page redesigned — same single-scroll, clearer labels & grouping
// Variant C: Smart auto-detect — minimal questions, ask only what can't be detected

const { useState, useMemo, useEffect } = React;
const { UserPortrait, MentorPortrait } = window;

// ─────────────────────────────────────────────────────────────────────────────
// Tokens

const C = {
  bg: '#f5f4f0',
  surface: '#ffffff',
  ink: '#1a1a17',
  sub: 'rgba(26,26,23,0.55)',
  faint: 'rgba(26,26,23,0.35)',
  divider: 'rgba(0,0,0,0.06)',
  accent: '#3b82f6',
  accentBg: '#eef4ff',
  accentBorder: '#3b82f6',
  pink: '#ff7675',
  orange: '#fdcb6e',
  green: '#00b894',
  blue: '#74b9ff',
  indigo: '#0984e3',
  purple: '#a29bfe',
};

const fontUI = '"Manrope", ui-sans-serif, system-ui, sans-serif';
const fontMono = '"JetBrains Mono", ui-monospace, monospace';

// ─────────────────────────────────────────────────────────────────────────────
// Audience options (the "Профиль" replacement)

const AUDIENCES = [
  {
    id: 'adult',
    label: 'Взрослый',
    age: '18+',
    course: 'Основной курс',
    lessons: '99 уроков',
    desc: 'Стандартная методика слепой печати',
    tone: { from: '#74b9ff', to: '#0984e3' },
    glyph: 'adult',
    needsMentor: true,
  },
  {
    id: 'teen',
    label: 'Подросток',
    age: '12-17',
    course: 'Юниор · с Кнопычем',
    lessons: '75 уроков',
    desc: 'Геймификация, мемы, темп быстрее',
    tone: { from: '#00b894', to: '#00a085' },
    glyph: 'teen',
    needsMentor: false,
    mentor: { name: 'Кнопыч', role: 'Робот-клавиша', accent: C.green },
  },
  {
    id: 'kid',
    label: 'Ребёнок',
    age: '6-11',
    course: 'Детский · с Клавочкой',
    lessons: '50 уроков',
    desc: 'Сказочный тон, короткие слова и истории',
    tone: { from: '#ff7675', to: '#e84393' },
    glyph: 'kid',
    needsMentor: false,
    mentor: { name: 'Клавочка', role: 'Добрая помощница', accent: C.pink },
  },
];

const MENTORS = [
  {
    id: 'anna',
    name: 'Анна',
    age: '34',
    role: 'Учительница',
    style: 'Мягкий темп, подробные объяснения',
    accent: C.pink,
    glyph: 'woman',
  },
  {
    id: 'maxim',
    name: 'Максим',
    age: '41',
    role: 'Тренер',
    style: 'Энергичный, без воды, упор на скорость',
    accent: C.blue,
    glyph: 'man',
  },
];

const KEYBOARDS = [
  { id: 'classic',   label: 'Полноразмерная', sub: 'с цифровым блоком', glyph: 'classic' },
  { id: 'laptop',    label: 'Ноутбук',         sub: 'без numpad',         glyph: 'laptop' },
  { id: 'ergonomic', label: 'Эргономическая',  sub: 'split-раскладка',    glyph: 'ergo' },
];

const LANGUAGES = [
  { id: 'ru', code: 'RU', label: 'Русский', layout: 'ЙЦУКЕН' },
  { id: 'en', code: 'EN', label: 'English',  layout: 'QWERTY' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Glyphs — flat SVG placeholders. Designed to read at small sizes.

function Glyph({ kind, size = 48 }) {
  const s = size;
  const common = { width: s, height: s, viewBox: '0 0 64 64', fill: 'none' };
  if (kind === 'adult') return (
    <svg {...common}>
      <circle cx="32" cy="22" r="11" fill="#fdcb6e" />
      <path d="M14 56 Q14 40 32 40 Q50 40 50 56 L50 60 L14 60 Z" fill="#74b9ff" />
      <circle cx="28" cy="22" r="1.4" fill="#1a1a17" />
      <circle cx="36" cy="22" r="1.4" fill="#1a1a17" />
      <path d="M28 27 Q32 30 36 27" stroke="#1a1a17" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  if (kind === 'teen') return (
    <svg {...common}>
      <rect x="14" y="14" width="36" height="36" rx="8" fill="#2d3436" />
      <rect x="20" y="22" width="24" height="14" rx="3" fill="#00b894" />
      <circle cx="26" cy="29" r="2.5" fill="#fff" />
      <circle cx="38" cy="29" r="2.5" fill="#fff" />
      <rect x="22" y="40" width="20" height="3" rx="1.5" fill="#00b894" opacity="0.6" />
      <rect x="30" y="10" width="4" height="6" fill="#2d3436" />
      <circle cx="32" cy="9" r="2.5" fill="#ff7675" />
      <rect x="18" y="50" width="6" height="6" fill="#2d3436" />
      <rect x="40" y="50" width="6" height="6" fill="#2d3436" />
    </svg>
  );
  if (kind === 'kid') return (
    <svg {...common}>
      <circle cx="32" cy="32" r="22" fill="#ffeaa7" />
      <circle cx="22" cy="22" r="5" fill="#ff7675" />
      <circle cx="42" cy="22" r="5" fill="#74b9ff" />
      <circle cx="22" cy="42" r="5" fill="#00b894" />
      <circle cx="42" cy="42" r="5" fill="#a29bfe" />
      <circle cx="32" cy="32" r="4" fill="#fdcb6e" />
    </svg>
  );
  if (kind === 'woman') return (
    <svg {...common}>
      <circle cx="32" cy="24" r="11" fill="#fdcb6e" />
      <path d="M21 16 Q22 8 32 8 Q42 8 43 16 Q44 24 41 22 L23 22 Q20 24 21 16 Z" fill="#e17055" />
      <path d="M14 56 Q14 40 32 40 Q50 40 50 56 L50 60 L14 60 Z" fill="#ff7675" />
      <circle cx="28" cy="25" r="1.4" fill="#1a1a17" />
      <circle cx="36" cy="25" r="1.4" fill="#1a1a17" />
      <path d="M28 30 Q32 33 36 30" stroke="#1a1a17" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  if (kind === 'man') return (
    <svg {...common}>
      <circle cx="32" cy="24" r="11" fill="#fdcb6e" />
      <path d="M22 18 Q23 12 32 12 Q41 12 42 18 L42 21 L22 21 Z" fill="#2d3436" />
      <path d="M14 56 Q14 40 32 40 Q50 40 50 56 L50 60 L14 60 Z" fill="#0984e3" />
      <circle cx="28" cy="25" r="1.4" fill="#1a1a17" />
      <circle cx="36" cy="25" r="1.4" fill="#1a1a17" />
      <path d="M28 30 Q32 32 36 30" stroke="#1a1a17" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  if (kind === 'classic') return (
    <svg {...common}>
      <rect x="6" y="22" width="52" height="24" rx="3" fill="#dfe6e9" stroke="#b2bec3" strokeWidth="1.5" />
      {[0,1,2,3,4,5,6,7,8,9].map(i => (
        <rect key={i} x={9 + i * 4.5} y="26" width="3.5" height="3.5" rx="0.6" fill="#fff" stroke="#b2bec3" strokeWidth="0.5" />
      ))}
      {[0,1,2,3,4,5,6,7,8,9].map(i => (
        <rect key={i} x={9 + i * 4.5} y="32" width="3.5" height="3.5" rx="0.6" fill="#fff" stroke="#b2bec3" strokeWidth="0.5" />
      ))}
      <rect x="22" y="38" width="20" height="3.5" rx="0.6" fill="#a29bfe" />
      <rect x="46" y="26" width="9" height="15" rx="0.6" fill="#fff" stroke="#b2bec3" strokeWidth="0.5" />
    </svg>
  );
  if (kind === 'laptop') return (
    <svg {...common}>
      <rect x="10" y="14" width="44" height="30" rx="2" fill="#2d3436" />
      <rect x="12" y="16" width="40" height="26" rx="1" fill="#0984e3" />
      <rect x="4" y="44" width="56" height="6" rx="2" fill="#b2bec3" />
      <rect x="22" y="48" width="20" height="1.5" fill="#636e72" />
    </svg>
  );
  if (kind === 'ergo') return (
    <svg {...common}>
      <g transform="rotate(-10 22 38)">
        <rect x="6" y="26" width="26" height="20" rx="3" fill="#dfe6e9" stroke="#b2bec3" strokeWidth="1.2" />
        <rect x="8" y="28" width="3" height="3" rx="0.5" fill="#fff" stroke="#b2bec3" strokeWidth="0.3" />
        <rect x="12" y="28" width="3" height="3" rx="0.5" fill="#fff" stroke="#b2bec3" strokeWidth="0.3" />
        <rect x="16" y="28" width="3" height="3" rx="0.5" fill="#fff" stroke="#b2bec3" strokeWidth="0.3" />
        <rect x="20" y="28" width="3" height="3" rx="0.5" fill="#fff" stroke="#b2bec3" strokeWidth="0.3" />
        <rect x="24" y="28" width="3" height="3" rx="0.5" fill="#fff" stroke="#b2bec3" strokeWidth="0.3" />
        <rect x="14" y="40" width="14" height="3" rx="0.5" fill="#a29bfe" />
      </g>
      <g transform="rotate(10 42 38)">
        <rect x="32" y="26" width="26" height="20" rx="3" fill="#dfe6e9" stroke="#b2bec3" strokeWidth="1.2" />
        <rect x="36" y="28" width="3" height="3" rx="0.5" fill="#fff" stroke="#b2bec3" strokeWidth="0.3" />
        <rect x="40" y="28" width="3" height="3" rx="0.5" fill="#fff" stroke="#b2bec3" strokeWidth="0.3" />
        <rect x="44" y="28" width="3" height="3" rx="0.5" fill="#fff" stroke="#b2bec3" strokeWidth="0.3" />
        <rect x="48" y="28" width="3" height="3" rx="0.5" fill="#fff" stroke="#b2bec3" strokeWidth="0.3" />
        <rect x="52" y="28" width="3" height="3" rx="0.5" fill="#fff" stroke="#b2bec3" strokeWidth="0.3" />
        <rect x="36" y="40" width="14" height="3" rx="0.5" fill="#a29bfe" />
      </g>
    </svg>
  );
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives

function Card({ selected, onClick, children, accent = C.accent, padding = '20px 18px', style = {} }) {
  return (
    <button onClick={onClick} style={{
      background: selected ? '#f0f6ff' : C.surface,
      border: `1.5px solid ${selected ? accent : C.divider}`,
      borderRadius: 14,
      padding,
      cursor: 'pointer',
      textAlign: 'left',
      fontFamily: fontUI,
      color: C.ink,
      transition: 'all .15s ease',
      position: 'relative',
      ...style,
    }}>
      {selected && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          width: 22, height: 22, borderRadius: '50%',
          background: accent, display: 'grid', placeItems: 'center',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6.5 L5 9 L10 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      {children}
    </button>
  );
}

function SectionLabel({ children, num, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        {num !== undefined && (
          <span style={{
            fontFamily: fontMono,
            fontSize: 11,
            color: C.faint,
            letterSpacing: '0.06em',
          }}>{String(num).padStart(2, '0')}</span>
        )}
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.ink, letterSpacing: '-0.01em' }}>{children}</h3>
      </div>
      {sub && <div style={{ fontSize: 13, color: C.sub, marginTop: 4, marginLeft: num !== undefined ? 30 : 0 }}>{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT A — Multi-step wizard

function WizardOnboarding({ stepOverride = null }) {
  const [name, setName] = useState('Алексей');
  const [audience, setAudience] = useState('adult');
  const [mentor, setMentor] = useState('anna');
  const [keyboard, setKeyboard] = useState('classic');
  const [language, setLanguage] = useState('ru');

  const audienceObj = AUDIENCES.find(a => a.id === audience);
  const steps = useMemo(() => {
    const base = [
      { id: 'name',     title: 'Знакомство',  short: 'Имя' },
      { id: 'audience', title: 'Кому учиться?', short: 'Профиль' },
    ];
    if (audienceObj?.needsMentor) base.push({ id: 'mentor', title: 'Выбери наставника', short: 'Наставник' });
    base.push({ id: 'keyboard', title: 'Какая у тебя клавиатура?', short: 'Клавиатура' });
    base.push({ id: 'language', title: 'Язык обучения', short: 'Язык' });
    return base;
  }, [audienceObj]);

  const [stepIdx, setStepIdx] = useState(stepOverride ?? 1);
  useEffect(() => { if (stepOverride !== null) setStepIdx(stepOverride); }, [stepOverride]);
  const step = steps[stepIdx] || steps[steps.length - 1];

  const goNext = () => setStepIdx(i => Math.min(i + 1, steps.length - 1));
  const goPrev = () => setStepIdx(i => Math.max(i - 1, 0));

  return (
    <div style={{
      width: '100%', height: '100%',
      background: C.bg, fontFamily: fontUI,
      display: 'flex', flexDirection: 'column',
      color: C.ink,
    }}>
      {/* Progress strip */}
      <div style={{
        padding: '20px 32px 14px',
        borderBottom: `1px solid ${C.divider}`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 14,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)',
            display: 'grid', placeItems: 'center',
            color: '#fff', fontFamily: fontMono, fontWeight: 700, fontSize: 12,
          }}>Ё</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Тренажёр слепой печати</div>
          <div style={{ flex: 1 }} />
          <div style={{ fontFamily: fontMono, fontSize: 11, color: C.faint }}>
            Шаг {stepIdx + 1} из {steps.length}
          </div>
        </div>
        {/* Step dots */}
        <div style={{ display: 'flex', gap: 6 }}>
          {steps.map((s, i) => (
            <div key={s.id} style={{
              flex: 1, height: 4, borderRadius: 999,
              background: i <= stepIdx ? C.accent : 'rgba(0,0,0,0.08)',
              transition: 'background .2s ease',
            }} />
          ))}
        </div>
      </div>

      {/* Step body */}
      <div style={{
        flex: 1,
        padding: '32px 32px 24px',
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em',
          }}>{step.title}</h1>
          {step.id === 'audience' && (
            <p style={{ margin: '8px 0 0', fontSize: 14, color: C.sub, maxWidth: 480 }}>
              От этого зависит весь курс: количество уроков, тон, темы заданий и наставник.
            </p>
          )}
          {step.id === 'mentor' && (
            <p style={{ margin: '8px 0 0', fontSize: 14, color: C.sub, maxWidth: 480 }}>
              Наставник будет вести тебя по урокам — комментировать ошибки и поздравлять. Выбирай по стилю, не по полу.
            </p>
          )}
          {step.id === 'keyboard' && (
            <p style={{ margin: '8px 0 0', fontSize: 14, color: C.sub, maxWidth: 480 }}>
              Влияет на визуальную модель в уроках. Поменять можно позже в настройках.
            </p>
          )}
        </div>

        {step.id === 'name' && (
          <div style={{ maxWidth: 440 }}>
            <label style={{ display: 'block', fontSize: 13, color: C.sub, marginBottom: 8 }}>
              Как тебя зовут?
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px',
                border: `1.5px solid ${C.divider}`, borderRadius: 12,
                fontSize: 16, fontFamily: fontUI,
                outline: 'none',
                background: C.surface, color: C.ink,
              }}
            />
            <div style={{ fontSize: 12, color: C.faint, marginTop: 8 }}>
              Используем при поздравлениях и в сертификате.
            </div>
          </div>
        )}

        {step.id === 'audience' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {AUDIENCES.map(a => (
              <Card key={a.id} selected={audience === a.id} onClick={() => setAudience(a.id)} padding="22px 18px 20px">
                <div style={{
                  width: 64, height: 64,
                  background: `linear-gradient(135deg, ${a.tone.from}33 0%, ${a.tone.to}22 100%)`,
                  borderRadius: 14,
                  display: 'grid', placeItems: 'center',
                  marginBottom: 14,
                }}>
                  <Glyph kind={a.glyph} size={48} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 17, fontWeight: 700 }}>{a.label}</span>
                  <span style={{ fontFamily: fontMono, fontSize: 11, color: C.faint }}>{a.age}</span>
                </div>
                <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.4, marginBottom: 12, minHeight: 36 }}>
                  {a.desc}
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 9px',
                  background: 'rgba(0,0,0,0.04)',
                  borderRadius: 999,
                  fontFamily: fontMono, fontSize: 11, color: C.ink,
                }}>
                  <span>{a.course}</span>
                  <span style={{ color: C.faint }}>·</span>
                  <span style={{ color: C.faint }}>{a.lessons}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {step.id === 'mentor' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 560 }}>
            {MENTORS.map(m => (
              <Card key={m.id} selected={mentor === m.id} onClick={() => setMentor(m.id)} padding="22px 20px">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                  <div style={{
                    width: 56, height: 56,
                    background: `${m.accent}22`,
                    borderRadius: 14,
                    display: 'grid', placeItems: 'center',
                  }}>
                    <Glyph kind={m.glyph} size={48} />
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>{m.name}, {m.age}</div>
                    <div style={{ fontSize: 12, color: C.sub, fontFamily: fontMono }}>{m.role}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.5 }}>
                  «{m.style}»
                </div>
              </Card>
            ))}
            <div style={{
              gridColumn: '1 / -1',
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.03)',
              borderRadius: 10,
              fontSize: 12, color: C.sub,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 14 }}>💡</span>
              <span>Выбор не влияет на содержание курса — только на стиль подачи и тон сообщений.</span>
            </div>
          </div>
        )}

        {step.id === 'keyboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {KEYBOARDS.map(k => (
              <Card key={k.id} selected={keyboard === k.id} onClick={() => setKeyboard(k.id)} padding="20px 16px">
                <div style={{
                  height: 78,
                  display: 'grid', placeItems: 'center',
                  background: 'rgba(0,0,0,0.025)',
                  borderRadius: 10,
                  marginBottom: 12,
                }}>
                  <Glyph kind={k.glyph} size={56} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{k.label}</div>
                <div style={{ fontSize: 12, color: C.sub }}>{k.sub}</div>
              </Card>
            ))}
          </div>
        )}

        {step.id === 'language' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 520 }}>
            {LANGUAGES.map(l => (
              <Card key={l.id} selected={language === l.id} onClick={() => setLanguage(l.id)} padding="20px 18px">
                <div style={{ fontSize: 32, fontFamily: fontMono, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
                  {l.code}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{l.label}</div>
                <div style={{ fontFamily: fontMono, fontSize: 11, color: C.faint, marginTop: 2 }}>{l.layout}</div>
              </Card>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Footer nav */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 28, paddingTop: 18, borderTop: `1px solid ${C.divider}`,
        }}>
          <button onClick={goPrev} disabled={stepIdx === 0} style={{
            padding: '10px 18px',
            background: 'transparent', border: 'none',
            fontSize: 14, fontFamily: fontUI, color: stepIdx === 0 ? C.faint : C.ink,
            cursor: stepIdx === 0 ? 'default' : 'pointer',
          }}>← Назад</button>

          <div style={{ fontFamily: fontMono, fontSize: 11, color: C.faint }}>
            {step.short}
          </div>

          <button onClick={goNext} disabled={stepIdx >= steps.length - 1} style={{
            padding: '12px 28px',
            background: C.accent, color: '#fff',
            border: 'none', borderRadius: 10,
            fontSize: 14, fontFamily: fontUI, fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
          }}>{stepIdx >= steps.length - 1 ? 'Начать обучение' : 'Дальше →'}</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT B — Single-page redesigned (better grouping, clearer copy, conditional mentor)

function SinglePageOnboarding() {
  const [name, setName] = useState('Алексей');
  const [audience, setAudience] = useState('adult');
  const [mentor, setMentor] = useState('anna');
  const [keyboard, setKeyboard] = useState('classic');
  const [language, setLanguage] = useState('ru');
  const audienceObj = AUDIENCES.find(a => a.id === audience);

  return (
    <div style={{
      width: '100%', height: '100%',
      background: C.bg, fontFamily: fontUI,
      overflowY: 'auto', color: C.ink,
    }}>
      <div style={{ padding: '28px 32px 32px', maxWidth: 880, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)',
            display: 'grid', placeItems: 'center',
            color: '#fff', fontFamily: fontMono, fontWeight: 700, fontSize: 13,
          }}>Ё</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Добро пожаловать!</div>
            <div style={{ fontSize: 12, color: C.sub }}>Настроим курс под тебя — 5 коротких вопросов</div>
          </div>
        </div>

        {/* 01 Name */}
        <div style={{ marginBottom: 32 }}>
          <SectionLabel num={1}>Как тебя зовут?</SectionLabel>
          <input value={name} onChange={e => setName(e.target.value)} style={{
            width: '100%', padding: '14px 16px',
            border: `1.5px solid ${C.divider}`, borderRadius: 12,
            fontSize: 16, fontFamily: fontUI, outline: 'none',
            background: C.surface, color: C.ink, marginLeft: 30, maxWidth: 'calc(100% - 30px)',
          }} />
        </div>

        {/* 02 Audience */}
        <div style={{ marginBottom: 32 }}>
          <SectionLabel num={2} sub="От этого зависит курс, темы заданий и тон подачи">Кому подбираем курс?</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginLeft: 30 }}>
            {AUDIENCES.map(a => (
              <Card key={a.id} selected={audience === a.id} onClick={() => setAudience(a.id)} padding="18px 16px">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 44, height: 44,
                    background: `linear-gradient(135deg, ${a.tone.from}33 0%, ${a.tone.to}22 100%)`,
                    borderRadius: 10,
                    display: 'grid', placeItems: 'center',
                  }}>
                    <Glyph kind={a.glyph} size={32} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: C.faint, fontFamily: fontMono }}>{a.age} · {a.lessons}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.4 }}>
                  {a.desc}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* 03 Mentor — conditional */}
        <div style={{
          marginBottom: 32,
          opacity: audienceObj?.needsMentor ? 1 : 0.5,
          pointerEvents: audienceObj?.needsMentor ? 'auto' : 'none',
          transition: 'opacity .3s ease',
        }}>
          <SectionLabel num={3} sub={audienceObj?.needsMentor
            ? "Кто будет тебя поддерживать и комментировать. Выбирай по стилю."
            : `Уже выбран: ${audienceObj?.mentor?.name} (${audienceObj?.mentor?.role}) — идёт с курсом ${audienceObj?.label.toLowerCase()}.`
          }>Наставник</SectionLabel>
          {audienceObj?.needsMentor ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginLeft: 30, maxWidth: 540 }}>
              {MENTORS.map(m => (
                <Card key={m.id} selected={mentor === m.id} onClick={() => setMentor(m.id)} padding="16px 18px">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{
                      width: 40, height: 40,
                      background: `${m.accent}22`, borderRadius: 10,
                      display: 'grid', placeItems: 'center',
                    }}>
                      <Glyph kind={m.glyph} size={32} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: C.faint, fontFamily: fontMono }}>{m.role}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.4 }}>{m.style}</div>
                </Card>
              ))}
            </div>
          ) : (
            <div style={{
              marginLeft: 30,
              padding: '14px 16px', background: C.surface,
              border: `1.5px dashed ${C.divider}`,
              borderRadius: 12,
              display: 'flex', alignItems: 'center', gap: 14,
              maxWidth: 540,
            }}>
              <div style={{
                width: 44, height: 44,
                background: `${audienceObj?.mentor?.accent}22`, borderRadius: 10,
                display: 'grid', placeItems: 'center',
              }}>
                <Glyph kind={audience === 'teen' ? 'teen' : 'kid'} size={36} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{audienceObj?.mentor?.name}</div>
                <div style={{ fontSize: 12, color: C.sub }}>{audienceObj?.mentor?.role} — подобран автоматически</div>
              </div>
            </div>
          )}
        </div>

        {/* 04 Keyboard */}
        <div style={{ marginBottom: 32 }}>
          <SectionLabel num={4} sub="Поменять можно позже в настройках">Какая у тебя клавиатура?</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginLeft: 30 }}>
            {KEYBOARDS.map(k => (
              <Card key={k.id} selected={keyboard === k.id} onClick={() => setKeyboard(k.id)} padding="16px 16px">
                <div style={{
                  height: 56, display: 'grid', placeItems: 'center',
                  background: 'rgba(0,0,0,0.025)', borderRadius: 8, marginBottom: 10,
                }}>
                  <Glyph kind={k.glyph} size={42} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{k.label}</div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{k.sub}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* 05 Language */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel num={5}>Язык обучения</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginLeft: 30, maxWidth: 440 }}>
            {LANGUAGES.map(l => (
              <Card key={l.id} selected={language === l.id} onClick={() => setLanguage(l.id)} padding="16px 18px">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontSize: 22, fontFamily: fontMono, fontWeight: 700 }}>{l.code}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{l.label}</span>
                </div>
                <div style={{ fontFamily: fontMono, fontSize: 11, color: C.faint, marginTop: 2 }}>{l.layout}</div>
              </Card>
            ))}
          </div>
        </div>

        <button style={{
          padding: '14px 32px',
          background: C.accent, color: '#fff', border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 600, fontFamily: fontUI, cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
          marginLeft: 30,
        }}>Начать обучение →</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT C — Smart auto-detect minimal (refined w/ portraits + gender detection)

function MinimalOnboarding({ defaultExpanded = false }) {
  const [name, setName] = useState('Анна');
  const [genderOverride, setGenderOverride] = useState(null);
  const [audience, setAudience] = useState('adult');
  const [mentor, setMentor] = useState('maxim');
  const [confirmedTech, setConfirmedTech] = useState(defaultExpanded);
  const [language, setLanguage] = useState('ru');
  const [keyboard, setKeyboard] = useState('classic');
  const [theme, setTheme] = useState('light');

  const detected = window.detectGender(name);
  const gender = genderOverride || detected || 'm';
  const audienceObj = AUDIENCES.find(a => a.id === audience);

  // Auto-pair mentor to opposite gender of user (convention) when name changes
  useEffect(() => {
    if (audience !== 'adult') return;
    // If user hasn't manually picked, suggest opposite-gender mentor
  }, [gender, audience]);

  // For teen/kid the mentor is fixed (Кнопыч/Клавочка)
  const fixedMentor = audience === 'teen' ? 'knopych' : audience === 'kid' ? 'klavochka' : null;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: C.bg, fontFamily: fontUI,
      overflowY: 'auto', color: C.ink,
    }}>
      <div style={{ padding: '28px 32px 32px', maxWidth: 720, margin: '0 auto' }}>
        {/* Logo only — no chatty subtitle, no auto-detect plate */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)',
            display: 'grid', placeItems: 'center',
            color: '#fff', fontFamily: fontMono, fontWeight: 700, fontSize: 14,
          }}>Ё</div>
          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>
            Тренажёр слепой печати
          </div>
        </div>

        {/* Name + gender autodetect */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>Как тебя зовут?</SectionLabel>
          <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
            <input
              value={name}
              onChange={e => { setName(e.target.value); setGenderOverride(null); }}
              placeholder="Имя"
              style={{
                flex: 1, padding: '14px 16px',
                border: `1.5px solid ${C.divider}`, borderRadius: 12,
                fontSize: 16, fontFamily: fontUI, outline: 'none',
                background: C.surface, color: C.ink,
              }}
            />
            <div style={{
              display: 'flex',
              background: C.surface,
              border: `1.5px solid ${C.divider}`,
              borderRadius: 12,
              padding: 4,
            }}>
              <button onClick={() => setGenderOverride('m')} style={{
                padding: '0 14px', borderRadius: 8, border: 'none',
                background: gender === 'm' ? '#dbeafe' : 'transparent',
                color: gender === 'm' ? '#1e40af' : C.sub,
                fontFamily: fontUI, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>М</button>
              <button onClick={() => setGenderOverride('f')} style={{
                padding: '0 14px', borderRadius: 8, border: 'none',
                background: gender === 'f' ? '#fce7f3' : 'transparent',
                color: gender === 'f' ? '#9d174d' : C.sub,
                fontFamily: fontUI, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Ж</button>
            </div>
          </div>
          {name && (
            <div style={{
              fontSize: 11, color: C.faint, marginTop: 6, fontFamily: fontMono,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>{genderOverride ? 'Выбрано вручную' : 'Определили по имени'}</span>
              <span>·</span>
              <span>{gender === 'f' ? 'женское' : 'мужское'}</span>
            </div>
          )}
        </div>

        {/* Audience */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel sub="От этого зависит сложность, темы и наставник">Кто будет учиться?</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {AUDIENCES.map(a => (
              <Card key={a.id} selected={audience === a.id} onClick={() => setAudience(a.id)} padding="16px 14px">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <UserPortrait audience={a.id} gender={gender} size={48} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: C.faint, fontFamily: fontMono }}>{a.age}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: C.sub, fontFamily: fontMono }}>{a.lessons}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* Mentor section */}
        <div style={{ marginBottom: 24 }}>
          {audience === 'adult' ? (
            <>
              <SectionLabel sub="Будет комментировать ошибки и поздравлять — выбирай по стилю">Кто будет наставником?</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {MENTORS.map(m => (
                  <Card key={m.id} selected={mentor === m.id} onClick={() => setMentor(m.id)} padding="14px 16px">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <MentorPortrait id={m.id} size={48} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: C.faint, fontFamily: fontMono, marginBottom: 4 }}>{m.role}</div>
                        <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.35 }}>{m.style}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <>
              <SectionLabel>Твой наставник</SectionLabel>
              <div style={{
                padding: '14px 16px', background: C.surface,
                border: `1.5px dashed ${C.divider}`,
                borderRadius: 12,
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <MentorPortrait id={fixedMentor} size={52} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{audienceObj?.mentor?.name}</div>
                  <div style={{ fontSize: 12, color: C.sub }}>{audienceObj?.mentor?.role} — идёт с курсом</div>
                </div>
              </div>
            </>
          )}
        </div>

        <button style={{
          padding: '14px 32px',
          background: C.accent, color: '#fff', border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 600, fontFamily: fontUI, cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
        }}>{name ? `Начать обучение, ${name} →` : 'Начать обучение →'}</button>
      </div>
    </div>
  );
}

// Wrapper that opens the expanded settings by default
function MinimalOnboardingExpanded() {
  // Re-render with a key that forces remount with confirmedTech=true via local state hack:
  // simpler — just expose a prop on MinimalOnboarding
  return <MinimalOnboarding defaultExpanded={true} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Canvas root

function App() {
  return (
    <DesignCanvas defaultZoom={0.55}>
      <DCSection id="recommended" title="Многошаговый визард (рекомендованный)" subtitle="Одно решение на экран. Понятный прогресс, низкая когнитивная нагрузка. Конкретный наставник появляется ТОЛЬКО если выбрали «Взрослый».">
        <DCArtboard id="wizard-audience" label="Шаг 02 · Кому учиться" width={720} height={880}>
          <WizardOnboarding stepOverride={1} />
        </DCArtboard>
        <DCArtboard id="wizard-mentor" label="Шаг 03 · Наставник (только для взрослых)" width={720} height={880}>
          <WizardOnboarding stepOverride={2} />
        </DCArtboard>
        <DCArtboard id="wizard-keyboard" label="Шаг 04 · Клавиатура" width={720} height={880}>
          <WizardOnboarding stepOverride={3} />
        </DCArtboard>
      </DCSection>

      <DCSection id="singlepage" title="Одностраничный (улучшенный)" subtitle="Прежняя структура, но: «Профиль» → «Кому учиться?», наставник выделен в отдельный раздел и показывается только для взрослых, для подростков/детей сразу автоматический.">
        <DCArtboard id="single-adult" label="Выбран: Взрослый — показан выбор наставника" width={720} height={1320}>
          <SinglePageOnboarding />
        </DCArtboard>
      </DCSection>

      <DCSection id="minimal" title="Минимальный · только важное" subtitle="Язык/клавиатуру/тему детектим тихо в фоне — не отвлекаем. Аватары меняются по полу (определяем из имени, можно поправить). Наставник: для взрослых — выбор Anna/Maxim, для подростка/ребёнка — Кнопыч/Клавочка фиксированы.">
        <DCArtboard id="minimal-female" label="Анна → ж · Взрослый" width={720} height={780}>
          <MinimalOnboarding />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
