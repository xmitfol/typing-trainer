// auth.jsx — Auth screens for typing-trainer
// Tabs: Авторизация / Регистрация / Забыли пароль + Email verification
// Modern minimal flow: register asks ONLY email+password (+optional name),
// rest of profile is collected in onboarding.

const { useState } = React;

const A = {
  bg: '#f5f4f0',
  surface: '#ffffff',
  ink: '#1a1a17',
  sub: 'rgba(26,26,23,0.55)',
  faint: 'rgba(26,26,23,0.35)',
  divider: 'rgba(0,0,0,0.08)',
  accent: '#3b82f6',
  accentBg: '#eef4ff',
  error: '#ef4444',
  errorBg: '#fef2f2',
  success: '#22c55e',
  successBg: '#f0fdf4',
};

const fontUI = '"Manrope", ui-sans-serif, system-ui, sans-serif';
const fontMono = '"JetBrains Mono", ui-monospace, monospace';

// ─────────────────────────────────────────────────────────────────────────────
// Auth screen shell — logo + card

function AuthShell({ children }) {
  return (
    <div style={{
      width: '100%', minHeight: '100%',
      background: A.bg, fontFamily: fontUI, color: A.ink,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 11,
          background: 'linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)',
          display: 'grid', placeItems: 'center',
          color: '#fff', fontFamily: fontMono, fontWeight: 700, fontSize: 17,
          boxShadow: '0 6px 18px rgba(116,185,255,0.3)',
        }}>Ё</div>
        <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em' }}>
          Тренажёр слепой печати
        </div>
      </div>
      <div style={{
        width: '100%', maxWidth: 420,
        background: A.surface,
        border: `1px solid ${A.divider}`,
        borderRadius: 18,
        boxShadow: '0 24px 60px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,1) inset',
      }}>
        {children}
      </div>
    </div>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex',
      borderBottom: `1px solid ${A.divider}`,
      padding: '0 8px',
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1,
          padding: '18px 8px 14px',
          background: 'transparent',
          border: 'none',
          color: active === t.id ? A.ink : A.sub,
          fontSize: 13.5,
          fontWeight: active === t.id ? 700 : 500,
          fontFamily: fontUI,
          cursor: 'pointer',
          position: 'relative',
          transition: 'color .15s ease',
        }}>
          {t.label}
          {active === t.id && (
            <div style={{
              position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
              width: '60%', height: 2, background: A.accent, borderRadius: '2px 2px 0 0',
            }} />
          )}
        </button>
      ))}
    </div>
  );
}

function Input({ label, type = 'text', placeholder, value, onChange, hint, error, suffix }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 12.5, color: A.sub, marginBottom: 6, fontWeight: 600 }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex' }}>
        <input
          type={type}
          placeholder={placeholder}
          value={value || ''}
          onChange={e => onChange && onChange(e.target.value)}
          style={{
            flex: 1,
            padding: '13px 14px',
            background: A.surface,
            border: `1.5px solid ${error ? A.error : A.divider}`,
            borderRadius: 10,
            fontSize: 14.5,
            fontFamily: fontUI,
            color: A.ink,
            outline: 'none',
            transition: 'border-color .15s ease',
          }}
        />
        {suffix && (
          <div style={{
            position: 'absolute', right: 4, top: 4, bottom: 4,
            display: 'flex', alignItems: 'center',
          }}>
            {suffix}
          </div>
        )}
      </div>
      {hint && !error && <div style={{ fontSize: 11.5, color: A.faint, marginTop: 5 }}>{hint}</div>}
      {error && <div style={{ fontSize: 11.5, color: A.error, marginTop: 5 }}>{error}</div>}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%',
      padding: '14px 18px',
      background: disabled ? '#cbd5e1' : A.accent,
      color: '#fff',
      border: 'none',
      borderRadius: 10,
      fontSize: 14.5,
      fontWeight: 700,
      fontFamily: fontUI,
      cursor: disabled ? 'default' : 'pointer',
      boxShadow: disabled ? 'none' : '0 4px 12px rgba(59,130,246,0.3)',
      transition: 'all .15s ease',
      ...style,
    }}>{children}</button>
  );
}

