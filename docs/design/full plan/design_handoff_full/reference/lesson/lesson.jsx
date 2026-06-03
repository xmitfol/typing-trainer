// lesson.jsx — Lesson reading experience with inline typing exercises
// + User profile page with language courses

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
const fontSerif = '"Source Serif 4", "Charter", "Georgia", serif';
const FP = { pink: '#ff7675', orange: '#fdcb6e', green: '#00b894', blue: '#74b9ff', indigo: '#0984e3', purple: '#a29bfe' };

// ─────────────────────────────────────────────────────────────────────────────
// Lesson top bar — sticky

function LessonTopBar({ progress = 32, lessonN = 1, total = 99 }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(245,244,240,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${C.divider}`,
      padding: '12px 32px',
      display: 'flex', alignItems: 'center', gap: 22,
    }}>
      <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: C.ink }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          background: 'linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)',
          display: 'grid', placeItems: 'center',
          color: '#fff', fontFamily: fontMono, fontWeight: 700, fontSize: 12,
        }}>Ё</div>
      </a>
      <div style={{ fontFamily: fontMono, fontSize: 11.5, color: C.sub, display: 'flex', gap: 8, alignItems: 'center' }}>
        <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Русский курс</a>
        <span style={{ color: C.faint }}>/</span>
        <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Все уроки</a>
        <span style={{ color: C.faint }}>/</span>
        <span style={{ color: C.ink, fontWeight: 700 }}>Урок {lessonN}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, maxWidth: 380 }}>
        <span style={{ fontFamily: fontMono, fontSize: 11, color: C.faint }}>{lessonN}/{total}</span>
        <div style={{ flex: 1, height: 5, background: C.divider, borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: 'linear-gradient(90deg, #74b9ff 0%, #a29bfe 100%)',
            borderRadius: 999, transition: 'width .3s ease',
          }} />
        </div>
        <span style={{ fontFamily: fontMono, fontSize: 11, color: C.faint }}>{progress}%</span>
      </div>
      {/* Mini live metrics */}
      <div style={{ display: 'flex', gap: 14, fontFamily: fontMono, fontSize: 11.5, color: C.sub }}>
        <span><span style={{ color: C.faint, marginRight: 4 }}>WPM</span><b style={{ color: C.ink, fontWeight: 700 }}>42</b></span>
        <span><span style={{ color: C.faint, marginRight: 4 }}>точность</span><b style={{ color: C.success, fontWeight: 700 }}>94%</b></span>
        <span><span style={{ color: C.faint, marginRight: 4 }}>время</span><b style={{ color: C.ink, fontWeight: 700 }}>03:14</b></span>
      </div>
      <button style={{
        background: 'transparent', border: `1.5px solid ${C.divider}`,
        padding: '7px 12px', borderRadius: 8,
        fontSize: 12.5, fontWeight: 600, color: C.ink, fontFamily: fontUI,
        cursor: 'pointer',
      }}>Список уроков</button>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lesson title block

function LessonTitle({ moduleN, lessonN, title, subtitle }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '4px 12px', marginBottom: 14,
        background: '#1a1a17', color: '#fff',
        borderRadius: 999,
        fontSize: 11, fontWeight: 700, fontFamily: fontMono, letterSpacing: '0.04em',
      }}>МОДУЛЬ {moduleN} · УРОК {lessonN}</div>
      <h1 style={{
        margin: 0, fontFamily: fontSerif, fontSize: 44, fontWeight: 700,
        lineHeight: 1.1, letterSpacing: '-0.02em', color: C.ink,
      }}>{title}</h1>
      {subtitle && (
        <p style={{
          margin: '14px 0 0', fontSize: 17, color: C.sub, lineHeight: 1.5,
          fontFamily: fontSerif, fontStyle: 'italic',
        }}>{subtitle}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Author intro card

function MentorIntro({ mentorId = 'maxim', name, role = 'ВИРТУАЛЬНЫЙ НАСТАВНИК', quote }) {
  const accent = mentorId === 'anna' ? '#fce7f3'
              : mentorId === 'maxim' ? '#dbeafe'
              : mentorId === 'knopych' ? '#d1fae5'
              : '#fef3c7';
  const border = mentorId === 'anna' ? '#fbcfe8'
              : mentorId === 'maxim' ? '#bfdbfe'
              : mentorId === 'knopych' ? '#a7f3d0'
              : '#fde68a';
  const ink = mentorId === 'anna' ? '#831843'
           : mentorId === 'maxim' ? '#1e3a8a'
           : mentorId === 'knopych' ? '#064e3b'
           : '#451a03';
  const subInk = mentorId === 'anna' ? '#9d174d'
              : mentorId === 'maxim' ? '#1e40af'
              : mentorId === 'knopych' ? '#047857'
              : '#92400e';
  return (
    <div style={{
      display: 'flex', gap: 18, alignItems: 'flex-start',
      background: accent,
      border: `1px solid ${border}`,
      borderRadius: 16,
      padding: 22,
      marginBottom: 32,
      position: 'relative',
    }}>
      <div style={{ flexShrink: 0 }}>
        {window.MentorPortrait
          ? <window.MentorPortrait id={mentorId} size={64} />
          : <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff' }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: ink }}>{name}</span>
          <span style={{ fontSize: 10.5, color: subInk, fontFamily: fontMono, letterSpacing: '0.06em' }}>· {role}</span>
        </div>
        <div style={{ fontSize: 14, color: ink, lineHeight: 1.55, fontFamily: fontSerif }}>
          {quote}
        </div>
      </div>
      {/* Speech bubble pointer */}
      <div style={{
        position: 'absolute', left: 70, top: -1,
        width: 0, height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderBottom: `8px solid ${border}`,
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Narrative paragraph

function P({ children, lead, drop }) {
  if (drop) {
    const [first, ...rest] = String(children).split('');
    return (
      <p style={{
        margin: '0 0 22px', fontFamily: fontSerif,
        fontSize: 19, lineHeight: 1.65, color: C.ink,
      }}>
        <span style={{
          float: 'left', fontFamily: fontSerif, fontSize: 64, lineHeight: 0.85,
          fontWeight: 700, marginRight: 8, marginTop: 4,
          color: C.accent,
        }}>{first}</span>
        {rest.join('')}
      </p>
    );
  }
  return (
    <p style={{
      margin: '0 0 22px',
      fontFamily: fontSerif,
      fontSize: lead ? 21 : 19, lineHeight: lead ? 1.55 : 1.65,
      color: lead ? C.ink : 'rgba(26,26,23,0.85)',
      fontWeight: lead ? 500 : 400,
    }}>{children}</p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline exercise (the "blue bar" pattern)

function ExerciseInsert({ idx, target, finger = 'blue', typed = 0, total = 18, done = false, fingerHint }) {
  const progressDots = Array.from({ length: total }).map((_, i) => i < typed);
  const targetChars = target.split('');
  return (
    <div style={{
      background: 'linear-gradient(180deg, #fbfaf6 0%, #f5f4f0 100%)',
      border: `1.5px solid ${done ? C.success : FP[finger]}`,
      borderRadius: 16,
      padding: 22,
      margin: '8px 0 32px',
      position: 'relative',
      boxShadow: done ? 'none' : `0 8px 24px ${FP[finger]}22`,
    }}>
      {/* Top row: badge + hint */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 14,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '3px 10px', borderRadius: 999,
          background: done ? C.success : FP[finger],
          color: '#fff', fontSize: 10.5, fontWeight: 700,
          fontFamily: fontMono, letterSpacing: '0.05em',
        }}>
          {done ? '✓ ВЫПОЛНЕНО' : `УПРАЖНЕНИЕ ${idx}`}
        </div>
        {fingerHint && !done && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 11.5, color: C.sub, fontFamily: fontMono,
          }}>
            <span style={{
              display: 'inline-block', width: 10, height: 10, borderRadius: 2,
              background: FP[finger],
            }} />
            <span>{fingerHint}</span>
          </div>
        )}
      </div>

      {/* Target text — printed in mono */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.divider}`,
        borderRadius: 12,
        padding: '18px 22px',
        marginBottom: 14,
        fontFamily: fontMono,
        fontSize: 22, lineHeight: 1.5,
        color: C.ink, letterSpacing: '0.04em',
      }}>
        {targetChars.map((ch, i) => {
          const isDone = i < typed;
          const isCur = i === typed && !done;
          return (
            <span key={i} style={{
              color: isDone ? C.success : isCur ? C.ink : C.faint,
              background: isCur ? `${FP[finger]}33` : 'transparent',
              borderBottom: isCur ? `2px solid ${FP[finger]}` : '2px solid transparent',
              padding: '1px 1px',
              whiteSpace: 'pre',
            }}>{ch === ' ' ? '\u00A0' : ch}</span>
          );
        })}
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 0 }}>
        <div style={{ display: 'flex', gap: 3, flex: 1 }}>
          {progressDots.map((on, i) => (
            <div key={i} style={{
              flex: 1, height: 7, borderRadius: 4,
              background: on ? (done ? C.success : FP[finger]) : '#e5e3da',
              transition: 'background .15s ease',
            }} />
          ))}
        </div>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.sub, marginLeft: 12, minWidth: 50, textAlign: 'right' }}>
          {typed}/{total}
        </div>
        <button style={{
          marginLeft: 12, padding: '6px 12px',
          background: 'transparent', border: `1px solid ${C.divider}`,
          borderRadius: 7,
          fontSize: 11, color: C.sub, fontFamily: fontUI, fontWeight: 600,
          cursor: 'pointer',
        }}>↻ Заново</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pull quote / blockquote

