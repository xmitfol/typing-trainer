# ADR-005 (DRAFT) · YooKassa recurring fallback strategy

- **Status**: ⛔ Superseded by [ADR-005](ADR-005.md) (2026-06-07)
- **Date**: 2026-06-07
- **Owner**: TBD — Клод после финализации
- **Related**: [risks.md R-002](../risks.md), [03_IMPL_PLAN.md §8-9 Sprint 6-7](../03_IMPL_PLAN.md), [01_PRD.md §6.3 Pricing](../01_PRD.md), [02_TSD.md §4 Payments](../02_TSD.md)

> **Note**: это DRAFT от Ники (PM). Содержит framing проблемы, опции с pros/cons, рекомендацию PM и open questions для Клода. Клод финализирует решение и поднимает status в Proposed/Accepted.

## Context

**R-002** в risk register: «YooKassa может отклонить recurring-схему в РФ».

История:
- В РФ recurring (auto-renewal) подписок исторически работает иначе, чем в EU/US. YooKassa поддерживает «автоплатежи», но:
  - Требует [сохранение payment_method](https://yookassa.ru/developers/payment-acceptance/scenario-extensions/recurring-payments) (через первый платёж с `save_payment_method=true`)
  - Не все банки-эмитенты поддерживают сохранение карты (особенно карты МИР с определёнными банками)
  - Регуляторика (152-ФЗ + ЦБ) может изменить требования к согласию на auto-renewal в любой момент
- На момент написания SDD (2026-06-06) у нас **нет** подтверждения, что наш конкретный YK shop сможет включить recurring (нужна верификация бизнеса + подача заявки)
- Sprint 6 (week 6 = ~21-25 июля) — первая точка реального теста в YK sandbox. До этого момента мы не знаем

**Без recurring** — пользователь должен каждый месяц вручную нажимать «Продлить» = drop в conversion на retention. Бизнес-impact оценен Полиной как **HIGH** (LTV падает на ~40-60% против recurring).

**С recurring**, который потом не получится включить — мы потратили 1.5d в Sprint 7 (S7.1) и должны срочно переделывать. **Цена позднего обнаружения** ~3-5 дней delay.

PRD §6.3 предполагает месячную/годовую подписку. Outcome ADR-005 определяет, **как реализуем продление**.

---

## Options to analyze

### Вариант А · Чистый recurring (auto-renewal через YK)
Используем YK `save_payment_method=true` + cron-job, который раз в день проверяет подписки с `next_billing_date <= today` и инициирует charge через сохранённый payment_method.

**Pros**:
- Максимальный LTV (стандартная SaaS-механика)
- Минимум friction для юзера — «забыл и платит»
- Прозрачная аналитика (renewal_rate из YK API)

**Cons**:
- **Risk**: YK может отказать в включении recurring (см. R-002). Узнаём только в Sprint 6
- **Risk**: даже если включит — не все карты поддерживают сохранение (часть юзеров всё равно нужен fallback)
- **Cost**: разработка чуть дольше (~1.5d вместо 1d на single-payment flow)
- **Regulatory exposure**: при изменении 152-ФЗ может потребоваться доп. согласие, email уведомления, форма отказа за 30 дней до charge — всё это compliance-trap

---

### Вариант Б · Single-payment + email-reminder
Каждая подписка = одиночный платёж на месяц/год. За 7 дней до окончания → email-cron шлёт «Продли подписку, чтобы не потерять доступ». Юзер кликает CTA → попадает на YK checkout → новый одиночный платёж.

**Pros**:
- **Простота impl**: переиспользуем S6.4-S6.5 (happy path) — никакой новой механики
- **Zero risk** включения recurring (его просто нет)
- **152-ФЗ friendly**: каждый платёж — явное согласие юзера
- **YK поддерживает гарантированно** (это базовый flow)

**Cons**:
- **LTV ниже** (Полина оценивает ~40-60% drop на retention vs recurring) — это HIGH impact на unit economics
- **UX хуже**: юзер обязан помнить + click. Часть забудет → churn
- **Конкуренты с auto-renewal** (Соло, если запустится) получают преимущество в retention

---

### Вариант В (рекомендация PM) · Гибрид: пробуем recurring, авто-fallback на email-reminder
Архитектура с обоими flow в коде:

1. **Default flow**: при checkout сохраняем `payment_method`, ставим `is_auto_renew=true` на subscription
2. **Cron daily** проверяет subscriptions с `next_billing_date <= today`:
   - Если есть `payment_method_id` И `is_auto_renew=true` → пытаемся charge через YK API
   - **Если YK возвращает ошибку** (карта не сохранена / 3DS required / blocked) → автоматически переводим subscription в `auto_renew=false` + триггерим email-reminder flow
3. **Manual renewal flow** (вариант Б) работает как fallback и как self-service:
   - Юзер может в любой момент выключить auto-renew → переходит на email-reminder
   - Если recurring fail'нулся — email говорит «не получилось продлить, нажми сюда»

**Pros**:
- **Best LTV**: для тех, у кого работает recurring — full benefit
- **Resilient**: даже если YK откажет в recurring shop-wide — код уже умеет работать в режиме reminder без переделки
- **Лёгкое A/B testing**: можно forced-disable recurring для cohort'а и сравнить retention
- **Regulatory hedge**: оба механизма уже live, переключение по флагу

**Cons**:
- **Сложнее impl**: ~2.5d вместо 1d (Sprint 7 task S7.1 расширяется)
- **Сложнее testing**: 4 ветки (recurring success / recurring fail → fallback / manual click / cancel)
- **Сложнее аналитика**: разделение метрик renewal_rate на 2 кохорты
- **Email volume больше**: те, у кого recurring работает, всё равно получают «спасибо за продление» (минор)

---

## Pros/cons summary

| Критерий | А (pure recurring) | Б (manual + email) | В (hybrid) |
|---|---|---|---|
| Implementation cost | 1.5d | 1d | 2.5d |
| LTV preservation | 100% | ~50% | 90-100% (зависит от YK approval rate) |
| Risk на YK refusal | HIGH (срочная переделка) | NONE | LOW (auto-fallback) |
| 152-ФЗ exposure | MED | NONE | LOW (явный согласие на recurring) |
| UX качество | Best | Worst | Best |
| Testing complexity | MED | LOW | HIGH |
| Аналитика clarity | HIGH | HIGH | MED (2 cohort) |

---

## Triggers эскалации (когда мы узнаём, что recurring не работает)

Это критично для решения — нам нужно знать **раньше Sprint 7**, что recurring под угрозой:

1. **T-001 · Sprint 6 day 1** (после S6.1): PO регистрирует YK shop в test mode. **Сразу после** регистрации Борис подаёт заявку на включение recurring (а не ждёт Sprint 7). Result: ответ от YK в 1-3 рабочих дня.
2. **T-002 · Sprint 6 day 3**: если YK на «verification pending» — Ника эскалирует к PO для ускорения (документы, бизнес-описание).
3. **T-003 · Sprint 6 day 5**: если на конец Sprint 6 нет approval — **switch на Вариант Б** для MVP, оставив Hybrid как post-MVP work.
4. **T-004 · после первой production-транзакции (week 11-12 beta)**: smoke-test реального charge через recurring. Если decline rate > 30% — пересмотр.

---

## Рекомендация (PM, не финальное решение)

**Вариант В (Hybrid) с fallback на Б, если триггер T-003 сработает.**

Reasoning:
- Бизнес-impact LTV — слишком велик, чтобы сразу отказаться от recurring (Вариант Б)
- Risk YK refusal слишком велик, чтобы построить всё на recurring без plan B (Вариант А)
- Hybrid даёт upside и resilience при +1d стоимости
- Подача заявки на recurring **в Sprint 6 day 1** (не Sprint 7) — критический процессный fix, который даёт раннее знание

**Acceptance criteria для финализации**:
- Sprint 6 task `S6.0` добавляется: «Подать YK заявку на recurring в day 1 of Sprint 6»
- Sprint 7 task `S7.1` расширяется: реализация **обоих** flow (charge + fallback на email)
- Sprint 7 task `S7.4` (email reminders) становится **обязательной**, не optional
- Schema `subscriptions` имеет колонки `is_auto_renew BOOL`, `payment_method_id TEXT NULL`, `last_charge_attempt_at TIMESTAMP`, `last_charge_error TEXT NULL`

---

## Open questions for Клод (Architect)

1. **APScheduler vs ARQ** для daily renewal cron — какой выбран в TSD? Renewal job — это idempotent + scheduled, нужен retry на ошибки YK API. Если ARQ — нужен ли отдельный queue?
2. **Retry policy** при YK transient errors (5xx / timeout): сколько попыток / backoff? Нужно ли human-in-the-loop при N подряд fail'ах?
3. **Email-cron vs trigger-based**: email-reminder за 7 дней — это cron daily-scan или event-driven (planned at subscription create)? Trade-off простоты vs flexibility смены сроков.
4. **Idempotency key** для recurring charge: формат? Если YK сетевой timeout → следующая попытка — это дубль или новый charge? (важно: двойное списание = pain)
5. **Schema decision**: одна таблица `subscriptions` с FSM (active/grace/expired/cancelled) или отдельные `payment_attempts` + `subscriptions`? Audit log как храним?
6. **Cancel flow**: при `auto_renew=false` сразу или в конце текущего period'а? UX vs revenue trade-off.
7. **Grace period**: если recurring fail на day-of — даём ли 3 дня grace до lock-out content'а? PRD не специфицирует.
8. **i18n + emails**: reminder/charge-fail emails — нужны на RU+EN с самого начала или RU-only в v1.0 (т.к. R-009 — RU-only маркетинг)?
9. **YK SCA / 3DS**: при recurring 3DS challenge не показывается юзеру (он не активен). Что делаем при `requires_action`? Только fallback на email?
10. **Аналитика split**: чтобы PO мог отвечать «conversion auto-renew vs manual», нужны какие event'ы в `events` таблице? (см. Sprint 8 S8.4-S8.5)

---

## Что Клод делает после этого draft'а

1. Прочитать PRD §6.3 + TSD §4 на consistency
2. Ответить на 10 open questions выше (хотя бы по 5-6 критичным)
3. Согласовать с PO бюджет +1d в Sprint 7 (Hybrid дороже на 1d vs single-payment)
4. Финализировать в полноценный ADR-005.md (без -DRAFT суффикса)
5. Обновить [risks.md](../risks.md): R-002 → перевести в `🛠️ mitigating` со ссылкой на ADR-005
6. Обновить [03_IMPL_PLAN.md §8-9](../03_IMPL_PLAN.md): S6.0 добавить, S7.1 расширить, S7.4 обязательным
7. Обновить [02_TSD.md §4](../02_TSD.md) — schema `subscriptions` с новыми колонками

---

## Alternatives considered (для финального ADR)

(Заполнится Клодом после ответа на open questions)

### А. Pure recurring — см. выше
### Б. Manual + email — см. выше
### Hybrid (рекомендация) — см. выше
### Г. Defer payment до Sprint 8 — отклонено: ломает gate Sprint 6/7
### Д. Сторонний биллинг (Lava / Robokassa) — отклонено: усложняет vendor surface, 152-ФЗ surface увеличивается

---

**End of DRAFT.** Передаётся Клоду для финализации.