function SocialButton({ provider, onClick }) {
  const cfg = {
    vk:       { label: 'ВКонтакте',  bg: '#0077FF', fg: '#fff', glyph: <VKGlyph /> },
    ok:       { label: 'Одноклассники', bg: '#EE8208', fg: '#fff', glyph: <OKGlyph /> },
    google:   { label: 'Google',     bg: '#fff',    fg: '#1a1a17', glyph: <GoogleGlyph />, border: true },
    yandex:   { label: 'Яндекс ID',  bg: '#FC3F1D', fg: '#fff', glyph: <YandexGlyph /> },
    telegram: { label: 'Telegram',   bg: '#26A5E4', fg: '#fff', glyph: <TelegramGlyph /> },
  }[provider];
  return (
    <button onClick={onClick} style={{
      padding: '11px 14px',
      background: cfg.bg, color: cfg.fg,
      border: cfg.border ? `1.5px solid ${A.divider}` : 'none',
      borderRadius: 10,
      fontSize: 13, fontWeight: 600, fontFamily: fontUI,
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      width: '100%',
      transition: 'all .15s ease',
    }}>
      {cfg.glyph}<span>{cfg.label}</span>
    </button>
  );
}

function VKGlyph() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.5 7.5c-.2 1-1 2-2 3 .8.8 1.5 1.5 2 2.5.2.5-.2.8-.5.8h-1.5c-.5 0-.8-.3-1-.5-.5-.5-1-1-1.5-1.5-.3-.3-.5-.3-.5.2v1.5c0 .3-.2.3-.5.3-1.5 0-3-.5-4-1.5-1.2-1.2-2-3-2.5-4 0-.3.2-.5.5-.5h1.5c.3 0 .5.2.5.5.5 1.5 1.5 3 2 3 .2.2.3 0 .3-.3V9.5c0-.5-.3-.5-.8-.5-.2 0-.3-.2-.2-.3.2-.3.5-.5 1-.5h2c.3 0 .5.2.5.5v2.5c0 .3.2.3.3.2.5-.5 1-1.5 1.5-2.5.2-.2.3-.5.5-.5h1.5c.5 0 .5.3.3.5z"/></svg>;
}
function OKGlyph() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4"/><path d="M12 13c-3 0-6 2-6 4v1h12v-1c0-2-3-4-6-4z"/><path d="M5 16l3 2 4-2 4 2 3-2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function GoogleGlyph() {
  return <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.4-.2-2.1H12v3.9h5.9c-.1.9-.7 2.4-2.1 3.4l-.02.13 3.05 2.36.21.02c1.94-1.79 3.06-4.43 3.06-7.6z"/><path fill="#34A853" d="M12 23c2.76 0 5.08-.91 6.77-2.48l-3.23-2.5c-.86.6-2.02 1.02-3.54 1.02-2.7 0-5-1.79-5.82-4.27l-.12.01-3.18 2.46-.04.11C4.53 20.49 8 23 12 23z"/><path fill="#FBBC05" d="M6.18 14.77c-.22-.65-.34-1.34-.34-2.07s.13-1.42.33-2.07v-.14L2.95 8.04l-.11.05A10.93 10.93 0 0 0 1.5 12.7c0 1.78.43 3.46 1.34 4.94l3.34-2.87z"/><path fill="#EA4335" d="M12 5.43c1.92 0 3.21.83 3.95 1.52l2.89-2.82C17.07 2.59 14.76 1.5 12 1.5c-4 0-7.47 2.51-9.16 6.17l3.33 2.58c.83-2.48 3.13-4.82 5.83-4.82z"/></svg>;
}
function YandexGlyph() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /><text x="12" y="17" textAnchor="middle" fontFamily="Manrope, sans-serif" fontWeight="800" fontSize="14" fill="white">Я</text></svg>;
}
function TelegramGlyph() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>;
}

