# Sprint 2 · Board · OAuth + анонимный режим + миграция гостя

> **Status**: ⏸️ **Pending start** — ждёт закрытия Sprint 1 (auth foundation + verify_signup_flow.py зелёный)
> **Цель**: можно войти через Yandex/VK; гость может пройти первые уроки и потом «сохранить» прогресс без потери
> **Source**: [03_IMPL_PLAN.md §4 Sprint 2](../../../spec/backend/03_IMPL_PLAN.md)
> **Estimate duration**: week 2 (5 days)
> **Owner**: Борис (Backend) + Алекс (frontend integration) + Клод (review), координация — Ника
> **Cross-team deps**: см. [dependency_map.md](../dependency_map.md) (Sprint 2 раздел)

## Gate
✅ Yandex и VK login работают на staging.
✅ Гость может пройти урок → зарегистрироваться → прогресс перенесён без потерь.
✅ Cron `cleanup_anonymous_sessions` удаляет сессии старше TTL=3д (по [ADR-001](../../../spec/backend/decisions/ADR-001.md)).
✅ `verify_oauth_yandex.py`, `verify_oauth_vk.py`, `verify_guest_to_account.py` зелёные.

## Tasks

### TODO (not started)

| ID | Task | Owner | Estimate | Verify | Depends on |
|---|---|---|---|---|---|
| ⬜ S2.1 | Yandex OAuth: register app в Я.OAuth console, `client_id` / `secret` в env (`backend/.env.example` тоже обновить) | Борис + PO action | 0.5d | manual: вошёл через Я-аккаунт на dev | PO action D2-1 (creds), Sprint 1 closed |
| ⬜ S2.2 | `app/core/oauth.py` — generic OAuth helper (state token, PKCE, callback validation) + Yandex strategy | Борис | 1d | unit tests с mock provider | S2.1 (creds для integration) |
| ⬜ S2.3 | `GET /auth/oauth/yandex/start` + `GET /auth/oauth/yandex/callback` — провязка с `users` + `oauth_accounts` таблицами | Борис | 1d | integration test с mock'нутым Yandex | S2.2 |
| ⬜ S2.4 | VK OAuth — register VK app + повторить pattern Yandex (`vk/start`, `vk/callback`) | Борис + PO action | 0.5d | integration test | S2.3 (pattern), D2-2 (VK creds) |
| ⬜ S2.5 | `POST /auth/migrate-guest` — приём localStorage payload → INSERT в `users`, `user_settings`, `progress`, `attempts` + transaction safety. **Контракт**: см. [`legacy/localStorage_schema.md`](../../../spec/backend/legacy/localStorage_schema.md) (10 LS-ключей, SQL mapping готов) | Борис | 1d | unit + E2E test (полный shape из schema) | S1.4 (signup), Sprint 1 closed |
| ⬜ S2.6 | APScheduler cron `cleanup_anonymous_sessions`: daily 03:00 MSK, DELETE FROM users WHERE is_anonymous=true AND created_at < now() - INTERVAL '3 days' (TTL из [ADR-001](../../../spec/backend/decisions/ADR-001.md)) | Борис | 0.5d | unit-test cron + integration (insert старого юзера → cron → удалён) | S1.1 (users схема), [ADR-001](../../../spec/backend/decisions/ADR-001.md) |
| ⬜ S2.7 | Frontend: модал «Зарегистрируйся, чтобы не потерять прогресс» — триггер на 3-й завершённый урок гостя + после TTL warning | Алекс | 0.5d | UX-проход + verify_guest_modal.py | S2.5 (API contract), UX от Юли (опц.) |
| ⬜ S2.8 | localStorage-to-API adapter с graceful fallback (offline mode): `assets/js/api-client.js` patch — при network error читает/пишет в LS, при reconnect — flush очереди в `/auth/migrate-guest` | Алекс | 1.5d | verify_offline_mode.py | S2.5 |
| ⬜ S2.9 | **OpenAPI contract review**: Клод ревьюит `/auth/migrate-guest` shape **до** implementation (предотвращение rework, как в Sprint 1) | Клод | 0.5d | контракт зафиксирован в `openapi.yaml`, ссылается на schema из `localStorage_schema.md` | S0.6 OpenAPI skeleton |
| ⬜ S2.10 | **CTA copy + UX wording**: «Сохрани прогресс» модал — RU+EN тексты, кнопки, social-proof («тысячи уже сохранили») | Полина + Алекс | 0.5d | wording в `data/locales/ru.json` + `en.json` | S2.7 (модал готов) |

