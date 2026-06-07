# Sprint 3 · Board · Profile + Progress sync

> **Status**: ⏸️ **Pending start** — ждёт закрытия Sprint 2 (OAuth + migrate-guest + verify_guest_to_account.py зелёный)
> **Цель**: все данные с фронта (profile, settings, progress, attempts) синхронизируются с БД; cross-device sync через API.
> **Source**: [03_IMPL_PLAN.md §5 Sprint 3](../../../spec/backend/03_IMPL_PLAN.md)
> **Estimate duration**: week 3 (5 days, ~7.5 dev-days плана)
> **Owner**: Борис (Backend) + Алекс (frontend wire) + Клод (ADR-002 impl-hints) + Квинн (verify gate). Координация — Ника.
> **Cross-team deps**: см. [dependency_map.md](../dependency_map.md) Sprint 3 раздел (D3-1 … D3-10)

## Критичность

**🔴 Critical-path для дедлайна.** Sync прогресса = **единственная** причина для юзера регистрироваться (а не оставаться в guest mode). Если Sprint 3 уезжает — слетают Sprint 4 (achievements), Sprint 5 (paywall) и подтягиваются к open beta. Полагаемся на **уже готовый api-client.js** (Sprint 2: verify_api_client_mock 11/11 PASS) — это **ускоряет S3.8**.

## Gate

✅ `GET /me`, `PATCH /me` (с tier-shift + AGE_DOWNGRADE check по [ADR-002](../../../spec/backend/decisions/ADR-002.md)), `DELETE /me` работают.
✅ `GET/PATCH /me/settings`, `GET /me/progress`, `POST /me/progress` (atomic), `GET /me/history?cursor=&limit=` работают.
✅ Frontend (profile.js, dashboard.js, task.js) читают через `apiClient` вместо `localStorage` (с graceful fallback).
✅ `verify_sync_across_devices.py` зелёный: завершить упражнение на устройстве A → на устройстве B виден прогресс через ≤5 сек.
✅ AGE_DOWNGRADE policy: попытка `audience: adult → teen` отбрасывается 422 `AGE_DOWNGRADE_FORBIDDEN` (unit + integration tests).

## Tasks

### TODO (not started)