function PullQuote({ children, by }) {
  return (
    <blockquote style={{
      margin: '14px 0 28px', padding: '0 0 0 24px',
      borderLeft: `4px solid ${C.accent}`,
      fontFamily: fontSerif, fontSize: 22, lineHeight: 1.4,
      color: C.ink, fontStyle: 'italic',
    }}>
      {children}
      {by && <div style={{
        fontStyle: 'normal', fontFamily: fontUI, fontSize: 12, color: C.faint, marginTop: 10,
        fontWeight: 600, letterSpacing: '0.02em',
      }}>— {by}</div>}
    </blockquote>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tip callout (like Интерактивная справка popup)

function Callout({ icon = '💡', title, children }) {
  return (
    <div style={{
      background: '#fef9c3',
      border: '1px solid #fde68a',
      borderRadius: 12,
      padding: '14px 18px',
      margin: '0 0 26px',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{ fontSize: 18, lineHeight: 1 }}>{icon}</div>
      <div>
        {title && <div style={{ fontSize: 13, fontWeight: 700, color: '#713f12', marginBottom: 4 }}>{title}</div>}
        <div style={{ fontSize: 14, color: '#451a03', lineHeight: 1.5, fontFamily: fontSerif }}>{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Image figure

function Figure({ aspect = '16/9', label, tone = FP.blue }) {
  return (
    <figure style={{
      margin: '0 0 28px',
      background: `linear-gradient(135deg, ${tone}22 0%, ${tone}44 100%)`,
      borderRadius: 14,
      aspectRatio: aspect,
      display: 'grid', placeItems: 'center',
      color: C.sub, fontFamily: fontMono, fontSize: 12,
      border: `1px solid ${C.divider}`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        padding: '4px 10px', borderRadius: 999,
        background: 'rgba(255,255,255,0.9)',
        fontWeight: 700, color: C.sub,
      }}>📷 {label}</div>
    </figure>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bottom nav (prev/next)

function LessonNav({ prev = 5, next = 7 }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', gap: 14,
      marginTop: 36, paddingTop: 28, borderTop: `1px solid ${C.divider}`,
    }}>
      <button style={{
        padding: '14px 22px',
        background: 'transparent', border: `1.5px solid ${C.divider}`,
        borderRadius: 12, color: C.ink,
        fontSize: 14, fontWeight: 600, fontFamily: fontUI,
        cursor: 'pointer', textAlign: 'left',
      }}>
        <div style={{ fontSize: 10, color: C.faint, fontFamily: fontMono, marginBottom: 2 }}>← УРОК {prev}</div>
        <div>Призываю к сознательности</div>
      </button>
      <button style={{
        padding: '14px 22px',
        background: C.accent, color: '#fff',
        border: 'none', borderRadius: 12,
        fontSize: 14, fontWeight: 700, fontFamily: fontUI,
        cursor: 'pointer', textAlign: 'right',
        boxShadow: '0 6px 14px rgba(59,130,246,0.3)',
      }}>
        <div style={{ fontSize: 10, opacity: 0.8, fontFamily: fontMono, marginBottom: 2 }}>УРОК {next} →</div>
        <div>Не бейте клавиши — им больно</div>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Full lesson page

function LessonPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100%', fontFamily: fontUI }}>
      <LessonTopBar progress={32} lessonN={6} />
      <article style={{
        maxWidth: 760, margin: '0 auto', padding: '40px 32px 60px',
      }}>
        <LessonTitle
          moduleN={1}
          lessonN={6}
          title="Вы попали на самый кончик?"
          subtitle="Учимся работать указательными и средними пальцами. Буквы а, в, о и л."
        />

        <MentorIntro
          mentorId="maxim"
          name="Максим"
          role="ВАШ НАСТАВНИК"
          quote="Анна, привет! Прошлые пять уроков ты прошла с точностью 92% — это уже хороший фундамент. Сейчас добавим буквы П и Р: указательные пальцы будут уходить чуть в сторону от пупочков. Главное — не отрывать остальные пальцы. Поехали."
        />

        <P lead>В прошлых уроках мы научились безошибочно находить буквы среднего ряда — ФЫВА ОЛДЖ. Сейчас задача чуть сложнее: добавим к ним буквы П и Р, и отработаем длинные движения указательных пальцев.</P>

        <P drop>Когда вы печатаете букву «П», левый указательный палец смещается с А вправо. Когда букву «Р» — правый указательный с О влево. Это движение должно быть лёгким, не отрывайте остальные пальцы от их позиций. Пальцы — как мост, держите их подвешенными над клавишами.</P>

        <PullQuote by="методика курса">Главный враг скорости — не лень, а напряжение. Чем расслабленнее рука, тем быстрее пальцы.</PullQuote>

        <ExerciseInsert
          idx={1}
          target="ппп ррр ппр рпп"
          finger="blue"
          fingerHint="Указательные · левый и правый"
          typed={8}
          total={15}
        />

        <P>Готовы? Хорошо. Теперь усложним: будем печатать те же буквы внутри коротких слов. Это упражнение займёт у вас 30 секунд — но повторите его 3-4 раза, чтобы движение запомнилось мышцам, а не мозгу.</P>

        <Callout icon="💡" title="Подсказка">
          Если пальцы устают через 10 секунд — это нормально. Делайте короткие паузы каждые 1-2 минуты, потряхивайте кистями. Слепая печать — это марафон, а не спринт.
        </Callout>

        <ExerciseInsert
          idx={2}
          target="папа врал поле плов"
          finger="green"
          fingerHint="Указ. + средн. палец"
          typed={20}
          total={20}
          done
        />

        <Figure label="Положение рук на клавиатуре" tone={FP.blue} aspect="16/9" />

        <P>Обратите внимание: на буквах А и О у вас должны быть тактильные «бугорки» — небольшие пупочки, которые помогают пальцам находить позицию без подглядывания. Это стандарт всех современных клавиатур. Если их нет — можно наклеить рельефные стикеры, продаются в любом магазине канцтоваров.</P>

        <P>Теперь — финальное задание этого урока. Не торопитесь. Печатайте не на скорость, а на точность. Скорость придёт сама, через 10-15 уроков.</P>

        <ExerciseInsert
          idx={3}
          target="ваша опора — пальцы. правда?"
          finger="indigo"
          fingerHint="Все пальцы в работе"
          typed={3}
          total={28}
        />

        <P>Если вы прошли все три упражнения без ошибок — переходите к следующему уроку. Если есть ошибки — повторите. Лучше 30 минут на этом уроке, чем потом переучиваться месяц.</P>

        <LessonNav prev={5} next={7} />
      </article>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE PAGE

function ProfileHeader() {
  return (
    <div style={{
      padding: '36px 32px 28px',
      maxWidth: 1180, margin: '0 auto',
    }}>
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24,
        marginBottom: 24,
      }}>
        <div>
          <div style={{ fontFamily: fontMono, fontSize: 11, color: C.faint, letterSpacing: '0.06em', marginBottom: 6 }}>
            ПРОФИЛЬ
          </div>
          <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Сегодня
          </h1>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '12px 18px',
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '1px solid #fcd34d',
          borderRadius: 14,
          fontSize: 13.5,
        }}>
          <span style={{ fontSize: 24 }}>⏳</span>
          <div>
            <div style={{ fontWeight: 700, color: '#451a03' }}>Платный режим не оформлен</div>
            <div style={{ fontSize: 11.5, color: '#92400e', marginTop: 2 }}>5/5 бесплатных уроков использовано</div>
          </div>
          <button style={{
            padding: '8px 14px', background: '#1a1a17', color: '#fff',
            border: 'none', borderRadius: 8,
            fontSize: 12, fontWeight: 700, fontFamily: fontUI, cursor: 'pointer',
          }}>Купить подписку →</button>
        </div>
      </div>

      {/* Top stats strip */}
      <div style={{
        background: C.surface, border: `1px solid ${C.divider}`,
        borderRadius: 18, padding: '20px 22px',
        display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4,
      }}>
        {[
          { l: 'МИН. СКОРОСТЬ', v: '28', sub: 'зн/мин' },
          { l: 'СРЕДНЯЯ', v: '42', sub: 'зн/мин', tone: C.accent },
          { l: 'МАКС.', v: '67', sub: 'зн/мин', tone: C.success },
          { l: 'ПОПЫТКИ', v: '24', sub: 'завершено' },
          { l: 'ОШИБКИ', v: '8', sub: 'допущено', tone: '#ef4444' },
          { l: 'ВРЕМЯ', v: '6.2', sub: 'часов' },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '0 10px',
            borderLeft: i > 0 ? `1px solid ${C.divider}` : 'none',
          }}>
            <div style={{ fontFamily: fontMono, fontSize: 10, color: C.faint, letterSpacing: '0.06em', marginBottom: 4 }}>{s.l}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 26, fontWeight: 800, fontFamily: fontMono, color: s.tone || C.ink, letterSpacing: '-0.02em' }}>{s.v}</span>
              <span style={{ fontSize: 11, color: C.faint, fontFamily: fontMono }}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileCard() {
  return (
    <aside style={{
      background: C.surface, border: `1px solid ${C.divider}`,
      borderRadius: 18, padding: 22,
      position: 'sticky', top: 80,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 18 }}>
        {window.UserPortrait
          ? <window.UserPortrait audience="adult" gender="f" size={96} />
          : <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#fce7f3' }} />}
        <div style={{ marginTop: 12, fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em' }}>Анна Иванова</div>
        <div style={{ marginTop: 4, fontFamily: fontMono, fontSize: 11.5, color: C.faint }}>anna@example.com</div>
        <div style={{
          marginTop: 10, padding: '4px 10px',
          background: C.accentBg, color: C.accent,
          borderRadius: 999, fontSize: 10.5, fontWeight: 700, fontFamily: fontMono, letterSpacing: '0.04em',
        }}>42 ЗН/МИН · 94%</div>
      </div>
      <div style={{ borderTop: `1px solid ${C.divider}`, paddingTop: 14 }}>
        {[
          { l: 'ID', v: '313828' },
          { l: 'Пол', v: 'Женский ♀' },
          { l: 'Возраст', v: '32 года' },
          { l: 'Страна', v: 'Россия 🇷🇺' },
          { l: 'Город', v: 'Санкт-Петербург' },
          { l: 'С нами с', v: '03.04.2026' },
        ].map((r, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '7px 0', fontSize: 12.5,
          }}>
            <span style={{ color: C.faint, fontFamily: fontMono }}>{r.l}</span>
            <span style={{ color: C.ink, fontWeight: 600 }}>{r.v}</span>
          </div>
        ))}
      </div>
      <button style={{
        width: '100%', marginTop: 18, padding: '11px 14px',
        background: 'transparent', border: `1.5px solid ${C.divider}`,
        borderRadius: 10,
        fontSize: 12.5, fontWeight: 600, color: C.ink, fontFamily: fontUI,
        cursor: 'pointer',
      }}>✎ Редактировать профиль</button>
    </aside>
  );
}

function ProfileTabs() {
  const [active, setActive] = useState('profile');
  const tabs = [
    { id: 'profile', label: 'Профиль' },
    { id: 'stats', label: 'Статистика' },
    { id: 'certs', label: 'Сертификаты', badge: '0' },
    { id: 'payments', label: 'Оплаты' },
    { id: 'bonuses', label: 'Бонусы', badgeNew: true },
    { id: 'reviews', label: 'Отзывы' },
  ];
  return (
    <div style={{
      display: 'flex', gap: 4, marginBottom: 18,
      borderBottom: `1px solid ${C.divider}`,
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setActive(t.id)} style={{
          padding: '11px 16px',
          background: 'transparent', border: 'none',
          color: active === t.id ? C.ink : C.sub,
          fontSize: 13.5, fontWeight: active === t.id ? 700 : 500,
          fontFamily: fontUI, cursor: 'pointer',
          position: 'relative',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {t.label}
          {t.badge && (
            <span style={{
              padding: '1px 6px', borderRadius: 999,
              background: C.divider, color: C.faint, fontSize: 10, fontFamily: fontMono, fontWeight: 700,
            }}>{t.badge}</span>
          )}
          {t.badgeNew && (
            <span style={{
              padding: '1px 6px', borderRadius: 4,
              background: '#f97316', color: '#fff', fontSize: 9, fontFamily: fontMono, fontWeight: 700, letterSpacing: '0.04em',
            }}>NEW</span>
          )}
          {active === t.id && (
            <div style={{
              position: 'absolute', bottom: -1, left: 0, right: 0,
              height: 2, background: C.accent, borderRadius: '2px 2px 0 0',
            }} />
          )}
        </button>
      ))}
    </div>
  );
}

function ActivityChart() {
  // simple bar chart placeholder
  const data = [3, 5, 2, 6, 8, 4, 7, 9, 6, 8, 11, 7, 9, 12];
  const max = Math.max(...data);
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.divider}`,
      borderRadius: 16, padding: 22, marginBottom: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>График активности</h3>
        <select style={{
          padding: '6px 28px 6px 12px',
          border: `1px solid ${C.divider}`, borderRadius: 8,
          fontSize: 12, fontFamily: fontUI, fontWeight: 600,
          background: 'transparent', color: C.ink, cursor: 'pointer',
        }}>
          <option>Последние 14 дней</option>
          <option>Месяц</option>
          <option>3 месяца</option>
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
        {data.map((v, i) => (
          <div key={i} style={{
            flex: 1, position: 'relative',
            height: '100%', display: 'flex', alignItems: 'flex-end',
          }}>
            <div style={{
              width: '100%',
              height: `${(v / max) * 100}%`,
              background: i === data.length - 1
                ? 'linear-gradient(180deg, #74b9ff 0%, #a29bfe 100%)'
                : '#e5e3da',
              borderRadius: '5px 5px 0 0',
            }} />
          </div>
        ))}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: 10, fontFamily: fontMono, fontSize: 10, color: C.faint,
      }}>
        <span>12 мая</span><span>сегодня</span>
      </div>
    </div>
  );
}

function CourseRow({ flag, label, layout, progress, lessons, attempts, speed, stars }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.divider}`,
      borderRadius: 14, padding: 18, marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>{flag}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{label}</div>
            <div style={{ fontFamily: fontMono, fontSize: 10.5, color: C.faint, letterSpacing: '0.04em' }}>{layout}</div>
          </div>
          {progress > 0 ? (
            <span style={{
              padding: '3px 9px', borderRadius: 999,
              background: C.accentBg, color: C.accent,
              fontSize: 10.5, fontWeight: 700, fontFamily: fontMono, letterSpacing: '0.04em', marginLeft: 6,
            }}>В ПРОЦЕССЕ</span>
          ) : (
            <span style={{
              padding: '3px 9px', borderRadius: 999,
              background: 'rgba(0,0,0,0.05)', color: C.sub,
              fontSize: 10.5, fontWeight: 700, fontFamily: fontMono, letterSpacing: '0.04em', marginLeft: 6,
            }}>НЕ НАЧАТ</span>
          )}
        </div>
        <button style={{
          padding: '8px 14px',
          background: progress > 0 ? C.accent : '#1a1a17',
          color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 12, fontWeight: 700, fontFamily: fontUI, cursor: 'pointer',
        }}>{progress > 0 ? 'Продолжить →' : 'Начать обучение →'}</button>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 11, color: C.sub, fontFamily: fontMono, marginBottom: 5,
        }}>
          <span>Прогресс</span>
          <span>{progress}%</span>
        </div>
        <div style={{ height: 5, background: C.divider, borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: 'linear-gradient(90deg, #74b9ff 0%, #a29bfe 100%)',
            borderRadius: 999,
          }} />
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 22, fontSize: 11.5, fontFamily: fontMono, color: C.sub,
      }}>
        <span>📚 {lessons}</span>
        <span>🎯 {attempts}</span>
        <span>⚡ {speed}</span>
        <span style={{ marginLeft: 'auto', color: C.warm }}>{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
      </div>
    </div>
  );
}