// Helper: divider with "или"
function Divider({ label = 'или' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '6px 0 16px' }}>
      <div style={{ flex: 1, height: 1, background: A.divider }} />
      <span style={{ fontSize: 11, color: A.faint, fontFamily: fontMono, letterSpacing: '0.06em' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: A.divider }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN

function LoginForm() {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('anna@example.com');
  const [password, setPassword] = useState('••••••••');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);

  return (
    <AuthShell>
      <Tabs tabs={[
        { id: 'login', label: 'Войти' },
        { id: 'register', label: 'Регистрация' },
        { id: 'forgot', label: 'Забыли пароль?' },
      ]} active={tab} onChange={setTab} />

      <div style={{ padding: '24px 28px 28px' }}>
        <h1 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>С возвращением!</h1>

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
        />

        <Input
          label="Пароль"
          type={showPwd ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          suffix={
            <button onClick={() => setShowPwd(!showPwd)} style={{
              background: 'transparent', border: 'none',
              padding: '0 12px', height: '100%',
              color: A.faint, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: fontUI,
            }}>{showPwd ? 'Скрыть' : 'Показать'}</button>
          }
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: A.sub }}>
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: A.accent }} />
            Запомнить меня
          </label>
          <button onClick={() => setTab('forgot')} style={{
            background: 'transparent', border: 'none',
            color: A.accent, fontSize: 13, fontWeight: 600, fontFamily: fontUI,
            cursor: 'pointer', padding: 0,
          }}>Забыли пароль?</button>
        </div>

        <PrimaryButton>Войти</PrimaryButton>

        <Divider />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <SocialButton provider="vk" />
          <SocialButton provider="google" />
          <SocialButton provider="yandex" />
          <SocialButton provider="telegram" />
        </div>
      </div>
    </AuthShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER — minimal

function RegisterForm() {
  const [tab, setTab] = useState('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [agreed, setAgreed] = useState(true);

  // Password strength
  const strength = (() => {
    if (!password) return null;
    let n = 0;
    if (password.length >= 8) n++;
    if (/[A-ZА-Я]/.test(password)) n++;
    if (/[0-9]/.test(password)) n++;
    if (/[^a-zA-Zа-яА-Я0-9]/.test(password)) n++;
    return n;
  })();
  const strengthLabel = ['Слишком короткий', 'Слабый', 'Средний', 'Хороший', 'Надёжный'][strength] || '';
  const strengthColor = ['#ef4444', '#ef4444', '#f59e0b', '#10b981', '#22c55e'][strength] || A.divider;

  return (
    <AuthShell>
      <Tabs tabs={[
        { id: 'login', label: 'Войти' },
        { id: 'register', label: 'Регистрация' },
        { id: 'forgot', label: 'Забыли пароль?' },
      ]} active={tab} onChange={setTab} />

      <div style={{ padding: '24px 28px 28px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Создать аккаунт</h1>
        <p style={{ margin: '0 0 22px', fontSize: 13, color: A.sub, lineHeight: 1.5 }}>
          За 30 секунд. Имя, возраст и наставник — на следующем шаге.
        </p>

        {/* Social FIRST — modern best practice */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 }}>
          <SocialButton provider="vk" />
          <SocialButton provider="google" />
          <SocialButton provider="yandex" />
          <SocialButton provider="telegram" />
        </div>

        <Divider label="или с email" />

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
          hint="Куда отправить ссылку для входа и подтверждения"
        />

        <Input
          label="Придумайте пароль"
          type={showPwd ? 'text' : 'password'}
          placeholder="минимум 8 символов"
          value={password}
          onChange={setPassword}
          suffix={
            <button onClick={() => setShowPwd(!showPwd)} style={{
              background: 'transparent', border: 'none',
              padding: '0 12px', height: '100%',
              color: A.faint, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: fontUI,
            }}>{showPwd ? 'Скрыть' : 'Показать'}</button>
          }
        />

        {/* Password strength bar */}
        {password && (
          <div style={{ marginTop: -8, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{
                  flex: 1, height: 4, borderRadius: 999,
                  background: i < strength ? strengthColor : A.divider,
                  transition: 'background .2s ease',
                }} />
              ))}
            </div>
            <div style={{ fontSize: 11, color: strength >= 3 ? '#16a34a' : A.faint, fontFamily: fontMono }}>
              {strengthLabel}
            </div>
          </div>
        )}

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 12.5, color: A.sub, marginBottom: 18, lineHeight: 1.5 }}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
            style={{ width: 16, height: 16, marginTop: 2, accentColor: A.accent, flexShrink: 0 }} />
          <span>
            Согласен с <a href="#" style={{ color: A.accent, textDecoration: 'none' }}>условиями</a> и{' '}
            <a href="#" style={{ color: A.accent, textDecoration: 'none' }}>политикой конфиденциальности</a>
          </span>
        </label>

        <PrimaryButton disabled={!agreed}>Создать аккаунт →</PrimaryButton>

        <div style={{ marginTop: 14, textAlign: 'center', fontSize: 12.5, color: A.sub }}>
          Уже есть аккаунт?{' '}
          <button onClick={() => setTab('login')} style={{
            background: 'transparent', border: 'none', padding: 0,
            color: A.accent, fontWeight: 600, fontSize: 12.5, fontFamily: fontUI, cursor: 'pointer',
          }}>Войти</button>
        </div>
      </div>
    </AuthShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD

