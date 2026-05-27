// course.jsx — Course roadmap + lessons list screen
// Inspired by competitor's module breakdown, but with our design system

const { useState } = React;

const C = {
  bg: '#f5f4f0', surface: '#ffffff', ink: '#1a1a17',
  sub: 'rgba(26,26,23,0.6)', faint: 'rgba(26,26,23,0.4)',
  divider: 'rgba(0,0,0,0.08)',
  accent: '#3b82f6', accentBg: '#eef4ff',
  success: '#10b981', warm: '#f59e0b',
};
const fontUI = '"Manrope", ui-sans-serif, system-ui, sans-serif';
const fontMono = '"JetBrains Mono", ui-monospace, monospace';
const FP = { pink: '#ff7675', orange: '#fdcb6e', green: '#00b894', blue: '#74b9ff', indigo: '#0984e3', purple: '#a29bfe' };

const MODULES = [
  { id: 'm1', n: 1, label: 'Основной ряд',     range: '1–42',  accent: FP.blue,   pct: 0,  active: true },
  { id: 'm2', n: 2, label: 'Верхний ряд',      range: '43–50', accent: FP.green,  pct: 42 },
  { id: 'm3', n: 3, label: 'Нижний ряд',       range: '51–69', accent: FP.orange, pct: 50 },
  { id: 'm4', n: 4, label: 'Знаки препинания', range: '70–83', accent: FP.pink,   pct: 69 },
  { id: 'm5', n: 5, label: 'Цифры и закрепление', range: '84–100', accent: FP.purple, pct: 83 },
];

const LESSONS_M1 = [
  { n: 1, t: 'Главное — нащупать пупочки', d: 'Разминка с буквами среднего ряда', done: true,  acc: 96, stars: 5 },
  { n: 2, t: 'Вся надежда на указательный палец', d: 'Разминка с буквами среднего ряда', done: true,  acc: 94, stars: 5 },
  { n: 3, t: 'С одиннадцатой попытки', d: 'Разминка с буквами среднего ряда', done: true,  acc: 91, stars: 4 },
  { n: 4, t: 'Долбить и долбить', d: 'Разминка с буквами среднего ряда', done: true,  acc: 89, stars: 4 },
  { n: 5, t: 'Призываю к сознательности', d: 'Разминка с буквами среднего ряда', done: true,  acc: 92, stars: 4 },
  { n: 6, t: 'Вы попали на самый кончик?', d: 'Буквы а, в, о и л', next: true, locked: false },
  { n: 7, t: 'Не бейте клавиши — им больно', d: 'Буквосочетания и слова с буквами а, в, о, л, д', locked: true },
  { n: 8, t: 'Заключим пари?', d: 'Буква ы (безымянный палец левой руки)', locked: true },
  { n: 9, t: 'Пальцы в боевой готовности', d: 'Буква д и слова с ней', locked: true },
  { n: 10, t: 'Миксанатик Вам поможет', d: 'Буквы ф и ж (мизинцы) и их сочетания', locked: true },
];

// ─────────────────────────────────────────────────────────────────────────────