function ActivityList() {
  const courses = [
    { flag: '🇷🇺', label: 'Русский курс',     layout: 'ЙЦУКЕН',  progress: 12, lessons: '5/99', attempts: '24 попытки', speed: '42 зн/мин', stars: 4 },
    { flag: '🇬🇧', label: 'Английский курс',   layout: 'QWERTY',  progress: 0,  lessons: '0/100', attempts: '0',          speed: '—',         stars: 0 },
    { flag: '🔢', label: 'Укрощение цифр',    layout: 'Numpad',  progress: 0,  lessons: '0/20',  attempts: '0',          speed: '—',         stars: 0 },
    { flag: '🇩🇪', label: 'Немецкий курс',     layout: 'QWERTZ',  progress: 0,  lessons: '0/80',  attempts: '0',          speed: '—',         stars: 0 },
  ];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Мои курсы</h3>
        <a href="#" style={{ fontSize: 12, color: C.accent, fontWeight: 600, textDecoration: 'none', fontFamily: fontMono }}>+ Добавить язык</a>
      </div>
      {courses.map((c, i) => <CourseRow key={i} {...c} />)}
    </div>
  );
}

function ProfilePage() {
  return (
    <div style={{ background: C.bg, minHeight: '100%', fontFamily: fontUI }}>
      {/* Reuse top bar but minimal */}
      <header style={{
        padding: '12px 32px',
        borderBottom: `1px solid ${C.divider}`,
        display: 'flex', alignItems: 'center', gap: 22,
        background: 'rgba(245,244,240,0.85)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 10,
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
        <nav style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
          {['Главная', 'Уроки', 'Тренажёр скорости', 'Игры', 'Статистика'].map((l, i) => (
            <a key={l} href="#" style={{
              padding: '7px 12px', borderRadius: 8,
              background: 'transparent', color: C.sub,
              fontSize: 13, fontWeight: 500, textDecoration: 'none',
            }}>{l}</a>
          ))}
        </nav>
      </header>

      <ProfileHeader />

      <div style={{
        maxWidth: 1180, margin: '0 auto', padding: '0 32px 60px',
        display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24,
      }}>
        <ProfileCard />
        <div>
          <ProfileTabs />
          <ActivityChart />
          <ActivityList />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function App() {
  return (
    <DesignCanvas defaultZoom={0.5}>
      <DCSection id="lesson" title="Урок · читаемый формат со встроенными упражнениями" subtitle="Длинный текст урока (как глава книги) с вставками упражнений в стиле «синих полос» конкурента. Target text монохромный, текущая буква подсвечена цветом пальца, ниже — прогресс-дотс. 3 разных состояния: в процессе / выполнено / только начато.">
        <DCArtboard id="lesson-page" label="Урок 6 · «Вы попали на самый кончик?»" width={1200} height={2600}>
          <LessonPage />
        </DCArtboard>
      </DCSection>

      <DCSection id="profile" title="Профиль пользователя · все курсы" subtitle="Слева — карточка пользователя (ID, пол, возраст, страна). Справа — табы (Профиль / Статистика / Сертификаты / Оплаты / Бонусы / Отзывы), график активности, список курсов с прогрессом по каждому языку. Сверху — баннер «платный режим не оформлен» с CTA «Купить».">
        <DCArtboard id="profile-page" label="Профиль с 4 курсами" width={1200} height={1480}>
          <ProfilePage />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
