# Sprint 0 · Daily Standup Log

> Async standup. Каждый агент описывает yesterday/today/blockers.
> Ника каждый день обновляет этот файл и sprint board.

---

## 2026-06-07 (вечер) — Клод автономно отрабатывает топ-5 Ники

### Клод
- **Закрыл №1**: Frontend localStorage schema dump (роль Алекса)
  → [`docs/spec/backend/legacy/localStorage_schema.md`](../../../spec/backend/legacy/localStorage_schema.md)
  10 LS-ключей: shape, writers, readers, lifecycle, backend mapping (SQL для INSERT в users/user_settings/progress/attempts), 4 open questions для Sprint 2-3, 3 migration risks (tier-shift, mentor≠character, partial onboarding).
- **Закрыл №2**: IMPL_PLAN.md updates под ADR-005
  - Sprint 6: добавлен **S6.0** (ранняя YK заявка T-001) и **S6.8** (T-003 gate day 5)
  - Sprint 6.2 расширен schema (subscriptions + subscription_charges)
  - Sprint 7.1: **1.5d → 2.5d** (Hybrid flow с ARQ + retry + fallback)
  - Sprint 7.4: **optional → обязательное 1.5d** (email reminders RU+EN)
  - Sprint 7.8 новый: Grace period 3д
  - Sprint 8.4b новый: renewal-specific события (для PO funnel auto vs manual)
- **Закрыл №4**: TSD §5 schema additions
  - `subscriptions` DDL расширен (is_auto_renew, payment_method_id, last_charge_*, grace_until, cancelled_at) + 3 index'а (due_renewal, due_reminder, sub_active)
  - Новая таблица `subscription_charges` с idempotency_key + 3 index'а (sub_time, idempotency, status pending)
  - §5.4 Hybrid renewal flow расписан (ARQ worker, retry policy, fallback на email-reminder)
  - §5.5 Subscription FSM (6 состояний с ASCII диаграммой transitions)
  - §5.6 ARQ queue config (queue=renewals, 3 cron jobs)
  - Note под ER-диаграммой на 2.1 ссылается на ADR-005