| ID | Task | Owner | Estimate | Verify | Depends on |
|---|---|---|---|---|---|
| ⬜ S3.1 | Alembic migration: `progress`, `attempts` таблицы (схема per [TSD §2.2](../../../spec/backend/02_TSD.md), keyed `(user_id, tier, lesson_num)` per [ADR-002](../../../spec/backend/decisions/ADR-002.md)) | Борис | 0.5d | `\d+ progress`, `\d+ attempts` корректны; `alembic upgrade head` чистая БД | Sprint 2 closed (`users` уже есть) |
| ⬜ S3.2 | `GET /me`, `PATCH /me` (tier-shift logic + AGE_DOWNGRADE 422), `DELETE /me` (soft delete) — точная мутация-таблица из [ADR-002](../../../spec/backend/decisions/ADR-002.md) §«Что разрешено менять»; response содержит `tier_changed`, `old_tier`, `new_tier` | Борис | 1.5d | integration tests happy + AGE_DOWNGRADE reject + tier_shift response | D3-5 (Клод impl-hints от ADR-002), S3.1 |
| ⬜ S3.3 | `GET /me/settings`, `PATCH /me/settings` — поля per `localStorage_schema.md` §1 backend mapping (`keyboard_type/layout`, `finger_hint`, `key_sound`, `metronome`, `task_zoom`, `hide_indicator`, `preview_off`) | Борис | 0.5d | integration tests round-trip + defaults | S3.1, [`localStorage_schema.md`](../../../spec/backend/legacy/localStorage_schema.md) §1 |
| ⬜ S3.4 | `POST /me/progress` — atomic save (progress UPSERT + attempt INSERT + achievements trigger placeholder Sprint 4). Shape per [`localStorage_schema.md`](../../../spec/backend/legacy/localStorage_schema.md) §2-3: `{tier, lesson_num, stars, best_wpm, best_accuracy, best_time_sec, completed_at, attempt: {wpm, accuracy, duration_sec, errors?, rhythm?}}`. **bestWPM cap 1500** (`LEAST(value, 1500)`). | Борис | 1.5d | integration test concurrency (2 параллельных POST одного юзера → одна row через `INSERT ... ON CONFLICT DO UPDATE`), idempotency test | S3.1, [`localStorage_schema.md`](../../../spec/backend/legacy/localStorage_schema.md) §2-3 |
| ⬜ S3.5 | `GET /me/progress` — все уроки текущего tier'а; query param `?tier={tier}` для архивных tier'ов (per [ADR-002](../../../spec/backend/decisions/ADR-002.md) §«per-tier storage») | Борис | 0.5d | integration test: 30 уроков → response size, tier filter работает | S3.1 |
| ⬜ S3.6 | `GET /me/history?cursor=&limit=` cursor pagination (`created_at DESC, id DESC`, opaque cursor base64-encoded). Default limit=20, max=100. | Борис | 1d | integration test 1000 entries → 50 страниц, cursor stability | S3.1 |
| ⬜ S3.7 | OpenAPI contract update: `/me`, `/me/settings`, `/me/progress`, `/me/history`, error schemas (включая `AGE_DOWNGRADE_FORBIDDEN`). Клод ревьюит **до** S3.2 implementation (предотвращает rework как в Sprint 1/2 pattern). | Борис + Клод review | 0.5d | контракт зафиксирован в `backend/openapi.yaml`, schemathesis smoke зелёный | D3-1, D3-2, D3-3, D3-4 |
| ⬜ S3.8 | **Frontend wire через api-client**: `profile.js`, `dashboard.js`, `task.js` → читают через `apiClient.getProgress()` / `apiClient.getMe()` / `apiClient.postProgress()` вместо `StorageUtils.get(...)`. Graceful fallback на localStorage при network error (уже реализован паттерном Sprint 2 в `api-client.js`). **api-client.js уже contract-tested (verify_api_client_mock 11/11 PASS) → это translation/wire**, не rebuild. | Алекс | 1.5d | manual: Network throttle на DevTools → fallback работает; verify_sync_across_devices.py зелёный | S3.2-S3.6 (API endpoints live), Sprint 2 (api-client.js готов) |
| ⬜ S3.9 | **ADR-002 AGE_DOWNGRADE unit tests**: matrix-тест mutation policy — для каждой пары `(from_audience, to_audience)` проверить allow/reject согласно [ADR-002](../../../spec/backend/decisions/ADR-002.md) §«Что разрешено менять» (9 cases). Также `email` и `password` flow требуют отдельных endpoints (не через `PATCH /me`) — тест что PATCH с этими полями возвращает 422 `USE_DEDICATED_ENDPOINT`. | Борис + Квинн | 0.5d | `pytest tests/api/test_me_mutation_policy.py` — 9+ cases PASS | S3.2 |
| ⬜ S3.10 | **`verify_sync_across_devices.py`** — 2 контекста Playwright: context A (Chromium) логинится → завершает урок → POST /me/progress. Context B (Firefox) с тем же юзером открывает dashboard → видит обновлённый прогресс в течение 5 сек (через polling или manual reload). | Квинн | 1d | Playwright скрипт зелёный на staging; gate Sprint 3 | S3.4, S3.5, S3.8 |

### IN PROGRESS

— (sprint не стартовал)

### BLOCKED

— (предварительный список):
- ⛔ Все S3.x BLOCKED пока Sprint 2 gate (`verify_guest_to_account.py`, `verify_oauth_yandex.py`, `verify_oauth_vk.py`) не зелёный
- ⛔ S3.2 потенциально BLOCKED если Клод не успел подготовить ADR-002 impl-hints для tier-shift logic к day 1 (см. D3-5; ADR-002 готов, нужно сделать concrete code-pointer)

### DONE

— нет

## Dependencies (cross-team)

См. [dependency_map.md](../dependency_map.md) Sprint 3 раздел (D3-1 … D3-10). Топ-3 критичных:

- **D3-5: Клод → Борис** — ADR-002 полный impl-guide (tier-shift logic, AGE_DOWNGRADE reject pattern) — к **day 1**. ADR-002 как документ готов; Клод даёт concrete code-pointer в комментарии.
- **D3-7: Алекс → Борис** — текущий localStorage shape уже зафиксирован в [`localStorage_schema.md`](../../../spec/backend/legacy/localStorage_schema.md) (delivered в Sprint 0). **Закрыт.**
- **D3-1 ↔ D3-8: Борис → Алекс** — `GET /me/progress` + `POST /me/progress` contracts к day 1 OpenAPI. Без них Алекс не сможет начать S3.8 в day 3.

## Pre-existing artifacts (что НЕ нужно делать с нуля)