### IN PROGRESS
— (sprint не стартовал)

### BLOCKED
— (предварительный список):
- ⛔ Все задачи S2.x BLOCKED Sprint 1 завершением (gate: `verify_signup_flow.py` зелёный)
- ⛔ S2.1 потенциально BLOCKED PO action (Yandex OAuth app — `client_id` / `secret`)
- ⛔ S2.4 потенциально BLOCKED PO action (VK OAuth app)

### DONE
— нет

## Dependencies (cross-team)

См. [dependency_map.md](../dependency_map.md) Sprint 2 раздел. Топ-3 критичных:

- **PO → Борис**: Yandex OAuth `client_id` / `secret` к **day 1** (S2.1) — заказать на ~Friday Sprint 1
- **PO → Борис**: VK OAuth `client_id` / `secret` к **day 3** (S2.4)
- **Клод → Борис**: ADR-001 импл-подсказки (APScheduler cron details) — уже готовы, см. [ADR-001](../../../spec/backend/decisions/ADR-001.md)

## Pre-existing artifacts (что НЕ нужно делать с нуля)

- ✅ [`docs/spec/backend/legacy/localStorage_schema.md`](../../../spec/backend/legacy/localStorage_schema.md) — 10 LS-ключей с SQL mapping. **Борис читает первым делом** — там готовая структура INSERT'ов для S2.5.
- ✅ [ADR-001](../../../spec/backend/decisions/ADR-001.md) — TTL 3 дня политика гостевых данных (для S2.6 cron)
- ✅ [`docs/spec/backend/security/argon2_and_captcha.md`](../../../spec/backend/security/argon2_and_captcha.md) — Sergey'ев security spec (Argon2 + SmartCaptcha) — релевантно для S2.7 (модал с защитой от ботов при signup от гостя)

## Risks для этого sprint'а

См. [risks.md](../../../spec/backend/risks.md):
- **R-005** (потеря localStorage) — Sprint 2 закрывает основной mitigation: S2.5 + S2.7 модал = guest→account migration
- **R-007** (бот-регистрация) — Yandex SmartCaptcha включён в S2.7 модал и signup-формах (по security spec)
- **R-003** (заболевание Бориса) — S2.5 критичен; если Борис уйдёт, документация контракта в `localStorage_schema.md` + OpenAPI позволит hot-swap'у догнать

## Pre-sprint checklist (Ника проверяет в pre-planning)

- [ ] Sprint 1 gate зелёный (`verify_signup_flow.py` + welcome email работает)
- [ ] PO заказал Yandex OAuth app (в Yandex.OAuth console)
- [ ] PO заказал VK OAuth app (в VK Developers)
- [ ] Борис прочитал `localStorage_schema.md` и подготовил черновик SQL для `/migrate-guest`
- [ ] Клод приготовился ревьюить `/migrate-guest` OpenAPI shape (day 2)
- [ ] APScheduler добавлен в `backend/pyproject.toml` (если ещё не в Sprint 0)
- [ ] Алекс ознакомился с TSD §3.3 (OAuth flow) и текущим api-client.js

## Daily updates
- См. [standup.md](standup.md)

## Notes
- Sprint **не активирован**. Активация после прохождения Sprint 1 gate.
- Critical path: S2.1 → S2.2 → S2.3 → S2.5 (parallel S2.4); S2.6 параллельно с S2.5; S2.7/S2.8 в день 4-5
- S2.5 — самый рискованный кусок: ошибка в transaction = потерянный прогресс юзера. **Mandatory** integration test со 100+ attempts + проверка idempotency.
- Если YK creds не подоспеют в Sprint 1 для Sprint 2 day 1 — fallback: переключить order на VK first (PO assured подаст обе заявки одновременно).
