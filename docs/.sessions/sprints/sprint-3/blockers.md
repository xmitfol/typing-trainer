# Sprint 3 · Active Blockers

> Active blockers logged here. Resolved → moved to `## Resolved` ниже.
> **Status**: pending start (ждёт Sprint 2 gate)

## Active

— нет (sprint не стартовал)

## Predicted (preview risks для Sprint 3)

| # | Что | Owner для разблокировки | When triggers | Mitigation |
|---|---|---|---|---|
| **P3-1** | **testcontainers PostgreSQL версия не совпадает с прод (`pg:16-alpine` vs managed YC PG16.x patch level)** — `INSERT ... ON CONFLICT DO UPDATE` поведение или JSON-функции расходятся между тест и прод. Особенно критично для S3.4 atomic UPSERT. | Дима + Борис | На day 2-3, когда S3.4 интеграционный тест запускается | Зафиксировать в Sprint 0 baseline точный image (`postgres:16.4-alpine`). Если расхождение — pin'нуть на тот же patch level что в managed PG. Fallback: `pytest-postgresql` с системной PG 16. |
| **P3-2** | **Async session fixture для pytest** — typical pitfall: `asyncpg` pool share между tests vs `pytest-asyncio` event loop scopes. Тесты случайно проходят локально, fail'ятся в CI. Особенно для S3.4 concurrency test (`asyncio.gather` на одну подписку). | Борис + Клод review | На day 3, когда concurrency test пишется | Использовать `pytest-asyncio` mode=auto + `async_session` fixture scoped per-test, не per-module. Reference pattern из Sprint 1 (`auth_service` async tests). Sample fixture в [TSD §7.3](../../../spec/backend/02_TSD.md) добавить если ещё нет. |
| P3-3 | Sprint 2 gate провален → Sprint 3 заблокирован | Борис + Ника (retro) | После Sprint 2 demo | Перенос S3.x на week 4, всё остальное скользит. Особенно болезненно потому что Sprint 4 (achievements) **сильно** зависит от Sprint 3 (`POST /me/progress` response shape). |
| P3-4 | **ADR-002 impl-hints не готовы к day 1** (Клод занят на других задачах) | Клод | На Sprint 3 day 1 kickoff check | Ника эскалирует к Клоду в Friday Sprint 2 (pre-planning). Если совсем не готово — Борис стартует с S3.1/S3.3 (не зависят), Клод догоняет к day 2 для S3.2. |
| P3-5 | **Frontend wire S3.8 — конфликт между cache из api-client и live response** при `tier_changed=true` (мог бы показать stale progress из другого tier'а на 1-2 сек) | Алекс | Day 4-5 при wire of S3.8 | api-client должен invalidate-on-mutate: после `PATCH /me` ответа с `tier_changed=true` → drop кеш `/me/progress`. Реализовать как hook в api-client. |
| P3-6 | **`verify_sync_across_devices.py` (S3.10) — sync не происходит в обещанные 5 сек** из-за client-side polling interval (15-30 сек) | Алекс + Квинн | Day 5 при verify run | Опция А: уменьшить polling до 5 сек для тестового юзера (E2E only). Опция Б: добавить «manual refresh» CTA — verify скрипт жмёт его. Полностью real-time через SSE/WS отложено в Sprint 8+. |
| P3-7 | **AGE_DOWNGRADE matrix покрытие** в S3.9 пропустит edge case (`audience: kid → kid` (no-op) или `audience: null → adult` после OAuth signup) | Борис + Квинн | Day 4 при code review | Pre-defined матрица 9 cases в board.md. Если найден новый case — добавить в матрицу + регрессионный тест. |

## Resolved

— нет (sprint не стартовал)

---

## Escalation protocol

1. Блокер появился → Ника фиксирует здесь с timestamp + owner
2. Через 4 часа без движения → escalation (Ника пишет в standup + связывается с owner)
3. Через 24 часа → escalation к PO (weekly digest или ad-hoc)
4. Resolved — переместить в `## Resolved` с date+resolution-note

---

## Notes по предсказанным блокерам

- **P3-1 и P3-2 — самые вероятные на старте**, потому что Sprint 3 — первый, где появляются *async DB integration tests* в массе (Sprint 1-2 имели больше auth/OAuth-mocking; Sprint 3 = тяжёлая работа с реальной PG). Ника просит Диму в Sprint 2 retro подтвердить fixture pattern и точный PG image.
- **P3-5** — субтильный, но важный: tier-shift через PATCH /me — это **первое** реальное использование cache invalidation в api-client.js. Алексу стоит спроектировать invalidation API в первый день Sprint 3, чтобы не делать rework на day 4.
