// dashboard.jsx — Authorized user dashboard (личный кабинет)
// Russian course default + language switcher in top nav (not body list)

const { useState } = React;

const D = {
  bg: '#f5f4f0',
  bgAlt: '#ecebe5',
  surface: '#ffffff',
  ink: '#1a1a17',
  sub: 'rgba(26,26,23,0.6)',
  faint: 'rgba(26,26,23,0.4)',
  divider: 'rgba(0,0,0,0.08)',
  accent: '#3b82f6',
  accentBg: '#eef4ff',
  success: '#10b981',
  warm: '#f59e0b',
};

const fontUI = '"Manrope", ui-sans-serif, system-ui, sans-serif';
const fontMono = '"JetBrains Mono", ui-monospace, monospace';

const FP = {
  pink: '#ff7675', orange: '#fdcb6e', green: '#00b894',
  blue: '#74b9ff', indigo: '#0984e3', purple: '#a29bfe',
};

const LANGUAGES = [
  { id: 'ru', code: 'RU', flag: '🇷🇺', label: 'Русский',    layout: 'ЙЦУКЕН', lessons: 99, progress: 12, active: true },
  { id: 'en', code: 'EN', flag: '🇬🇧', label: 'English',     layout: 'QWERTY', lessons: 100, progress: 0 },
  { id: 'de', code: 'DE', flag: '🇩🇪', label: 'Deutsch',     layout: 'QWERTZ', lessons: 80, progress: 0 },
  { id: 'fr', code: 'FR', flag: '🇫🇷', label: 'Français',    layout: 'AZERTY', lessons: 80, progress: 0 },
  { id: 'es', code: 'ES', flag: '🇪🇸', label: 'Español',     layout: 'QWERTY', lessons: 70, progress: 0 },
  { id: 'num', code: '0-9', flag: '🔢', label: 'Цифры', layout: 'Numpad',    lessons: 20, progress: 0 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Header

function Header({ activeLang = 'ru' }) {
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const active = LANGUAGES.find(l => l.id === activeLang);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(245,244,240,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${D.divider}`,
      padding: '14px 32px',
      display: 'flex', alignItems: 'center', gap: 28,
    }}>
      <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: D.ink }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)',
          display: 'grid', placeItems: 'center',
          color: '#fff', fontFamily: fontMono, fontWeight: 700, fontSize: 13,
          boxShadow: '0 3px 10px rgba(116,185,255,0.3)',
        }}>Ё</div>
        <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em' }}>typing-trainer</div>
      </a>

      {/* Primary nav */}
      <nav style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
        {[
          { id: 'home', label: 'Главная', active: true },
          { id: 'lessons', label: 'Уроки' },
          { id: 'speed', label: 'Тренажёр скорости' },
          { id: 'games', label: 'Игры' },
          { id: 'stats', label: 'Статистика' },
        ].map(it => (
          <a key={it.id} href="#" style={{
            padding: '8px 14px', borderRadius: 8,
            background: it.active ? 'rgba(0,0,0,0.05)' : 'transparent',
            color: it.active ? D.ink : D.sub,
            fontSize: 13.5, fontWeight: it.active ? 700 : 500,
            textDecoration: 'none', fontFamily: fontUI,
          }}>{it.label}</a>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Language switcher */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => { setLangOpen(!langOpen); setProfileOpen(false); }} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: D.surface, border: `1px solid ${D.divider}`,
          borderRadius: 10, padding: '8px 12px',
          cursor: 'pointer', fontFamily: fontUI,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>{active.flag}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: D.ink, fontFamily: fontMono }}>{active.code}</span>
          <span style={{ fontSize: 11, color: D.faint, fontFamily: fontMono }}>{active.layout}</span>
          <svg width="11" height="11" viewBox="0 0 12 12" style={{ opacity: 0.5 }}>
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </button>
        {langOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
            width: 280,
            background: D.surface,
            border: `1px solid ${D.divider}`,
            borderRadius: 12,
            boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
            padding: 6, zIndex: 20,
          }}>
            <div style={{ padding: '10px 12px 6px', fontSize: 11, color: D.faint, fontFamily: fontMono, letterSpacing: '0.06em' }}>
              КУРС ОБУЧЕНИЯ
            </div>
            {LANGUAGES.map(l => (
              <button key={l.id} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', background: l.id === activeLang ? D.accentBg : 'transparent',
                border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                fontFamily: fontUI,
              }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>{l.flag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: l.id === activeLang ? 700 : 600, color: D.ink }}>
                    {l.label} <span style={{ fontFamily: fontMono, color: D.faint, fontWeight: 500, fontSize: 11, marginLeft: 4 }}>{l.layout}</span>
                  </div>
                  <div style={{ fontSize: 11, color: D.faint, fontFamily: fontMono }}>
                    {l.progress > 0 ? `${l.progress}/${l.lessons} уроков · ${Math.round((l.progress / l.lessons) * 100)}%` : `${l.lessons} уроков`}
                  </div>
                </div>
                {l.id === activeLang && (
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: D.accent, display: 'grid', placeItems: 'center',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
            <div style={{ height: 1, background: D.divider, margin: '6px 0' }} />
            <button style={{
              width: '100%', padding: '10px 12px', background: 'transparent',
              border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
              fontSize: 13, color: D.accent, fontWeight: 600, fontFamily: fontUI,
            }}>+ Добавить ещё язык</button>
          </div>
        )}
      </div>

      {/* Profile */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => { setProfileOpen(!profileOpen); setLangOpen(false); }} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: D.surface, border: `1px solid ${D.divider}`,
          borderRadius: 999, padding: '4px 14px 4px 4px',
          cursor: 'pointer', fontFamily: fontUI,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          {window.UserPortrait
            ? <window.UserPortrait audience="adult" gender="f" size={32} />
            : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fce7f3' }} />}
          <span style={{ fontSize: 13.5, fontWeight: 600, color: D.ink }}>Анна</span>
          <svg width="11" height="11" viewBox="0 0 12 12" style={{ marginLeft: 2, opacity: 0.5 }}>
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </button>
        {profileOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
            width: 240,
            background: D.surface,
            border: `1px solid ${D.divider}`,
            borderRadius: 12,
            boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
            padding: 6, fontFamily: fontUI, zIndex: 20,
          }}>
            <div style={{ padding: '12px 14px 10px', borderBottom: `1px solid ${D.divider}`, marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: D.ink }}>Анна Иванова</div>
              <div style={{ fontSize: 12, color: D.faint, fontFamily: fontMono }}>anna@example.com</div>
            </div>
            {[
              { icon: '◐', label: 'Мой профиль' },
              { icon: '🏆', label: 'Достижения' },
              { icon: '⚙', label: 'Настройки' },
              { icon: '?', label: 'Помощь' },
            ].map((it, i) => (
              <button key={i} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', background: 'transparent', border: 'none',
                fontSize: 13.5, fontWeight: 500, color: D.ink,
                borderRadius: 8, cursor: 'pointer', textAlign: 'left', fontFamily: fontUI,
              }}>
                <span style={{ fontFamily: fontMono, color: D.faint, fontSize: 14, width: 16 }}>{it.icon}</span>
                <span>{it.label}</span>
              </button>
            ))}
            <div style={{ height: 1, background: D.divider, margin: '6px 0' }} />
            <button style={{
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
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Welcome strip

function WelcomeStrip() {
  return (
    <div style={{
      padding: '28px 32px 12px',
      maxWidth: 1280, margin: '0 auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: fontMono, fontSize: 11, color: D.faint, letterSpacing: '0.06em', marginBottom: 6 }}>
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
          </div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>
            С возвращением, <span style={{
              background: 'linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Анна</span>!
          </h1>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px',
          background: '#fef3c7', border: '1px solid #fde68a',
          borderRadius: 999, fontFamily: fontMono, fontSize: 12.5, fontWeight: 700, color: '#92400e',
        }}>
          🔥 Серия 5 дней
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Current course card

function CourseCard() {
  const progress = 12;
  const total = 99;
  const pct = (progress / total) * 100;
  return (
    <div style={{
      background: D.surface,
      border: `1px solid ${D.divider}`,
      borderRadius: 20,
      padding: 28,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background swatch */}
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 240, height: 240, borderRadius: '50%',
        background: `radial-gradient(circle, ${FP.blue}15 0%, transparent 70%)`,
      }} />

      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, color: D.faint, fontFamily: fontMono, letterSpacing: '0.06em', marginBottom: 6 }}>
              ТЕКУЩИЙ КУРС
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 24 }}>🇷🇺</span>
              <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Русский курс</h2>
              <span style={{
                fontSize: 10, fontFamily: fontMono, fontWeight: 700,
                padding: '3px 8px', borderRadius: 999,
                background: D.accentBg, color: D.accent, letterSpacing: '0.04em',
              }}>ЙЦУКЕН</span>
            </div>
            <div style={{ fontSize: 13.5, color: D.sub }}>
              Десятипальцевый метод набора · 99 уроков
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: fontMono, fontWeight: 800, fontSize: 32, color: D.ink, letterSpacing: '-0.02em' }}>
              {Math.round(pct)}%
            </div>
            <div style={{ fontSize: 11.5, color: D.faint, fontFamily: fontMono }}>{progress}/{total} уроков</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          height: 8, background: D.divider, borderRadius: 999, marginBottom: 22, overflow: 'hidden',
        }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: 'linear-gradient(90deg, #74b9ff 0%, #a29bfe 100%)',
            borderRadius: 999,
            boxShadow: '0 0 12px rgba(116,185,255,0.5)',
          }} />
        </div>

        {/* Next lesson */}
        <div style={{
          background: 'linear-gradient(135deg, #fbf9f3 0%, #f5f4f0 100%)',
          border: `1px solid ${D.divider}`,
          borderRadius: 14,
          padding: 18,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12,
            background: 'linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)',
            display: 'grid', placeItems: 'center',
            color: '#fff', fontFamily: fontMono, fontWeight: 800, fontSize: 18,
          }}>13</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: D.faint, fontFamily: fontMono, letterSpacing: '0.06em' }}>СЛЕДУЮЩИЙ УРОК</div>
            <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>Буквы Х, Ъ, Э</div>
            <div style={{ fontSize: 12.5, color: D.sub, marginTop: 2 }}>~ 8 минут · средняя сложность</div>
          </div>
          <button style={{
            padding: '12px 22px',
            background: D.accent, color: '#fff',
            border: 'none', borderRadius: 11,
            fontSize: 14, fontWeight: 700, fontFamily: fontUI,
            cursor: 'pointer',
            boxShadow: '0 6px 14px rgba(59,130,246,0.3)',
          }}>Продолжить →</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats card

function StatsCard() {
  const stats = [
    { l: 'Скорость', v: '42', sub: 'зн/мин', trend: '+8' },
    { l: 'Точность', v: '94', sub: '%', trend: '+2' },
    { l: 'Время', v: '6.2', sub: 'часов', trend: null },
    { l: 'Серия', v: '5', sub: 'дней', trend: null },
  ];
  return (
    <div style={{
      background: D.surface,
      border: `1px solid ${D.divider}`,
      borderRadius: 18,
      padding: 22,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: D.ink }}>Статистика</h3>
        <a href="#" style={{ fontSize: 11.5, color: D.accent, fontWeight: 600, textDecoration: 'none', fontFamily: fontMono }}>Подробнее →</a>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ padding: '12px 14px', background: D.bg, borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: D.faint, fontFamily: fontMono, letterSpacing: '0.04em', marginBottom: 4 }}>{s.l.toUpperCase()}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 24, fontWeight: 800, fontFamily: fontMono, letterSpacing: '-0.02em' }}>{s.v}</span>
              <span style={{ fontSize: 11, color: D.sub, fontFamily: fontMono }}>{s.sub}</span>
              {s.trend && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: 10.5, fontWeight: 700, color: D.success, fontFamily: fontMono,
                }}>{s.trend}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mentor card

function MentorCard() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      border: `1px solid #fde68a`,
      borderRadius: 18,
      padding: 20,
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      {window.MentorPortrait
        ? <window.MentorPortrait id="maxim" size={48} />
        : <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff' }} />}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: '#92400e', fontFamily: fontMono, letterSpacing: '0.06em', fontWeight: 700 }}>
          МАКСИМ · НАСТАВНИК
        </div>
        <div style={{ fontSize: 13.5, color: '#451a03', lineHeight: 1.4, marginTop: 4 }}>
          «Сегодня закрепим Ж и Э — самые лживые клавиши русской раскладки. Готова?»
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Achievements row

function AchievementsRow() {
  const items = [
    { id: 'first', label: 'Первый урок', earned: true, icon: '🎯' },
    { id: 'week', label: '7 дней подряд', earned: true, icon: '📅' },
    { id: '40wpm', label: '40 зн/мин', earned: true, icon: '⚡' },
    { id: '95', label: '95% точность', earned: false, icon: '🎲', progress: 0.94 },
    { id: 'half', label: 'Половина курса', earned: false, icon: '🏔', progress: 0.24 },
    { id: 'finish', label: 'Завершить курс', earned: false, icon: '🏆', progress: 0.12 },
  ];
  return (
    <div style={{
      background: D.surface, border: `1px solid ${D.divider}`,
      borderRadius: 18, padding: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Достижения</h3>
        <div style={{ fontSize: 12, color: D.faint, fontFamily: fontMono }}>3/24 получено</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
        {items.map(a => (
          <div key={a.id} style={{
            padding: '14px 12px',
            background: a.earned ? D.bg : 'transparent',
            border: `1px solid ${a.earned ? D.divider : 'transparent'}`,
            borderRadius: 12,
            textAlign: 'center',
            opacity: a.earned ? 1 : 0.55,
          }}>
            <div style={{
              fontSize: 30, marginBottom: 8,
              filter: a.earned ? 'none' : 'grayscale(1)',
            }}>{a.icon}</div>
            <div style={{
              fontSize: 11, fontWeight: 600, color: D.ink, lineHeight: 1.3,
            }}>{a.label}</div>
            {a.progress !== undefined && (
              <div style={{ marginTop: 6, height: 3, background: D.divider, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${a.progress * 100}%`, height: '100%', background: D.accent }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick actions / Games

function QuickActions() {
  const items = [
    { id: 'speed',  label: 'Тренажёр скорости', sub: 'индивидуальные упражнения', icon: '⚡', tone: FP.orange },
    { id: 'games',  label: 'Игры',              sub: '9 мини-игр на раскладку',   icon: '🎮', tone: FP.green },
    { id: 'speed-test', label: 'Тест скорости', sub: 'проверь себя за 1 минуту',  icon: '⏱', tone: FP.blue },
    { id: 'cert', label: 'Сертификат', sub: 'после прохождения курса', icon: '🏅', tone: FP.purple },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {items.map(it => (
        <button key={it.id} style={{
          background: D.surface, border: `1px solid ${D.divider}`,
          borderRadius: 14, padding: '16px 18px',
          textAlign: 'left', cursor: 'pointer', fontFamily: fontUI,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `${it.tone}22`,
            display: 'grid', placeItems: 'center',
            fontSize: 22,
          }}>{it.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: D.ink }}>{it.label}</div>
            <div style={{ fontSize: 11.5, color: D.sub }}>{it.sub}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lesson list (recent + upcoming)

function LessonList() {
  const lessons = [
    { n: 11, t: 'Цифры 1–5',    f: 'blue',  done: true,  acc: 96, time: '7:20' },
    { n: 12, t: 'Цифры 6–0',    f: 'indigo', done: true,  acc: 91, time: '8:45' },
    { n: 13, t: 'Буквы Х, Ъ, Э', f: 'pink', next: true },
    { n: 14, t: 'Спецсимволы',  f: 'pink', locked: true },
    { n: 15, t: 'Длинные слова', f: 'green', locked: true },
  ];
  return (
    <div style={{
      background: D.surface, border: `1px solid ${D.divider}`,
      borderRadius: 18, padding: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Ближайшие уроки</h3>
        <a href="#" style={{ fontSize: 12, color: D.accent, fontWeight: 600, textDecoration: 'none', fontFamily: fontMono }}>Все 99 →</a>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {lessons.map(l => (
          <div key={l.n} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 14px',
            background: l.next ? D.accentBg : 'transparent',
            border: l.next ? `1.5px solid ${D.accent}` : `1px solid transparent`,
            borderRadius: 12,
            opacity: l.locked ? 0.5 : 1,
            transition: 'all .15s ease',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: l.done ? D.success : l.next ? FP[l.f] : D.divider,
              display: 'grid', placeItems: 'center',
              color: '#fff', fontFamily: fontMono, fontWeight: 700, fontSize: 13,
            }}>
              {l.done
                ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L7 12L13 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                : l.locked
                ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="6" width="8" height="6" rx="1" fill="#fff" /><path d="M5 6V4a2 2 0 014 0v2" stroke="#fff" strokeWidth="1.5" fill="none" /></svg>
                : l.n}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: l.next ? 700 : 600, color: D.ink }}>
                {l.t}
                {l.next && <span style={{ marginLeft: 8, fontSize: 10, fontFamily: fontMono, fontWeight: 700, color: D.accent, letterSpacing: '0.04em' }}>· СЕЙЧАС</span>}
              </div>
              {l.done && (
                <div style={{ fontSize: 11.5, color: D.sub, fontFamily: fontMono }}>
                  Урок {l.n} · точность {l.acc}% · {l.time}
                </div>
              )}
              {!l.done && !l.locked && (
                <div style={{ fontSize: 11.5, color: D.sub }}>Урок {l.n}</div>
              )}
              {l.locked && (
                <div style={{ fontSize: 11.5, color: D.faint }}>Откроется после урока {l.n - 1}</div>
              )}
            </div>
            {l.next && (
              <button style={{
                padding: '7px 14px', background: D.accent, color: '#fff',
                border: 'none', borderRadius: 8,
                fontSize: 12, fontWeight: 700, fontFamily: fontUI, cursor: 'pointer',
              }}>Начать →</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page composition

function Dashboard() {
  return (
    <div style={{
      width: '100%', minHeight: '100%',
      background: D.bg, color: D.ink, fontFamily: fontUI,
    }}>
      <Header activeLang="ru" />
      <WelcomeStrip />
      <main style={{
        padding: '8px 32px 60px',
        maxWidth: 1280, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)',
        gap: 20,
      }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <CourseCard />
          <LessonList />
          <QuickActions />
        </div>
        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <MentorCard />
          <StatsCard />
          <AchievementsRow />
        </div>
      </main>
    </div>
  );
}

// Demo of the language switcher dropdown open
function DashboardLangOpen() {
  // We force the lang menu open by mounting then triggering click
  const ref = React.useRef(null);
  React.useEffect(() => {
    const t = setTimeout(() => {
      const btn = ref.current?.querySelector('button[style*="layout"]')
                ?? [...ref.current?.querySelectorAll('button') ?? []].find(b => b.textContent.includes('ЙЦУКЕН'));
      if (btn) btn.click();
    }, 80);
    return () => clearTimeout(t);
  }, []);
  return <div ref={ref}><Dashboard /></div>;
}

function App() {
  return (
    <DesignCanvas defaultZoom={0.5}>
      <DCSection id="dash" title="Личный кабинет · после авторизации" subtitle="Русский курс выбран по умолчанию. В шапке: переключатель языка/раскладки (RU активен) + профиль пользователя. Никаких списков курсов в теле — выбор языка только через top-nav.">
        <DCArtboard id="dashboard-main" label="Главный экран · русский курс активен" width={1280} height={1480}>
          <Dashboard />
        </DCArtboard>
        <DCArtboard id="dashboard-lang-open" label="Переключатель языка раскрыт" width={1280} height={1480}>
          <DashboardLangOpen />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