- **Закрыл №5**: Security spec (роль Сергея)
  → [`docs/spec/backend/security/argon2_and_captcha.md`](../../../spec/backend/security/argon2_and_captcha.md)
  - Argon2id params: type=ID, time_cost=3, memory_cost=64MiB, parallelism=2, hash_len=32, salt_len=16 (OWASP 2025 minimum)
  - Re-hash policy при login (postepenно мигрируем хеши без force-reset)
  - Anti-timing-attack pattern (dummy_hash для несуществующих email'ов)
  - **Yandex SmartCaptcha** (не Google reCAPTCHA — RU-юрисдикция, бесплатно до 10K/мес) — invisible mode, conditional на signin/events, всегда на signup/forgot/family
  - Fail-closed в prod, dev bypass через `test-bypass-captcha` token
  - 4 env vars добавлены в `backend/.env.example`
  - 2 open questions для PO: регистрация SmartCaptcha shop (5 мин) + fail-mode policy
- **Закрыл №3**: verify_api_client_mock — contract test против реального HTTP
  - Подход: вместо Prism (требует Node/npm) — написал lightweight FastAPI mock-сервер `scripts/_api_mock_server.py` (15 endpoints зеркалят TSD §3)
  - `scripts/verify_api_client_mock.py` запускает mock на :9001 + static :8000 + Playwright, переключает api-client в useApi=true, гоняет 11 сценариев
  - **11/11 PASS, 0 console errors**: health, getProfile, partial PATCH, settings CRUD, saveAttempt с server-side stars+newly_earned, getProgress consistency, cursor pagination на real HTTP, lesson + paywall, migrate-guest contract (shape из localStorage_schema.md), server-side achievements
  - Regression: local-mode verify_api_client, all_pages_smoke, lesson_inline, navigation — все зелёные

## Итого за сегодня

Все 5 задач топ-5 Ники закрыты автономно за ~2 часа:
- ✅ №1 localStorage schema dump (роль Алекса)
- ✅ №2 IMPL_PLAN updates под ADR-005
- ✅ №3 contract test против mock-сервера
- ✅ №4 TSD §5 schema additions + FSM + ARQ queue
- ✅ №5 Security spec Argon2 + Yandex SmartCaptcha (роль Сергея)

Sprint 0 готов на **95%** — ждёт только PO action S0.0a/b для разблокировки YC migration.

### Ника
- 3 deliverable утра (sprint-1 board, dependency_map, ADR-005-DRAFT) уже в репо
- Открытая queue: Sprint 2 board pre-fill, dependency_map Sprint 4-5, weekly digest 2026-W23

---

## 2026-06-07 — Ника координационная работа (Клод scaffold'ит локально)

### Ника
- **Yesterday**: PO timeline консультация, ADR-004 recommendation, migration_runbook
- **Today** (параллельно с локальным scaffold'ом Клода):
  - Sprint 1 board pre-fill (10 задач S1.1-S1.10 с owner/estimate/verify/deps) + пустые standup/blockers — [`sprint-1/board.md`](../sprint-1/board.md)
  - Cross-team dependency map для Sprint 0-3 (33 dep-записей, 5 critical-path, 4 рекомендации) — [`dependency_map.md`](../dependency_map.md)
  - ADR-005 DRAFT (YooKassa recurring fallback): 3 опции, рекомендация Hybrid, 10 open questions для Клода — [`ADR-005-DRAFT.md`](../../../spec/backend/decisions/ADR-005-DRAFT.md)
- **Blockers**: всё ещё жду PO action S0.0a/b для разблокировки миграции (но не критично пока Клод scaffold'ит локально)

### Клод (Architect)
- **Yesterday**: ADR-004 + risks update
- **Today**: scaffold backend/ локально (Variant 1 из 5-вариантного analysis) — pyproject, app/, models, basic security, OpenAPI skeleton с /health. Push отложен до S0.1 миграции.
- **Next**: ответ на 10 open questions в ADR-005-DRAFT когда дойдёт очередь

### PO (Иван)
- **Today**: «PO actions YC org / GH email / IAM сделаю позже». Подтвердил «продолжай» для Клода scaffold
- **Pending**: S0.0a/b к завтра-послезавтра желательно

### Дима (DevOps)
- ожидание PO action для миграции
- может начать `docker-compose.yml` черновик локально (S0.3) если синхронизируется с Клодом по scaffold

### Борис (Backend)
- idle, может ознакомиться со scaffold'ом Клода когда тот закоммитит локально
- pre-read TSD §3 (auth endpoints) перед Sprint 1

### Алекс, Катя, остальные
- idle

---

## 2026-06-06 PM — Sprint 0 АКТИВИРОВАН (ADR-004 accepted)

### Ника
- **Yesterday**: nothing
- **Today**: проконсультировала PO по timeline (PERT P80 = 17 окт), по альтернативам GH; PO принял миграцию на YC Code Repo; обновила board, blockers, risks; runbook для Димы готов
- **Blockers**: жду PO action S0.0a/b (YC org + GH email)

### Клод (Architect)
- **Today**: написал ADR-004 (single-vendor YC), обновил risks.md (R-001 → mitigation, R-011 strengthened), board.md, blockers.md
- **Next**: ждать завершения миграции для дальнейших ADR (R-002 YooKassa fallback strategy в очереди)

### PO (Иван)
- **Today**: принял решения по timeline + миграции
- **Action items до конца дня**: создать YC organization + новый GH email + IAM-role Диме

### Дима (DevOps)
- **Today**: ожидание PO action для старта миграции (по runbook)
- **Estimate**: 3-4 часа на саму миграцию, +1 день на CI pipeline

### Борис, Алекс, остальные
- idle до завершения миграции, могут продолжать локально

---

## 2026-06-06 (Ника прибыла, sprint не стартовал) — earlier

### Ника
- **Yesterday**: nothing (это мой первый день)
- **Today**: пройти onboarding ([../../nika_onboarding.md](../../nika_onboarding.md)), создать risk register, подготовить пустой sprint board
- **Blockers**: весь sprint заблокирован R-001 (GitHub аккаунт)

### Борис
- **Yesterday**: ещё не подключился к проекту
- **Today**: —
- **Blockers**: ожидание разблокировки GitHub, чтобы можно было начать scaffold

### PO (Иван)
- **Yesterday**: написал в GitHub support
- **Today**: ждёт ответ
- **Blockers**: GitHub support response time

### Остальные
- Frontend (Алекс): sprint 0 не его — следующая работа после старта backend
- Контент (Катя): закончила Phase 1, ждёт Phase 2 заказов
- QA (Квинн): дежурит на verify-suite (15 скриптов зелёные)
- DevOps (Дима): ждёт S0.5 в очереди после S0.4
- Другие: idle

---

## Шаблон будущих записей

```markdown
## YYYY-MM-DD

### Ника
- Yesterday: ...
- Today: ...
- Blockers: ...

### Борис
- Yesterday: ...
- Today: ...
- Blockers: ...

...
```