function Header() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(245,244,240,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${C.divider}`,
      padding: '12px 32px',
      display: 'flex', alignItems: 'center', gap: 24,
    }}>
      <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: C.ink }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          background: 'linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)',
          display: 'grid', placeItems: 'center',
          color: '#fff', fontFamily: fontMono, fontWeight: 700, fontSize: 12,
        }}>Ё</div>
        <div style={{ fontWeight: 800, fontSize: 14 }}>typing-trainer</div>
      </a>
      <div style={{ fontSize: 13, color: C.faint, fontFamily: fontMono, display: 'flex', gap: 8, alignItems: 'center' }}>
        <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Главная</a>
        <span>/</span>
        <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Русский курс</a>
        <span>/</span>
        <span style={{ color: C.ink, fontWeight: 600 }}>Уроки</span>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{
        display: 'flex', gap: 6, alignItems: 'center',
        padding: '4px 14px 4px 4px',
        background: C.surface, border: `1px solid ${C.divider}`, borderRadius: 999,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {window.UserPortrait
          ? <window.UserPortrait audience="adult" gender="f" size={28} />
          : <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fce7f3' }} />}
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>Анна</span>
      </div>
    </header>
  );
}

// Course summary strip
function CourseSummary() {
  return (
    <div style={{
      maxWidth: 1180, margin: '0 auto',
      padding: '28px 32px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <div style={{ fontFamily: fontMono, fontSize: 11, color: C.faint, letterSpacing: '0.06em', marginBottom: 6 }}>
            🇷🇺 РУССКИЙ КУРС · ЙЦУКЕН · 100 УРОКОВ
          </div>
          <h1 style={{ margin: 0, fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Все уроки курса
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: C.sub, maxWidth: 480, lineHeight: 1.5 }}>
            Десятипальцевый метод: от среднего ряда до полной раскладки. 5 модулей, 99 уроков, ~40 часов до сертификата.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end' }}>
          <Metric label="ОТКРЫТО" v="5" sub="из 100" />
          <Metric label="ПРОЙДЕНО" v="5" sub="100%" tone={C.success} />
          <Metric label="СРЕДНЯЯ" v="92" sub="% точность" />
          <button style={{
            padding: '12px 22px', marginBottom: 4,
            background: C.accent, color: '#fff',
            border: 'none', borderRadius: 11,
            fontSize: 14, fontWeight: 700, fontFamily: fontUI, cursor: 'pointer',
            boxShadow: '0 6px 14px rgba(59,130,246,0.3)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>Продолжить · урок 6 →</button>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, v, sub, tone = C.ink }) {
  return (
    <div>
      <div style={{ fontFamily: fontMono, fontSize: 10, color: C.faint, letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: tone, fontFamily: fontMono, letterSpacing: '-0.02em' }}>{v}</span>
        <span style={{ fontSize: 11, color: C.faint, fontFamily: fontMono }}>{sub}</span>
      </div>
    </div>
  );
}

// Roadmap — horizontal timeline of modules with progress
function Roadmap() {
  const totalLessons = 100;
  const doneLessons = 5;
  const donePct = (doneLessons / totalLessons) * 100;

  return (
    <div style={{
      maxWidth: 1180, margin: '0 auto',
      padding: '20px 32px 8px',
    }}>
      <div style={{
        background: C.surface,
        border: `1px solid ${C.divider}`,
        borderRadius: 18,
        padding: '26px 30px 22px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Roadmap курса</h3>
          <div style={{ fontFamily: fontMono, fontSize: 11.5, color: C.sub }}>
            {doneLessons}/{totalLessons} · {donePct.toFixed(1)}%
          </div>
        </div>

        {/* Module headers row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 14 }}>
          {MODULES.map(m => (
            <div key={m.id} style={{
              padding: '0 4px',
            }}>
              <div style={{ fontFamily: fontMono, fontSize: 10.5, color: C.faint, letterSpacing: '0.06em', marginBottom: 3 }}>
                МОДУЛЬ {m.n}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: m.active ? C.ink : C.sub, lineHeight: 1.25 }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* Progress track */}
        <div style={{ position: 'relative', height: 30, marginBottom: 4 }}>
          {/* Base bar */}
          <div style={{
            position: 'absolute', top: 12, left: 0, right: 0, height: 6,
            background: C.divider, borderRadius: 999,
          }} />
          {/* Done fill */}
          <div style={{
            position: 'absolute', top: 12, left: 0, height: 6,
            width: `${donePct}%`,
            background: 'linear-gradient(90deg, #74b9ff 0%, #a29bfe 100%)',
            borderRadius: 999,
            boxShadow: '0 0 12px rgba(116,185,255,0.5)',
          }} />
          {/* Module dividers + range pills */}
          {MODULES.map((m, i) => {
            // Position pill at center of segment
            const segStart = m.pct;
            const segEnd = i + 1 < MODULES.length ? MODULES[i + 1].pct : 100;
            const center = (segStart + segEnd) / 2;
            return (
              <React.Fragment key={m.id}>
                {/* Divider tick at module start */}
                {i > 0 && (
                  <div style={{
                    position: 'absolute', top: 8, left: `${m.pct}%`,
                    width: 2, height: 14, background: '#fff',
                    borderRadius: 1, transform: 'translateX(-1px)',
                  }} />
                )}
                {/* Range pill */}
                <div style={{
                  position: 'absolute', top: 22, left: `${center}%`,
                  transform: 'translateX(-50%)',
                  padding: '3px 10px',
                  background: m.active ? m.accent : '#e9e6dd',
                  color: m.active ? '#fff' : C.sub,
                  fontSize: 10, fontWeight: 700, fontFamily: fontMono,
                  borderRadius: 999, whiteSpace: 'nowrap',
                  letterSpacing: '0.02em',
                  border: m.active ? 'none' : `1px solid transparent`,
                  boxShadow: m.active ? `0 4px 10px ${m.accent}55` : 'none',
                }}>📖 {m.range}</div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Axis labels */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: 26,
          fontFamily: fontMono, fontSize: 10, color: C.faint,
        }}>
          <span>0%</span>
          <span>15%</span>
          <span>25%</span>
          <span>40%</span>
          <span>70%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}

// Module + lessons
function ModuleCard({ module, lessons, expanded, onToggle }) {
  return (
    <div style={{
      background: expanded ? '#f1efe7' : '#ecebe5',
      border: `1px solid ${C.divider}`,
      borderRadius: 14,
      padding: 4,
      marginBottom: 12,
      transition: 'background .15s ease',
    }}>
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px',
        background: 'transparent', border: 'none', cursor: 'pointer',
        textAlign: 'left', fontFamily: fontUI,
      }}>
        <div style={{
          padding: '6px 12px',
          background: '#1a1a17', color: '#fff',
          borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: fontMono,
          letterSpacing: '0.04em',
        }}>МОДУЛЬ {module.n}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>{module.label}</div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: fontMono, fontSize: 11, color: C.sub,
        }}>
          {module.active && (
            <span style={{
              padding: '3px 9px',
              background: `${module.accent}22`, color: module.accent,
              borderRadius: 999, fontWeight: 700, letterSpacing: '0.04em',
            }}>СЕЙЧАС</span>
          )}
          <span>Уроки {module.range}</span>
        </div>
        <span style={{
          fontSize: 14, color: C.faint,
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform .2s ease',
        }}>▾</span>
      </button>

      {expanded && lessons && (
        <div style={{
          background: C.surface, borderRadius: 11,
          margin: '0 4px 4px', padding: '8px 0',
        }}>
          {/* Intro rows */}
          <SpecialRow icon="📖" label="История курса" sub="История создания тренажёра" />
          <SpecialRow icon="🆕" label="Интерактивная справка" sub="Что такое слепая печать" badge="NEW" />
          <div style={{ height: 1, background: C.divider, margin: '6px 18px' }} />
          {/* Section header */}
          <div style={{
            padding: '12px 18px 8px',
            fontSize: 12, fontWeight: 700, color: C.success,
            fontFamily: fontMono, letterSpacing: '0.06em',
          }}>ВСТУПЛЕНИЕ</div>
          {lessons.map(l => <LessonRow key={l.n} l={l} accent={module.accent} />)}
        </div>
      )}
    </div>
  );
}

function SpecialRow({ icon, label, sub, badge }) {
  return (
    <button style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
      padding: '11px 18px',
      background: 'transparent', border: 'none', cursor: 'pointer',
      textAlign: 'left', fontFamily: fontUI,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: C.bg, display: 'grid', placeItems: 'center',
        fontSize: 14,
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: C.success, display: 'flex', alignItems: 'center', gap: 8 }}>
          {label}
          {badge && (
            <span style={{
              padding: '1px 7px', borderRadius: 4,
              background: '#f97316', color: '#fff',
              fontSize: 9.5, fontFamily: fontMono, fontWeight: 700, letterSpacing: '0.04em',
            }}>{badge}</span>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2 }}>{sub}</div>
      </div>
    </button>
  );
}

function LessonRow({ l, accent }) {
  const titleColor = l.done ? C.success : l.next ? accent : l.locked ? C.faint : C.ink;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '10px 18px',
      background: l.next ? `${accent}11` : 'transparent',
      borderLeft: l.next ? `3px solid ${accent}` : '3px solid transparent',
      transition: 'background .12s ease',
      cursor: l.locked ? 'not-allowed' : 'pointer',
      opacity: l.locked ? 0.55 : 1,
    }}>
      {/* Number badge */}
      <div style={{
        width: 30, height: 30, borderRadius: 7,
        background: l.done ? C.success : l.next ? accent : '#1a1a17',
        color: '#fff', fontFamily: fontMono, fontWeight: 700, fontSize: 12,
        display: 'grid', placeItems: 'center', flexShrink: 0,
      }}>
        {l.done
          ? <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8L7 12L13 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          : l.locked
          ? <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><rect x="3" y="6" width="8" height="6" rx="1" fill="#fff" /><path d="M5 6V4a2 2 0 014 0v2" stroke="#fff" strokeWidth="1.4" fill="none" /></svg>
          : String(l.n).padStart(2, '0')}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: l.next ? 700 : 600, color: titleColor, display: 'flex', alignItems: 'center', gap: 8 }}>
          {l.t}
          {l.next && <span style={{ fontSize: 9.5, padding: '2px 7px', background: accent, color: '#fff', borderRadius: 999, fontWeight: 700, fontFamily: fontMono, letterSpacing: '0.04em' }}>СЕЙЧАС</span>}
        </div>
        <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2 }}>{l.d}</div>
      </div>
      {/* Stars / status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        {l.done && (
          <>
            <Stars n={l.stars} />
            <span style={{ fontSize: 11, color: C.faint, fontFamily: fontMono, width: 36, textAlign: 'right' }}>{l.acc}%</span>
          </>
        )}
        {l.next && (
          <button style={{
            padding: '6px 14px',
            background: accent, color: '#fff',
            border: 'none', borderRadius: 7,
            fontSize: 12, fontWeight: 700, fontFamily: fontUI, cursor: 'pointer',
          }}>Начать →</button>
        )}
      </div>
    </div>
  );
}

function Stars({ n }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M7 1.5L8.5 5L12 5.5L9.5 8L10 11.5L7 9.8L4 11.5L4.5 8L2 5.5L5.5 5Z"
            fill={i <= n ? '#f59e0b' : '#e5e3da'}
            stroke={i <= n ? '#d97706' : '#d6d3c8'}
            strokeWidth="0.8" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  );
}

// Grading legend
function GradingLegend() {
  const items = [
    { stars: 5, color: '#f59e0b', label: 'Превосходно', desc: 'Без ошибок · 5.0 баллов' },
    { stars: 5, color: '#eab308', label: 'Отлично',    desc: 'Без ошибок · оценка ниже 5.0' },
    { stars: 4, color: '#f59e0b', label: 'Хорошо',     desc: '1–2 ошибки' },
    { stars: 3, color: '#f97316', label: 'Можно лучше', desc: '3–5 ошибок' },
    { stars: 2, color: '#ef4444', label: 'Удовлетворительно', desc: '6–10 ошибок · повтори' },
    { stars: 1, color: '#dc2626', label: 'Плохо',      desc: 'много ошибок · повтори' },
  ];
  return (
    <div style={{
      maxWidth: 1180, margin: '24px auto 60px',
      padding: '0 32px',
    }}>
      <div style={{
        background: C.surface, border: `1px solid ${C.divider}`,
        borderRadius: 18, padding: 24,
      }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Оценка уроков</h3>
        <p style={{ margin: '0 0 18px', fontSize: 12.5, color: C.sub, lineHeight: 1.5 }}>
          Каждый урок оценивается звёздочками. Чтобы получить сертификат — нужна средняя скорость 120 знаков/мин и средний балл не ниже 4.0.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {items.map((it, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              background: C.bg, borderRadius: 9,
            }}>
              <Stars n={it.stars} />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{it.label}</div>
                <div style={{ fontSize: 10.5, color: C.faint, fontFamily: fontMono }}>{it.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Page
function CoursePage() {
  const [openModule, setOpenModule] = useState('m1');
  return (
    <div style={{ background: C.bg, minHeight: '100%', fontFamily: fontUI }}>
      <Header />
      <CourseSummary />
      <Roadmap />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '20px 32px 0' }}>
        {MODULES.map(m => (
          <ModuleCard
            key={m.id}
            module={m}
            lessons={m.id === 'm1' ? LESSONS_M1 : null}
            expanded={openModule === m.id}
            onToggle={() => setOpenModule(openModule === m.id ? null : m.id)}
          />
        ))}
      </div>
      <GradingLegend />
    </div>
  );
}

function App() {
  return (
    <DesignCanvas defaultZoom={0.5}>
      <DCSection id="course" title="Дорожная карта курса · все уроки" subtitle="Сверху — roadmap с 5 модулями и текущим положением. Внизу — модули как accordion'ы, активный (Модуль 1) раскрыт со списком 10 уроков: 5 пройденных со звёздами/точностью, текущий (#6) выделен, остальные заблокированы (paywall).">
        <DCArtboard id="course-main" label="Roadmap + лента уроков · Модуль 1 раскрыт" width={1240} height={1860}>
          <CoursePage />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
