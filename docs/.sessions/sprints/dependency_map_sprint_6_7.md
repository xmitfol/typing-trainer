# Cross-team Dependency Map · Sprints 6-7 (Payments)

> **Owner**: Ника (PM)
> **Updated**: 2026-06-07
> **Why separate file**: эти 2 sprint'а — самая сложная связка из-за [ADR-005 Hybrid renewal](../../spec/backend/decisions/ADR-005.md) + 6 ARQ задач + критический T-001…T-003 timeline + внешние зависимости (YK approval 1-3 дня). Заслуживает фокусного документа отдельно от [dependency_map.md](dependency_map.md) (Sprint 0-5).
> **Parent**: [dependency_map.md](dependency_map.md) — общая методика и format

## Как читать таблицу

- **From / To** — производитель / потребитель артефакта
- **What** — что именно
- **When needed** — последний срок без блокировки
- **Critical path?** — Yes = задержка двигает сроки sprint'а / релиза
- **T-trigger?** — какой T-trigger из ADR-005 эта dep активирует (если есть)
- **Status** — 🟢 in time / 🟡 at risk / 🔴 blocked / ✅ delivered

---

## Sprint 6 (week 6, Payments happy path + S6.0 early YK application)

> **Goal**: можно купить подписку в test mode и unlock'нуть полный курс. **И уже знаем** к day 5, доступен ли recurring (T-003 gate).

| # | From | To | What | When needed | Critical | T-trigger | Status |
|---|---|---|---|---|---|---|---|
| **D6-1** ⭐ | **PO + Борис** | **YK** | **YK shop registration (test + prod) + recurring application submitted** (S6.0). PO регистрирует shop в YK кабинете, Борис **в тот же день** подаёт заявку на recurring (бизнес-верификация). YK отвечает 1-3 рабочих дня. | Sprint 6 day 1 (заявка ушла) | **Yes — самый critical-path** | **T-001** (триггерит весь sprint) | pending |
| D6-2 | YK | Борис | API credentials (`shop_id`, `secret_key`) для test mode | Sprint 6 day 1 (сразу после D6-1) | Yes | T-001 | pending |
| D6-3 | YK | Борис | Webhook signing secret + URL whitelist setup в YK кабинете | Sprint 6 day 2 (для S6.5) | Yes | — | pending |
| **D6-4** ⭐ | **Клод** | **Борис** | **ADR-005 schema impl-hints**: `subscriptions` ALTER COLUMN'ы (`is_auto_renew`, `payment_method_id`, `last_charge_attempt_at`, `last_charge_error`, `last_reminder_sent_at`, `grace_until`) + новая таблица `subscription_charges` (audit log). Точные типы из [ADR-005 Q5](../../spec/backend/decisions/ADR-005.md) и [TSD §5.6](../../spec/backend/02_TSD.md). | Sprint 6 day 1 (до S6.2) | Yes | — | 🟢 ADR-005 готов, нужен code-pointer |
| D6-5 | Полина | Борис | **Pricing constants**: окончательные суммы планов в копейках для `subscription_charges.amount_kopecks` (monthly, yearly, family). Источник [pricing.js](../../../assets/js/pricing.js) — проверить, что финальные числа совпадают. | Sprint 6 day 1 (для S6.3) | Yes | — | pending (Полина подтверждает) |
| D6-6 | Борис | Алекс | **API contracts**: `GET /pricing/plans`, `POST /pricing/checkout` (request: `{plan_id, period}`, response: `{checkout_url, payment_id}`), `POST /webhooks/yookassa` (контракт для логирования) | Sprint 6 day 2 (для S6.7 параллельно) | Yes | — | pending |
| **D6-7** ⭐ | **Алекс + Борис** | **Алекс + Клод** | **Frontend `pricing.html` wire к `/pricing/checkout`** — парный код Алекс/Борис: Алекс делает форму, Борис делает endpoint, Клод ревьюит integration в один день. Без пары — день простоя на API discovery. | Sprint 6 day 4-5 (для S6.7) | Yes | — | pending |
| D6-8 | YK | Борис | **Recurring approval response** — `approved` / `rejected` / `pending verification`. Если pending → эскалация T-002. | Sprint 6 day 3 (ожидание ~48ч от D6-1) | Yes | **T-002** | pending |
| D6-9 | Дима | Борис | Production webhook URL зарезервирован в DNS (`payments-webhook.typing-trainer.ru`) + Nginx routing → FastAPI `/webhooks/yookassa` | Sprint 6 day 3 | Yes (для D6-3 setup) | — | pending |
| D6-10 | Тимофей + Катя | Полина review | **Welcome-to-paid email RU+EN draft** (S6.6) — copy для «спасибо за оплату, receipt PDF приложен». Полина ревьюит tone. | Sprint 6 day 4 | No (можно plain-text fallback на day 5) | — | pending |
| D6-11 | Дима | Борис | **Receipt PDF rendering**: какой libs (`reportlab` / `weasyprint`?) + где хранить (`Yandex S3` per [TSD §6.1](../../spec/backend/02_TSD.md))? | Sprint 6 day 3 (для S6.6) | No (можно email-only без PDF на MVP) | — | pending |
| D6-12 | Сергей | Борис | **YK webhook signature validation спецификация**: алгоритм + reference implementation. Без этого S6.5 = security hole. | Sprint 6 day 2 | Yes | — | pending |
| **D6-13** ⭐ | **Ника + Клод** | **Команда** | **T-003 gate decision (day 5)**: на основе D6-8 (YK response) решаем — продолжаем Hybrid или switch на Variant Б (single payment + email-reminder только, без `save_payment_method=true`). Решение фиксируется в weekly digest. | Sprint 6 day 5 (gate) | **Yes — определяет Sprint 7** | **T-003** | pending |
| D6-14 | Борис | Квинн | `verify_payment_e2e.py` — test card → webhook → subscription active → урок 6+ открыт. Сценарий зависит от T-003 (Hybrid vs Б). | Sprint 6 day 5 | Yes (gate) | — | pending |
| D6-15 | PO | Борис | **Реальная активированная карта (Visa/Mir) для test mode**: на ней YK позволяет реально гонять recurring sandbox. Нужна заранее. | Sprint 6 day 3 (до S6.4 integration test) | Yes (без неё — только мок-тесты, риск не поймать прод-баг) | T-001 (parallel) | pending |