function ForgotForm() {
  const [tab, setTab] = useState('forgot');
  const [email, setEmail] = useState('');

  return (
    <AuthShell>
      <Tabs tabs={[
        { id: 'login', label: 'Войти' },
        { id: 'register', label: 'Регистрация' },
        { id: 'forgot', label: 'Забыли пароль?' },
      ]} active={tab} onChange={setTab} />

      <div style={{ padding: '24px 28px 28px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Восстановление</h1>
        <p style={{ margin: '0 0 22px', fontSize: 13, color: A.sub, lineHeight: 1.5 }}>
          Введите email — пришлём ссылку для входа. Сразу попадёте в свой аккаунт, без пароля.
        </p>

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
        />

        <PrimaryButton style={{ marginTop: 4 }}>Прислать ссылку</PrimaryButton>

        <div style={{ marginTop: 18, textAlign: 'center', fontSize: 12.5, color: A.sub }}>
          Вспомнили?{' '}
          <button onClick={() => setTab('login')} style={{
            background: 'transparent', border: 'none', padding: 0,
            color: A.accent, fontWeight: 600, fontSize: 12.5, fontFamily: fontUI, cursor: 'pointer',
          }}>Войти</button>
        </div>
      </div>
    </AuthShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL VERIFICATION — non-blocking

function EmailVerifyForm() {
  return (
    <AuthShell>
      <div style={{ padding: '40px 32px 32px', textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: A.successBg, color: A.success,
          display: 'grid', placeItems: 'center', margin: '0 auto 18px',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M3 7l9 6 9-6M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9-4 9 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Проверьте почту</h1>
        <p style={{ margin: '0 0 18px', fontSize: 13.5, color: A.sub, lineHeight: 1.55 }}>
          Отправили ссылку на <b style={{ color: A.ink }}>anna@example.com</b>.<br />
          Перейдите по ней, чтобы подтвердить email.
        </p>

        <div style={{
          background: A.bg, border: `1px solid ${A.divider}`,
          borderRadius: 12, padding: '14px 16px', marginBottom: 18,
          textAlign: 'left',
        }}>
          <div style={{ fontSize: 11, color: A.faint, fontFamily: fontMono, marginBottom: 6, letterSpacing: '0.06em' }}>СОВЕТ</div>
          <div style={{ fontSize: 13, color: A.ink, lineHeight: 1.5 }}>
            Не пришло? Проверьте папку «Спам» или{' '}
            <button style={{
              background: 'transparent', border: 'none', padding: 0,
              color: A.accent, fontWeight: 600, fontSize: 13, fontFamily: fontUI, cursor: 'pointer',
            }}>отправьте повторно</button>.
          </div>
        </div>

        <PrimaryButton style={{ background: '#1a1a17', boxShadow: 'none' }}>
          Продолжить без подтверждения →
        </PrimaryButton>
        <p style={{ margin: '10px 0 0', fontSize: 11.5, color: A.faint, lineHeight: 1.5 }}>
          Можно начать прямо сейчас. Email подтвердите когда удобно.
        </p>
      </div>
    </AuthShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOW DIAGRAM — how registration ties into onboarding

function FlowDiagram() {
  const steps = [
    { id: 1, label: 'Landing', sub: 'Hero · «Начать обучение»', tone: '#e0e7ff' },
    { id: 2, label: 'Регистрация', sub: 'email + пароль ИЛИ соц.', tone: '#fce7f3' },
    { id: 3, label: 'Подтверждение', sub: 'magic link (не блокирует)', tone: '#fef3c7' },
    { id: 4, label: 'Онбординг', sub: 'имя · профиль · наставник', tone: '#dbeafe' },
    { id: 5, label: 'Первый урок', sub: '«мама мыла раму»', tone: '#d1fae5' },
  ];
  return (
    <div style={{
      width: '100%', height: '100%',
      background: A.bg, fontFamily: fontUI, padding: 28,
    }}>
      <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
        Полный путь нового пользователя
      </h2>
      <p style={{ margin: '0 0 28px', fontSize: 13, color: A.sub, lineHeight: 1.5 }}>
        Минимум трения. Email-верификация не блокирует — даём начать, подтвердить можно позже.
      </p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            <div style={{
              flex: 1,
              background: A.surface,
              border: `1px solid ${A.divider}`,
              borderRadius: 14,
              padding: '16px 14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: s.tone,
                display: 'grid', placeItems: 'center',
                fontFamily: fontMono, fontWeight: 700, fontSize: 13,
                marginBottom: 10,
                color: A.ink,
              }}>{s.id}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: A.sub, lineHeight: 1.4 }}>{s.sub}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ display: 'grid', placeItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke={A.faint} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div style={{
        marginTop: 28,
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14,
      }}>
        <FlowNote title="Что собираем ДО регистрации" body="Ничего. Никаких email до того как пользователь решит зарегистрироваться." />
        <FlowNote title="Что собираем в регистрации" body="Только email + пароль (или соцсеть). Имя/возраст/пол — позже." />
        <FlowNote title="Что собираем в онбординге" body="Имя, аудитория (взрослый/подросток/ребёнок), наставник. Клавиатура/язык — авто." />
      </div>

      <div style={{
        marginTop: 22,
        padding: '14px 16px',
        background: '#fef9c3',
        border: '1px solid #fde68a',
        borderRadius: 12,
        fontSize: 13, color: A.ink, lineHeight: 1.5,
      }}>
        <b style={{ fontWeight: 700 }}>Альтернатива: «guest mode».</b> Можно дать пользователю начать урок без регистрации — а зарегистрироваться только когда захочет сохранить прогресс (через 5-10 минут). Это снижает воронку отвала ещё на 30-40%, но требует флага «гость» в БД.
      </div>
    </div>
  );
}

function FlowNote({ title, body }) {
  return (
    <div style={{
      background: A.surface,
      border: `1px solid ${A.divider}`,
      borderRadius: 10,
      padding: '14px 16px',
    }}>
      <div style={{
        fontSize: 11, color: A.faint, fontFamily: fontMono,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        marginBottom: 6,
      }}>{title}</div>
      <div style={{ fontSize: 13, color: A.ink, lineHeight: 1.45 }}>{body}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root

function App() {
  return (
    <DesignCanvas defaultZoom={0.55}>
      <DCSection id="auth" title="Формы входа и регистрации" subtitle="Табы Войти / Регистрация / Забыли пароль. Регистрация — минимум полей: email + пароль ИЛИ соцсеть. Имя/возраст/наставник собираем в онбординге (см. onboarding.html).">
        <DCArtboard id="login" label="Войти" width={520} height={780}>
          <LoginForm />
        </DCArtboard>
        <DCArtboard id="register" label="Регистрация · минимум полей" width={520} height={880}>
          <RegisterForm />
        </DCArtboard>
        <DCArtboard id="forgot" label="Забыли пароль · magic link" width={520} height={640}>
          <ForgotForm />
        </DCArtboard>
        <DCArtboard id="verify" label="Подтверждение email · не блокирует" width={520} height={680}>
          <EmailVerifyForm />
        </DCArtboard>
      </DCSection>

      <DCSection id="flow" title="Стыковка с онбордингом — полный путь" subtitle="Как регистрация и онбординг работают вместе. Где какие данные собираем, что блокирует, что нет.">
        <DCArtboard id="flow-diagram" label="User journey · landing → первый урок" width={1100} height={560}>
          <FlowDiagram />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
