// pricing.jsx — Paywall + subscription modal
// Freemium: lessons 1-5 free; lesson 6+ requires Pro. Family plan for kids/teens.

const { useState } = React;

const P = {
  bg: '#f5f4f0',
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

// ─────────────────────────────────────────────────────────────────────────────
// 1) Paywall hit — "Lesson 6 locked"

function PaywallScreen({ onOpen }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: P.bg, fontFamily: fontUI, color: P.ink,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Sticky header recap */}
      <div style={{
        padding: '14px 32px',
        borderBottom: `1px solid ${P.divider}`,
        display: 'flex', alignItems: 'center', gap: 14,
        background: 'rgba(245,244,240,0.85)',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)',
          display: 'grid', placeItems: 'center',
          color: '#fff', fontFamily: fontMono, fontWeight: 700, fontSize: 13,
        }}>Ё</div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Русский курс · Урок 6</div>
        <div style={{ flex: 1 }} />
        <button style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: P.faint, fontSize: 18,
        }}>✕</button>
      </div>

      <div style={{
        flex: 1, padding: '40px 32px',
        display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 48,
        alignItems: 'center', maxWidth: 1100, margin: '0 auto',
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px',
            background: '#fef3c7', border: '1px solid #fde68a',
            borderRadius: 999,
            fontSize: 12, fontWeight: 700, color: '#92400e', fontFamily: fontMono,
            letterSpacing: '0.04em',
            marginBottom: 22,
          }}>
            <LockGlyph color="#92400e" /> ЗАКРЫТ · 5/5 БЕСПЛАТНЫХ УРОКОВ ПРОЙДЕНО
          </div>

          <h1 style={{ margin: 0, fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
            Урок 6: Длинные слова
          </h1>
          <p style={{ margin: '16px 0 28px', fontSize: 16, color: P.sub, lineHeight: 1.55, maxWidth: 460 }}>
            Ты разогналась — 94% точности на первых уроках. Оформи подписку, чтобы пройти все 99 уроков курса, разблокировать тренажёр скорости и сертификат.
          </p>

          <button onClick={onOpen} style={{
            background: P.accent, color: '#fff',
            border: 'none', borderRadius: 12,
            padding: '15px 26px',
            fontSize: 15, fontWeight: 700, fontFamily: fontUI,
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(59,130,246,0.35)',
            marginRight: 12,
          }}>Выбрать тариф →</button>
          <button style={{
            background: 'transparent', color: P.ink,
            border: `1.5px solid ${P.divider}`, borderRadius: 12,
            padding: '14px 22px',
            fontSize: 14, fontWeight: 600, fontFamily: fontUI, cursor: 'pointer',
          }}>Уроки 1–5 повторить</button>

          <div style={{
            display: 'flex', gap: 18, fontSize: 12, color: P.sub, fontFamily: fontMono,
            marginTop: 26,
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckGlyph />Отмена в любой момент</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckGlyph />Возврат 7 дней</span>
          </div>
        </div>

        {/* Lesson preview card (blurred) */}
        <div style={{ position: 'relative' }}>
          <div style={{
            background: P.surface,
            border: `1px solid ${P.divider}`,
            borderRadius: 18,
            padding: 24,
            boxShadow: '0 24px 60px rgba(0,0,0,0.06)',
            filter: 'blur(2px)',
            opacity: 0.65,
            pointerEvents: 'none',
            userSelect: 'none',
          }}>
            <div style={{ fontFamily: fontMono, fontSize: 11, color: P.faint, marginBottom: 8 }}>УРОК 6 · СРЕДНИЙ</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Длинные слова</div>
            <div style={{
              padding: 18, background: '#fbfaf6', borderRadius: 12,
              fontFamily: fontMono, fontSize: 16, color: P.ink, lineHeight: 1.6,
              border: `1px solid ${P.divider}`, marginBottom: 14,
            }}>
              достопримечательность зарекомендовали электроэнергетика правоохранительные институциональный
            </div>
            <div style={{ display: 'flex', gap: 10, fontFamily: fontMono, fontSize: 12, color: P.sub }}>
              <span>~ 12 минут</span><span>·</span><span>240 знаков</span><span>·</span><span>Хочется метроном</span>
            </div>
          </div>

          {/* Lock overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'grid', placeItems: 'center',
          }}>
            <div style={{
              width: 96, height: 96, borderRadius: 24,
              background: 'linear-gradient(135deg, #1a1a17 0%, #2d2d28 100%)',
              display: 'grid', placeItems: 'center',
              color: '#fff',
              boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
            }}>
              <LockGlyph color="#fff" size={42} />
            </div>
          </div>
        </div>
      </div>

      {/* Comparison strip */}
      <div style={{ padding: '0 32px 40px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{
          background: P.surface,
          border: `1px solid ${P.divider}`,
          borderRadius: 18,
          padding: 24,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32,
        }}>
          <div>
            <div style={{ fontSize: 11, color: P.faint, fontFamily: fontMono, marginBottom: 10, letterSpacing: '0.06em' }}>
              ✓ ЧТО У ТЕБЯ УЖЕ ЕСТЬ
            </div>
            {['Уроки 1-5 (основные ряды)', 'Сохранение прогресса', 'Один язык', 'Базовая статистика'].map(t => (
              <div key={t} style={{ fontSize: 13.5, padding: '6px 0', color: P.ink, display: 'flex', gap: 10, alignItems: 'center' }}>
                <CheckGlyph /><span>{t}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, color: P.accent, fontFamily: fontMono, marginBottom: 10, letterSpacing: '0.06em', fontWeight: 700 }}>
              ➜ ЧТО ОТКРОЕТСЯ С ПОДПИСКОЙ
            </div>
            {[
              'Уроки 6-99 (длинные слова, цифры, спецсимволы)',
              'Все языки и раскладки',
              'Тренажёр скорости с метрономом',
              'Сертификат по завершении',
              'Подробная аналитика и графики',
            ].map(t => (
              <div key={t} style={{ fontSize: 13.5, padding: '6px 0', color: P.ink, display: 'flex', gap: 10, alignItems: 'center' }}>
                <PlusGlyph /><span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LockGlyph({ color = 'currentColor', size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="3" y="7" width="10" height="7" rx="1.5" fill={color} />
      <path d="M5.5 7V4.5a2.5 2.5 0 015 0V7" stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function CheckGlyph({ color = '#10b981', size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 14 14" fill="none"><path d="M3 7.5L6 10L11 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function PlusGlyph({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill={P.accentBg} stroke={P.accent} strokeWidth="1.5" /><path d="M7 4.5V9.5M4.5 7H9.5" stroke={P.accent} strokeWidth="1.6" strokeLinecap="round" /></svg>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2) Subscription modal — plan + period selection

function SubscriptionModal() {
  const [plan, setPlan] = useState('pro');
  const [period, setPeriod] = useState('m6');
  const [showPromo, setShowPromo] = useState(false);

  // Period catalog — week to year. Each carries a multiplier on monthly price
  // and a "savings" relative to the per-month rate, so longer = bigger discount.
  const PERIODS = [
    { id: 'w1',  label: '1 неделя',  short: '1 нед', months: 0.25, factor: 0.30, savings: 0,  copy: 'Попробовать' },
    { id: 'm1',  label: '1 месяц',   short: 'Месяц', months: 1,    factor: 1.00, savings: 0,  copy: 'Базовый темп' },
    { id: 'm3',  label: '3 месяца',  short: '3 мес', months: 3,    factor: 2.55, savings: 15, copy: 'Освоить курс' },
    { id: 'm6',  label: '6 месяцев', short: '6 мес', months: 6,    factor: 4.50, savings: 25, copy: 'Закрепить · популярно', popular: true },
    { id: 'y1',  label: '1 год',     short: 'Год',   months: 12,   factor: 7.80, savings: 35, copy: 'Лучшая цена' },
  ];

  const PLANS = {
    free: {
      label: 'Бесплатно',
      tagline: 'То что есть',
      basePrice: 0,
      features: ['Уроки 1-5', 'Один язык', 'Базовая статистика'],
      cta: 'Текущий план',
      disabled: true,
    },
    pro: {
      label: 'Полный',
      tagline: 'Лучший выбор для одного',
      basePrice: 490,
      features: [
        'Все 99 уроков',
        'Все 3 типа клавиатуры (Classic / Laptop / Ergo)',
        'Все языки и раскладки',
        'Тренажёр скорости с метрономом',
        'Сертификат',
      ],
      featured: true,
      cta: 'Оформить Полный',
    },
    family: {
      label: 'Семейный',
      tagline: 'До 5 человек',
      basePrice: 890,
      features: [
        'Всё из Полного',
        '5 профилей (взрослые + дети)',
        'Подростковый курс с Кнопычем',
        'Детский курс с Клавочкой',
        'Родительская статистика',
      ],
      cta: 'Оформить Семейный',
    },
  };

  const selectedPlan = PLANS[plan];
  const selectedPeriod = PERIODS.find(p => p.id === period);
  const computePrice = (pl, pd) =>
    pl.basePrice === 0 ? 0 : Math.round(pl.basePrice * pd.factor / 10) * 10;
  const price = computePrice(selectedPlan, selectedPeriod);
  const monthlyEquivalent = selectedPeriod.months >= 1
    ? Math.round(price / selectedPeriod.months / 10) * 10
    : Math.round(price * 4);
  const fullPriceNoDiscount = Math.round(selectedPlan.basePrice * selectedPeriod.months);
  const savedAmount = fullPriceNoDiscount - price;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'rgba(26,26,23,0.5)', fontFamily: fontUI,
      display: 'grid', placeItems: 'center',
      padding: 24,
    }}>
      <div style={{
        background: P.bg,
        borderRadius: 24,
        width: '100%', maxWidth: 920,
        maxHeight: '100%',
        overflowY: 'auto',
        boxShadow: '0 40px 100px rgba(0,0,0,0.3)',
        position: 'relative',
      }}>
        <button style={{
          position: 'absolute', top: 18, right: 18, zIndex: 2,
          width: 36, height: 36, borderRadius: 999,
          background: 'rgba(0,0,0,0.06)', border: 'none',
          color: P.ink, fontSize: 18, cursor: 'pointer',
          display: 'grid', placeItems: 'center',
        }}>✕</button>

        <div style={{ padding: '36px 36px 28px' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Выбери тариф
            </h2>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: P.sub }}>
              Чем дольше — тем дешевле в месяц. Отменить можно в любой момент.
            </p>
          </div>

          {/* Period segmented control — 5 options */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6,
            background: P.surface, border: `1px solid ${P.divider}`,
            borderRadius: 14, padding: 6,
            marginBottom: 24,
          }}>
            {PERIODS.map(pd => {
              const isActive = period === pd.id;
              return (
                <button key={pd.id} onClick={() => setPeriod(pd.id)} style={{
                  padding: '10px 8px 12px',
                  background: isActive ? P.ink : 'transparent',
                  color: isActive ? '#fff' : P.ink,
                  border: 'none', borderRadius: 9,
                  cursor: 'pointer', fontFamily: fontUI,
                  textAlign: 'center', position: 'relative',
                  transition: 'all .15s ease',
                }}>
                  {pd.popular && !isActive && (
                    <div style={{
                      position: 'absolute', top: -7, right: 6,
                      padding: '2px 7px', borderRadius: 999,
                      background: P.accent, color: '#fff',
                      fontSize: 8.5, fontFamily: fontMono, fontWeight: 700, letterSpacing: '0.04em',
                    }}>HIT</div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{pd.short}</div>
                  <div style={{
                    fontSize: 10, marginTop: 4,
                    color: isActive ? 'rgba(255,255,255,0.65)' : P.faint,
                    fontFamily: fontMono, letterSpacing: '0.02em',
                  }}>
                    {pd.savings > 0
                      ? <span style={{ color: isActive ? '#a7f3d0' : '#10b981', fontWeight: 700 }}>−{pd.savings}%</span>
                      : pd.copy.split(' ·')[0].toLowerCase()
                    }
                  </div>
                </button>
              );
            })}
          </div>

          {/* Plans grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
            {Object.entries(PLANS).map(([k, pl]) => {
              const planPrice = computePrice(pl, selectedPeriod);
              return (
                <button key={k} onClick={() => !pl.disabled && setPlan(k)} style={{
                  background: plan === k ? (pl.featured ? P.ink : P.surface) : P.surface,
                  color: plan === k && pl.featured ? '#fff' : P.ink,
                  border: `1.5px solid ${plan === k ? (pl.featured ? P.ink : P.accent) : P.divider}`,
                  borderRadius: 16,
                  padding: 20,
                  textAlign: 'left',
                  cursor: pl.disabled ? 'not-allowed' : 'pointer',
                  fontFamily: fontUI,
                  position: 'relative',
                  transition: 'all .15s ease',
                  opacity: pl.disabled ? 0.5 : 1,
                }}>
                  {pl.featured && (
                    <div style={{
                      position: 'absolute', top: -9, right: 16,
                      padding: '3px 10px', borderRadius: 999,
                      background: P.accent, color: '#fff',
                      fontSize: 10, fontFamily: fontMono, fontWeight: 700, letterSpacing: '0.04em',
                    }}>ПОПУЛЯРНО</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{pl.label}</div>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: `2px solid ${plan === k ? (pl.featured ? '#fff' : P.accent) : P.divider}`,
                      display: 'grid', placeItems: 'center',
                    }}>
                      {plan === k && <div style={{ width: 8, height: 8, borderRadius: '50%', background: pl.featured ? '#fff' : P.accent }} />}
                    </div>
                  </div>
                  <div style={{ fontSize: 11.5, opacity: 0.7, marginBottom: 14 }}>{pl.tagline}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 30, fontWeight: 800, fontFamily: fontMono, letterSpacing: '-0.02em' }}>
                      {planPrice.toLocaleString('ru-RU')}
                    </span>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>₽</span>
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.6, fontFamily: fontMono, marginBottom: 14 }}>
                    {pl.basePrice === 0 ? 'навсегда' :
                      selectedPeriod.months >= 1
                        ? `за ${selectedPeriod.label} · ${Math.round(planPrice / selectedPeriod.months / 10) * 10} ₽/мес`
                        : `за ${selectedPeriod.label}`}
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {pl.features.slice(0, 3).map((f, i) => (
                      <li key={i} style={{ fontSize: 12, display: 'flex', gap: 8, lineHeight: 1.35 }}>
                        <CheckGlyph color={plan === k && pl.featured ? '#22c55e' : P.success} />
                        {f}
                      </li>
                    ))}
                    {pl.features.length > 3 && (
                      <li style={{ fontSize: 11.5, opacity: 0.6, paddingLeft: 22, fontFamily: fontMono }}>+ ещё {pl.features.length - 3}</li>
                    )}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* Summary + promo */}
          <div style={{
            background: P.surface, border: `1px solid ${P.divider}`,
            borderRadius: 14, padding: 18,
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, color: P.sub }}>
                  Итого за <b style={{ color: P.ink, fontWeight: 700 }}>{selectedPeriod.label}</b>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  {price.toLocaleString('ru-RU')} ₽
                  {selectedPeriod.months >= 1 && price > 0 && (
                    <span style={{ fontSize: 12, color: P.sub, fontWeight: 500, fontFamily: fontMono }}>
                      ~ {monthlyEquivalent} ₽/мес
                    </span>
                  )}
                </div>
              </div>
              {savedAmount > 0 && (
                <div style={{
                  padding: '6px 12px', borderRadius: 999,
                  background: '#dcfce7', color: '#15803d',
                  fontSize: 12, fontWeight: 700, fontFamily: fontMono,
                }}>экономия {savedAmount.toLocaleString('ru-RU')} ₽</div>
              )}
            </div>

            {!showPromo ? (
              <button onClick={() => setShowPromo(true)} style={{
                background: 'transparent', border: 'none', padding: 0,
                color: P.accent, fontSize: 12.5, fontWeight: 600, fontFamily: fontUI, cursor: 'pointer',
              }}>+ Промокод</button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input placeholder="Введите код" style={{
                  flex: 1, padding: '10px 12px',
                  border: `1.5px solid ${P.divider}`, borderRadius: 8,
                  fontSize: 13, fontFamily: fontMono, outline: 'none',
                }} />
                <button style={{
                  padding: '10px 16px',
                  background: P.ink, color: '#fff',
                  border: 'none', borderRadius: 8,
                  fontSize: 12.5, fontWeight: 700, fontFamily: fontUI, cursor: 'pointer',
                }}>Применить</button>
              </div>
            )}
          </div>

          <button style={{
            width: '100%', padding: '15px 24px',
            background: P.accent, color: '#fff',
            border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 700, fontFamily: fontUI, cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(59,130,246,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            {selectedPlan.cta} · {price.toLocaleString('ru-RU')} ₽
            <span style={{ fontSize: 16 }}>→</span>
          </button>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
            marginTop: 18, fontSize: 11, color: P.faint, fontFamily: fontMono,
          }}>
            <span>Принимаем:</span>
            <PaymentLogos />
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentLogos() {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <PayLogo bg="#1A1F71" color="#fff" label="VISA" />
      <PayLogo bg="#fff" color="#EB001B" label="MC" border />
      <PayLogo bg="#0F4C81" color="#00BB45" label="МИР" />
      <PayLogo bg="#FFCC00" color="#1a1a17" label="ЯД" />
      <PayLogo bg="#26A5E4" color="#fff" label="TG" />
      <PayLogo bg="#1F1F1F" color="#fff" label="SBP" />
    </div>
  );
}

function PayLogo({ bg, color, label, border }) {
  return (
    <div style={{
      width: 36, height: 22, borderRadius: 4,
      background: bg, color,
      border: border ? `1px solid ${P.divider}` : 'none',
      display: 'grid', placeItems: 'center',
      fontFamily: fontMono, fontWeight: 800, fontSize: 9, letterSpacing: '0.02em',
    }}>{label}</div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3) Payment step — card form (simplified)

function PaymentStep() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'rgba(26,26,23,0.5)', fontFamily: fontUI,
      display: 'grid', placeItems: 'center',
      padding: 24,
    }}>
      <div style={{
        background: P.surface,
        borderRadius: 24,
        width: '100%', maxWidth: 480,
        boxShadow: '0 40px 100px rgba(0,0,0,0.3)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '32px 32px 24px' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'transparent', border: 'none', padding: 0,
            color: P.sub, fontSize: 13, fontWeight: 600, fontFamily: fontUI,
            cursor: 'pointer', marginBottom: 18,
          }}>← Назад к тарифам</button>

          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Оплата
          </h2>
          <div style={{
            margin: '6px 0 22px', display: 'flex', alignItems: 'baseline', gap: 8,
          }}>
            <span style={{ fontSize: 13, color: P.sub }}>Полный · Год</span>
            <span style={{ fontSize: 13, color: P.sub }}>·</span>
            <span style={{ fontSize: 16, fontWeight: 800, fontFamily: fontMono }}>4 900 ₽</span>
          </div>

          {/* Payment methods tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18 }}>
            <PayTab active label="Карта" sub="Visa / MC / МИР" />
            <PayTab label="СБП" sub="по QR" />
            <PayTab label="Кошельки" sub="ЮMoney / TG" />
          </div>

          {/* Card form */}
          <PayInput label="Номер карты" placeholder="•••• •••• •••• ••••" font={fontMono} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <PayInput label="MM / YY" placeholder="12 / 28" font={fontMono} />
            <PayInput label="CVV" placeholder="•••" font={fontMono} />
          </div>
          <PayInput label="Email для чека" placeholder="you@example.com" value="anna@example.com" />

          <button style={{
            width: '100%', padding: '15px 24px', marginTop: 8,
            background: P.accent, color: '#fff',
            border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 700, fontFamily: fontUI, cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(59,130,246,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <LockGlyph color="#fff" /> Оплатить 4 900 ₽
          </button>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginTop: 14, fontSize: 11.5, color: P.faint, fontFamily: fontMono,
          }}>
            <LockGlyph color={P.faint} /> Защищено 3D Secure · оплата проходит на сервере банка
          </div>
        </div>
      </div>
    </div>
  );
}

function PayTab({ active, label, sub }) {
  return (
    <button style={{
      padding: '12px 8px',
      background: active ? P.accentBg : P.surface,
      border: `1.5px solid ${active ? P.accent : P.divider}`,
      borderRadius: 10,
      cursor: 'pointer', fontFamily: fontUI,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: P.ink }}>{label}</div>
      <div style={{ fontSize: 10.5, color: P.faint, fontFamily: fontMono, marginTop: 2 }}>{sub}</div>
    </button>
  );
}

function PayInput({ label, placeholder, font = fontUI, value = '' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12.5, color: P.sub, marginBottom: 6, fontWeight: 600 }}>{label}</label>
      <input
        defaultValue={value}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px 14px',
          background: P.surface,
          border: `1.5px solid ${P.divider}`,
          borderRadius: 10,
          fontSize: 14, fontFamily: font, color: P.ink,
          outline: 'none',
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root

function App() {
  return (
    <DesignCanvas defaultZoom={0.55}>
      <DCSection id="paywall" title="Момент paywall · урок 6 заблокирован" subtitle="После 5 бесплатных уроков — экран с превью того что внутри (blur), и ясный пояснительный блок что есть бесплатно vs что откроется с подпиской.">
        <DCArtboard id="paywall-screen" label="Экран «Урок 6 закрыт» с превью" width={1100} height={920}>
          <PaywallScreen />
        </DCArtboard>
      </DCSection>

      <DCSection id="subscription" title="Модал выбора тарифа" subtitle="3 плана на одном экране (не 3×5 как у конкурента). Период-toggle Месяц/Год со скидкой. Промокод свёрнут. Способы оплаты как trust-signal.">
        <DCArtboard id="sub-modal" label="Subscription modal · Полный + Год выбрано" width={960} height={780}>
          <SubscriptionModal />
        </DCArtboard>
      </DCSection>

      <DCSection id="payment" title="Шаг оплаты" subtitle="Минимум полей: только данные карты + email для чека. Способы оплаты — табы (Карта / СБП / Кошельки). 3D Secure пометка как trust-signal.">
        <DCArtboard id="pay-step" label="Payment step · ввод карты" width={560} height={720}>
          <PaymentStep />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