---

## Sprint 7 (week 7, Hybrid renewal + S7.4 emails + S7.8 grace)

> **Goal**: Hybrid renewal — recurring работает, fallback на email-reminder работает, grace period 3д работает. Edge cases (3DS, declined, expired card) обработаны.

| # | From | To | What | When needed | Critical | T-trigger | Status |
|---|---|---|---|---|---|---|---|
| **D7-1** ⭐ | **Дима + Борис** | **ARQ infrastructure** | **ARQ worker setup** в Docker Compose dev + prod: отдельный контейнер `arq-worker-renewals` с `queue=renewals` (per [TSD §5.6](../../spec/backend/02_TSD.md)). Включая `arq` в `pyproject.toml`, `app/tasks/queues.py` config, healthcheck, restart policy. **Самая сложная инфра-зависимость.** | Sprint 7 day 1 (до S7.1) | **Yes** | — | pending |
| D7-2 | Клод | Борис | **ARQ + cron pattern impl-hints**: example `attempt_due_renewals` cron job с idempotency через `subscription_charges.idempotency_key`. Per [ADR-005 Q1, Q4](../../spec/backend/decisions/ADR-005.md). | Sprint 7 day 1 | Yes | — | 🟢 ADR-005 готов, code-pointer |
| **D7-3** ⭐ | **Тимофей draft → Катя copy-edit → Борис wire** | **Email-провайдер (Y360)** | **Email templates RU+EN** для 3 событий: `subscription_renewal_reminder_7d`, `subscription_renewal_reminder_1d`, `subscription_renewal_failed_day_of` (per [ADR-005 Q3, Q8](../../spec/backend/decisions/ADR-005.md)). Pipeline: Тимофей пишет draft → Катя редактирует tone/CTA → Борис wire в `app/core/emails/templates/<event>/{ru,en}.jinja2`. | Sprint 7 day 2 (для S7.4) | Yes | — | pending |
| **D7-4** ⭐ | **YK sandbox + PO** | **Борис + Квинн** | **YK sandbox testing с реальной активной картой**: нужна **активированная** test card от PO (привязана к real account + 3DS включён). YK test mode без реальной карты не позволит триггернуть `requires_action` (3DS challenge) и `payment_method_expired` сценарии. | Sprint 7 day 3 (для S7.2 failure paths) | Yes | — | pending |
| D7-5 | Клод | Борис | **Retry policy code-pattern** (3 attempts, backoff 5s/25s/125s, exponential, per [ADR-005 Q2](../../spec/backend/decisions/ADR-005.md)) — pseudo-code или decorator pattern для ARQ. | Sprint 7 day 1 | Yes | — | 🟢 ADR-005 готов |
| D7-6 | Борис | Алекс | **API contract `GET /me/subscriptions`** + `POST /me/subscriptions/{id}/cancel` — Алекс показывает текущий статус + `auto_renew on/off` toggle на dashboard и profile. | Sprint 7 day 3 (для S7.7) | Yes | — | pending |
| **D7-7** ⭐ | **Алекс + Полина** | **Алекс** | **Grace period UX flow**: дизайн banner «Подписка истекла, но контент доступен ещё 3 дня — обновите карту» + CTA «Обновить карту» (deep-link на /pricing с pre-filled plan). RU+EN copy. | Sprint 7 day 4 (для S7.8 frontend части) | Yes (gate) | — | pending |
| D7-8 | Сергей | Борис | **Compliance check Hybrid renewal**: 152-ФЗ требует явного согласия на recurring (галка при checkout «Согласен на автопродление»). Сергей confirm'ит wording + что checkbox должен быть unchecked by default или checked OK? | Sprint 7 day 1 | Yes (legal risk) | — | pending |
| D7-9 | Полина | Борис | **Email-reminder timing constants**: окончательные сроки — 7д до expiry, 1д до expiry, day-of-fail (`grace_until`). Подтверждение по [ADR-005 Q3](../../spec/backend/decisions/ADR-005.md). | Sprint 7 day 2 | No (defaults в ADR-005 готовы) | — | pending |
| D7-10 | Борис | Дима | **Monitoring для ARQ worker**: Prometheus metric `arq_jobs_failed_total{queue=renewals}` + alert «> 5% renewal'ов fail'нулись за день» (per [ADR-005 Q2](../../spec/backend/decisions/ADR-005.md)). | Sprint 7 day 4 | No (Sprint 10 production-ready тоже покрывает) | — | pending |
| D7-11 | Дима | Борис | **Cron scheduling validation**: ARQ cron `09:00 MSK` и `03:00 MSK` действительно запускаются на staging — таймзоны проверены. | Sprint 7 day 3 | Yes (functional gate) | — | pending |
| D7-12 | Борис | Квинн | `verify_payment_lifecycle.py` — 5 веток: buy → activate → renew_auto / renew_manual / grace → cancel → expire. | Sprint 7 day 5 | Yes (gate) | — | pending |
| **D7-13** ⭐ | **Алекс + Квинн** | **— (test infra)** | **Test fixture для time travel**: чтобы протестировать 3-дневный grace period в integration / Playwright. Опция А: `freezegun` в backend integration test. Опция Б: API endpoint `POST /testing/advance-time` (dev-only). | Sprint 7 day 2 | Yes (без него grace + cron logic нельзя E2E-протестировать за 5 дней) | — | pending |
| D7-14 | Тимофей | Все | **Документация payments flow** в `docs/spec/backend/payments_guide.md` (Hybrid vs Б, FSM state diagram, retry policy, idempotency). | Sprint 7 day 5 | No (post-sprint OK, для onboarding нового dev'а) | — | pending |
| D7-15 | Борис + Дима | Сергей | **Security audit на subscription_charges PII**: что в `metadata` JSONB не должен попасть card number / CVV (YK не отдаёт, но проверить). | Sprint 7 day 5 | No (Sprint 10 security audit покрывает) | — | pending |

---

## T-trigger map (что эскалирует при сработке)

| Trigger | Когда | Если СРАБАТЫВАЕТ → блокируется | Recovery |
|---|---|---|---|
| **T-001** (Sprint 6 day 1) | YK заявка не подана (PO нет credentials, нет верификации бизнеса) | D6-1, D6-2, D6-8, D6-15 → **весь Sprint 6 visa на mock'ах**, нельзя E2E test | **Recovery path**: PO эскалирует business verification в YK enterprise support (Telegram). Если ≥48ч молчания — switch на Variant Б немедленно (не ждать T-003). Sprint 7 теряет S7.1 Hybrid логику, оставляет email-reminder only. |
| **T-002** (Sprint 6 day 3) | YK на `verification_pending` ≥3 рабочих дня | D6-8 → не знаем `approved/rejected` до Sprint 7 → S7.1 пишется blind | **Recovery path**: Ника эскалирует в YK support через PO. Если ≥day 4 не разрешилось → preemptive switch на Б для Sprint 7 day 1, можно вернуться на Hybrid в Sprint 11-12 post-MVP (если YK approve позже). |
| **T-003** (Sprint 6 day 5) | YK REJECTED recurring | **D6-13 решение Switch → Б**. Каскад: S6.4 убирает `save_payment_method=true`. S7.1 упрощается с 2.5d на 1d (только manual). S7.8 grace упрощается (нет recurring fail, только expiry). S8.4b упрощается (нет auto vs manual split). **Sprint 7 теряет ~1d сложности, но критичность D7-1 ARQ infra остаётся** (нужно для email-reminder cron). | **Recovery path**: Вариант Б в production-ready форме на week 11-12. После beta — повторная попытка YK enterprise approval (T-004). Email-reminder flow остаётся как always-on bridge. |
| **T-004** (week 11-12 beta, после первых prod транзакций) | Recurring decline rate > 30% в проде | Не блокирует sprint, но триггерит пересмотр Hybrid → возможно forced switch на Б | **Recovery path**: A/B test forced-disable recurring для cohort'а, замер retention. Если retention не падает > 10% — оставить Hybrid с улучшениями (например, smart-retry через 24ч). |

### Visual flow

```
Sprint 6 day 1   day 3   day 5   Sprint 7 day 1 ────────► day 5
     │             │       │          │                      │
   T-001         T-002   T-003      D7-1 ARQ              D7-12 gate
     │             │       │       starts                    │
     ▼             ▼       ▼          │                      ▼
   D6-1         escalate  GATE     Hybrid OR Б           verify_payment_lifecycle
   submit                 decision  branch chosen
```

---

## Critical-path summary (Sprint 6-7)

**Top-7 контрактов, задержка которых = задержка sprint'а:**

1. **D6-1** (YK shop + recurring application, S6.0) — Sprint 6 day 1 — без этого весь sprint на mock'ах, T-001 trigger
2. **D6-13** (T-003 gate decision day 5) — определяет scope Sprint 7
3. **D7-1** (ARQ worker infra setup) — Sprint 7 day 1 — без него нет cron'ов вообще (даже в Variant Б нужно для email-reminder)
4. **D7-3** (Email templates pipeline Тимофей → Катя → Борис) — Sprint 7 day 2 — без email'ов Hybrid не работает
5. **D7-4** (YK sandbox + активная test card от PO) — Sprint 7 day 3 — без неё failure paths не тестируются
6. **D7-7** (Grace UX flow) — Sprint 7 day 4 — gate verify зависит
7. **D6-12** (YK webhook signature validation от Сергея) — Sprint 6 day 2 — без неё S6.5 = security hole

---

## Анти-зависимости (что НЕ требует cross-team coordination — каждый делает соло)

Чтобы команда не ждала впустую, эти задачи можно делать **в любое время independently**:

- **S6.2** Alembic migration `subscriptions` ALTER + `subscription_charges` CREATE — Борис, нужны только [ADR-005 Q5](../../spec/backend/decisions/ADR-005.md) schema (готовы).
- **S6.3** `GET /pricing/plans` — Борис, читает из [pricing.js](../../../assets/js/pricing.js) (готов).
- **S6.5** webhook signature validation + idempotency — Борис, нужна спецификация YK (открытая документация + D6-12 от Сергея).
- **S7.3** `POST /me/subscriptions/{id}/cancel` (cancel at end of period, не immediate) — Борис, простая логика per [ADR-005 Q6](../../spec/backend/decisions/ADR-005.md).
- **S7.6** `subscription_charges` audit log service — Борис, читает таблицу из S6.2.
- **S7.5** Idempotency stress test (k6) — Дима + Квинн, не блокирует Бориса.
- **Email templates draft** (D7-3 первая фаза) — Тимофей, можно начинать ещё в Sprint 6.
- **S7.7 frontend dashboard статус подписки** — Алекс, нужен только D7-6 contract (можно работать против mock'а).

---

## Рекомендации (payments-sprint specific)

### 1. **Mock-first YK integration (parallel-track testing)**

С day 1 Sprint 6 Борис строит `yk_client_mock.py` (response-recorded fixtures от Сергея + публичной YK документации). Все unit tests + большинство integration tests гоняются на mock'ах. Реальный YK sandbox используется только для:
- D6-15 manual test с реальной картой (1 раз в день, ручной check)
- T-004 smoke в proде

**Effect**: разработка не блокируется ожиданием T-001 (даже если YK approval идёт 3 дня — код пишется без простоя). E2E zelёный достигается на mock'ах, прод-smoke отдельно.

### 2. **T-001 ranking как «hardest deadline» Sprint 6**

T-001 (D6-1: YK заявка подана в day 1) — **самый жёсткий timer внешней зависимости** во всём проекте. Никакой другой actor (Yandex 360, VK OAuth, even Yandex Cloud setup) не имеет 1-3 рабочих дней SLA с такой же ценой задержки (вся payments-логика visa на ответе).

**Mitigation pattern**:
- **PO action: подаёт за неделю до Sprint 6 start** (в pre-sprint Friday Sprint 5). Buffer = 5 рабочих дней. Если verification pending — есть запас.
- **Ника tracking**: в weekly digest пятницы Sprint 5 явно отмечает «YK application: submitted? approved? pending?» — single line, всегда наверху.
- **Backup channel**: PO открывает Telegram-чат с YK enterprise support (premium SLA если есть). Эскалация не через email-тикеты.

### 3. **T-003 «GATE day 5 of Sprint 6» — single decision point, not gradient**

Когда D6-13 решение принимается, не оставлять «50/50 wait and see». Strict binary:
- **Yes (Hybrid)** → Sprint 7 идёт по plan A (S7.1 = 2.5d, all 6 ARQ задач)
- **No (Variant Б)** → Sprint 7 идёт по plan B (S7.1 = 1d, S6.4 patched, S8.4b упрощается)

Чёткое решение зафиксировано в weekly digest 2026-W{6 завершения} с подписью Ники + Клода + PO. **Никаких "let's keep Hybrid optional and see in Sprint 7"** — это даст hybrid-of-hybrid debt и Sprint 7 потеряет 2 дня.

### 4. **Parallel-track email infrastructure (Sprint 6 day 4 — Sprint 7 day 1)**

Тимофей пишет 3 email templates draft (D7-3 первая фаза) **в Sprint 6 day 4-5**, не ждёт Sprint 7. Katy editing в Sprint 7 day 1. Борис wire в Sprint 7 day 2 (сразу после ARQ worker stand-up D7-1). 

**Effect**: D7-3 pipeline (Тимофей→Катя→Борис) занимает 3 sequential дня обычно. Сжатие через parallel-start на Sprint 6 day 4 даёт finished templates к Sprint 7 day 2 без блокировки S7.4. Иначе S7.4 уезжает в Sprint 7 day 4 (1.5d → 0.5d на email wire), что блокирует gate.

### 5. **Один dedicated Ника-check ежедневно (для Sprint 6-7 только)**

В обычные sprint'ы Ника делает «3-question check» по dep map утром. Для Sprint 6-7 добавляется отдельный 5-минутный T-trigger check:
- **Sprint 6 day 1**: D6-1 submitted? credentials в env?
- **Sprint 6 day 3**: D6-8 approved? Если pending — escalate T-002 today.
- **Sprint 6 day 5**: T-003 decision documented? Sprint 7 scope clear?
- **Sprint 7 day 1**: D7-1 ARQ worker up? D7-2/D7-5 code-hints у Бориса?
- **Sprint 7 day 3**: D7-4 active card получена? D7-11 cron в правильной TZ?

Каждый check = 1 строка в [standup.md](sprint-6/standup.md) с явным timestamp.

---

## Что НЕ покрыто этим документом

- **Sprint 8** (analytics) — S8.4b renewal events косвенно связан, но deps добавятся в отдельном sub-документе перед Sprint 7 closing
- **Sprint 9-10** dependencies — GDPR/family/production-ready, отдельные документы по мере приближения
- **Marketing launch** (Sprint 11-12) — Марина deps, добавятся позже

---

## Changelog

| Date | Author | Change |
|---|---|---|
| 2026-06-07 | Ника | Initial sub-документ для Sprint 6-7 (15 deps Sprint 6 + 15 deps Sprint 7 + T-trigger map + 5 рекомендаций специфичных для payments) |