- ✅ [`docs/spec/backend/legacy/localStorage_schema.md`](../../../spec/backend/legacy/localStorage_schema.md) — точные shape'ы 10 LS-ключей с SQL mapping, bestWPM cap=1500, tier-shift risks. **Борис читает первым делом для S3.4/S3.5.**
- ✅ [ADR-002 Profile mutation policy](../../../spec/backend/decisions/ADR-002.md) — mutation matrix готова; Клод даёт code-hints для tier_shift в S3.2.
- ✅ [`assets/js/api-client.js`](../../../../assets/js/api-client.js) — contract-tested в Sprint 2 (`verify_api_client_mock` 11/11 PASS). Sprint 3 frontend wire — translation, не rebuild.
- ✅ [TSD §2.2 `progress`/`attempts` schema](../../../spec/backend/02_TSD.md) — таблицы определены, индексы заложены.

## Risks для этого sprint'а

См. [risks.md](../../../spec/backend/risks.md):
- **R-003** (заболевание Бориса) — S3.4 наиболее сложный (atomic UPSERT + concurrency). Если Борис уйдёт mid-sprint → standalone задача, можно hot-swap'нуть на Клода по детальному ADR + localStorage_schema.md.
- **R-005** (потеря прогресса) — Sprint 2 закрыл migrate-guest, Sprint 3 закрывает live sync. **R-005 после Sprint 3 должен быть закрыт** (предмет retro).
- **R-NEW-S3 (новый)**: AGE_DOWNGRADE policy ambiguity — `audience: adult → adult` (no-op) тоже должен возвращать `tier_changed=false`. Унификация в S3.2 контракте.
- **R-008** (testcontainers PG version mismatch) — см. [blockers.md](blockers.md) P3-1.

## Pre-sprint checklist (Ника проверяет в pre-planning)

- [ ] Sprint 2 gate зелёный (`verify_guest_to_account.py` + `verify_oauth_yandex.py` + `verify_oauth_vk.py` + `cleanup_anonymous_sessions` cron tested)
- [ ] Sprint 2 retro проведён, lessons-learned зафиксированы
- [ ] Борис прочитал [`localStorage_schema.md`](../../../spec/backend/legacy/localStorage_schema.md) §1-3 (mapping для S3.3/S3.4/S3.5)
- [ ] Клод подготовил concrete impl-hints для S3.2 (`tier_shift` logic + AGE_DOWNGRADE reject pattern) — комментарий в [ADR-002](../../../spec/backend/decisions/ADR-002.md) или PR-комментарий
- [ ] OpenAPI skeleton с `/me*` endpoints предзалит в `backend/openapi.yaml` (день −1)
- [ ] Алекс ознакомился с pattern api-client.js (он сам его писал в Sprint 2, но re-read — чтобы знать какие methods добавлять)
- [ ] Квинн подготовил draft `verify_sync_across_devices.py` skeleton (2 Playwright contexts setup)
- [ ] testcontainers PostgreSQL 16 confirmed working в Sprint 0 baseline (см. blockers.md P3-1)

## Daily updates

См. [standup.md](standup.md).

## Notes

- **Critical path по дням**:
  - **Day 1**: S3.1 (migration) + S3.7 (OpenAPI contract review с Клодом). Алекс читает контракт.
  - **Day 2**: S3.2 (`/me` mutation) + S3.3 (`/me/settings`).
  - **Day 3**: S3.4 (`POST /me/progress` — самый рискованный) + S3.5 (`GET /me/progress`). Алекс начинает wire (S3.8) против stub'а.
  - **Day 4**: S3.6 (`/me/history` pagination) + S3.9 (mutation policy tests).
  - **Day 5**: S3.10 (`verify_sync_across_devices.py`) + Sprint demo.
- **S3.4 — самый рискованный кусок**. Atomic UPSERT + concurrency: 2 параллельных POST с разными `attempt`-ами должны оба сохраниться, но `progress` row обновиться атомарно. Use `INSERT ... ON CONFLICT (user_id, tier, lesson_num) DO UPDATE SET best_wpm = GREATEST(...)`. **Mandatory** integration test с asyncio.gather на ≥10 concurrent requests.
- **bestWPM cap = 1500**: server-side `LEAST(value, 1500)` в S3.4 (двойная защита поверх client-side `router-guard.js` migration).
- **Tier-shift edge case**: при `PATCH /me {language: 'en'}` → `tier_changed=true` → response должен включать `new_tier`. Фронт по флагу re-fetch'ит `GET /me/progress?tier={new_tier}`. Алекс реализует именно этот hook в S3.8 (`profile.js` listener на response.tier_changed).
- **Cursor pagination format (S3.6)**: `cursor = base64(json({"created_at": ISO, "id": uuid}))`. Stability guarantee: cursor валиден ≥24ч.
- **Concurrency test infra (S3.4)**: используется `asyncio.gather` в pytest, не нужен отдельный Docker — testcontainers PG достаточно.
- Если testcontainers PG 16 не запустится в CI — fallback на `pytest-postgresql` (см. blockers.md P3-1).
