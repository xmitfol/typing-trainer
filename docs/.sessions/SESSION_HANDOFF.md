# Session Handoff — 2026-07-04 (борд «финал без платежей» + CI-долг закрыты)

> **Last session**: 2026-07-03 → 2026-07-04 — координатор + фоновые агенты (Алекс/Полина/Борис), scope-развилки через Нику.
> **For**: следующий Клод или Иван (PO).
> **TL;DR**: `master = 20805b3`, PR #26–#59. **Борд Ники §0.1 закрыт целиком (#1–#5)** и **CI-долг закрыт**:
> CI real-Docker (7 блокирующих джоб ~2.5 мин: compile / content-lint / static ×2 / stack / backend-lint /
> backend-tests; наблюдательная только mypy) + адаптив Phase 2 (remediation/decay/weak-keys) + раскатка
> unit/baseReps tier1 + E2E-синк 6 тиров (18/18) + мелкий долг + ruff 448→0 + uv.lock + **продуктовый фикс,
> пойманный тестами** (verify-токен до писем в signup, PR #57). Дальше двигаться — по PO-блокерам (§2)
> или малым автономным хвостам (§0.1а).
>
> *(Предыдущие handoff'ы — в git-истории этого файла.)*

---

## 0. Как продолжить (читать первым)

**Всё, что можно было сделать без тебя, — сделано.** Ветки от свежего `master`, паттерн: фича → ветка → PR → merge (не копим на длинной ветке). Следующий шаг определяется тем, что разблокирует PO (§2) — или мелким продуктовым решением (§3).

### 0.1а Доступное автономное (если PO ещё думает)
- **YooKassa `parse_webhook` offline юнит-тест** — Ника явно разрешила достать вперёд (см. ниже про YooKassaProvider); только нормализация payload'ов, БЕЗ HTTP-методов.
- **mypy-типизация** admin/me/events (Борис) → повысить backend-typecheck до блокирующей (последняя наблюдательная).
- **Observation block_1**: руки в text_sequence местами перепутаны (~4К конфликтов метадаты; поле тренажёром не читается) — решение Полины/Ники: чинить `scripts/regen_text_sequence.py` или дропнуть поле.
- **Расширения раскатки** (по желанию): unit>1 токена («а о а о», ~17 шагов tier1); остальные тиры — тем же `scripts/migrate_steps_declarative.py`.
- **i18n блока «Клавиши на прокачку»** в профиле — в парк-карточку onboarding/pricing i18n.

**Режим работы:** автономно, sequencing через **Нику** (PM), продуктовые/архитектурные/необратимые развилки — за **Иваном** (PO). Команда агентов: Борис (backend+DevOps, gate на VM), Алекс (frontend), Полина (product/контент), Сергей (security), Ася (адаптив-спека), Ника (PM). См. memory `feedback_autonomous_with_nika`, `project_team`.

### 0.1 Немедленно дальше — план «финал без платежей» (борд Ники)

PO спросил, что доделать до финала БЕЗ данных по платежам. План (три независимых трека, не пересекаются по файлам):
1. ✅ **CI real-Docker — ГОТОВО** (PR #45, merged 2026-07-03, master `d6621e2`). `.github/workflows/ci.yml`:
   блокирующие compile-checks / content-lint / static-e2e ×2 (26 Playwright через `scripts/ci_run_gate.py`) /
   stack-e2e (`docker compose --profile app` → auth-гейт **8/8 с реальными mailpit-токенами**); ран ~2.5 мин.
   Попутно актуализированы 10 протухших verify-скриптов (редизайн отчёта урока, гайдед tier1,
   `.target__inner`, backend-only auth, убранный график) — статик-сьюта 26/26.
   **CI-долг — ЗАКРЫТ (2026-07-04, PR #55–#58), кроме mypy:**
   - PR #55 ruff 448→0 (RUF001-003 кириллица → ignore; 0 noqa) + **блокирующий backend-lint** (ruff==0.8.6);
   - PR #56 **backend-tests зелёная и блокирующая**: db-тесты на httpx.ASGITransport (loop starlette 1.x),
     cookie dotted-domain (http.cookiejar не берёт Domain без точки), Noop-emailer DI, email-ассерты под
     Jinja2-autoescape (&amp;);
   - PR #57 **продуктовый фикс, найденный тестами**: verify-токен выдаётся ДО писем в signup (сбой SMTP
     оставлял юзера без токена; в forgot порядок был верным) + регресс-тест;
   - PR #58 **uv.lock**: CI (uv sync --frozen) и Dockerfile (uv export --frozen --no-dev) ставят ровно
     зафиксированные версии — конец дрейфу latest; бонус — backend-тесты гоняются локально (uv-питон 3.12).
   Остался только **backend-typecheck** (наблюдательная): mypy strict-долг новых модулей admin/me/events —
   осмысленная типизация, не механика (Борис, отдельной итерацией).
2. ✅ **Адаптив Phase 2 — движок — ЗАКРЫТ** (2026-07-03, PR #50, спека §4.3/§4.4/§6, пороги = spec-дефолт [TUNE] до калибровки):
   - decay на чтение (daysIdle>7 → streak×0.5, re-warmup); remediation-дрилл в лестнице урока
     (weak ∩ клавиши урока, cap kids 1/teen 2/adult 2, «2 захода не помогло → не зацикливать»,
     НЕ курсовой — exerciseProgress/звёзды/гейт полного захода не тронуты; URL `task.html?remediation=<key>`);
     weak-keys в профиле («Клавиши на прокачку», только adult-тиры).
   - Гейт `verify_adaptive_phase2.py` 17/17 → STATIC_SUITE (27 скриптов), полная сьюта 27/27.
   - Хвосты: i18n текстов блока профиля (в парк-карточку профиль-i18n), калибровка [TUNE] на данных P0-тестеров (Ася).
3. ✅ **Мелкий долг — ЗАКРЫТ** (2026-07-03, PR #47/#48, sequencing подтверждён Никой):
   - block_1 `text_sequence` регенерация (PR #47): линтер **459 уроков, HIGH 0, WARN 0**; утилита `scripts/regen_text_sequence.py`. *Observation Полине/Нике: в др. block_1-файлах руки в text_sequence местами перепутаны (~4К конфликтов метадаты) — тренажёр поле не читает; чинить регенератором или дропнуть поле.*
   - i18n-пробелы/дубли — **аудит выполнен, долга в словарях нет** (ru/en паритет 249/249, непереведённых нет, «дубли» = легитимные повторы значений). Решение Ники: 2 парк-карточки — «pricing i18n» (до EN-запуска/пересмотра R-009) и «onboarding i18n» (до P3-редизайна; новая форма — i18n-first; ~58 неиспользуемых ключей чистить ТОГДА же, не сейчас — в коде есть динамическая сборка ключей, grep-списку доверять нельзя).
   - `subscription_charges` admin-debug (PR #48): `GET /admin/billing/charges` (support) — фильтры status/subscription_id/yookassa_payment_id/idempotency_key; гейт Ф2 24/24. **Бонус: admin-гейты (Ф2+Ф4b) теперь гоняются В CI** (stack-e2e, `docker exec` + PYTHONPATH; scripts/ копируются в образ).
4. ✅ **E2E синка на всех тирах — ЗАКРЫТ** (2026-07-04, PR #53): `scripts/verify_sync_tiers.py` в STACK_SUITE —
   **18/18 в CI**: UI-signup → браузерная печать tier1 (автоматический saveAttempt из тренажёра) →
   saveAttempt 5 остальных тиров живым api-client → GET /me/progress со всеми 6 тирами →
   разворот getProgress() по активному тиру (изоляция).
5. ✅ **Адаптив раскатка — ЗАКРЫТА** (2026-07-04, PR #52): tier1 **125/186 шагов в 42 файлах** на unit/baseReps/keys
   (утилита `scripts/migrate_steps_declarative.py`); 55 шагов legacy by design (чередования/слова/фразы/прогрессии —
   движок их не адаптирует). Печатаемый слой байт-в-байт нетронут (контроль 42/42), линтер 459/0/0.
   Расширения (остальные тиры; unit>1 токена «а о» ~17 шагов) — отдельным решением при желании.

> **БОРД §0.1 ЗАКРЫТ ЦЕЛИКОМ (#1–#5, 2026-07-03/04, PR #45–#53).** Дальше: PO-блокеры (§2),
> CI-долг Бориса (см. #1), парк-карточки i18n (см. #3), мелкие решения (§3).
- **YooKassaProvider боевой код — НЕ писать вслепую** (рекомендация Ники): код против доков не gate-verified, протухнет и перепишется на живых ответах shop. Достать вперёд только offline юнит-тест `parse_webhook`-нормализации; HTTP-методы — парк до подтверждённого shop.
- **Решения PO** (не автономно): голоса остальных тиров (ru_kids/ru_teen/en_*), унификация ~13 ритм-шаблонов (§3 ниже).

> **In-flight note снята (2026-07-03):** диффы фоновых Бориса/Алекса прошлой сессии не пережили сворачивание (дерево чистое, master цел) — трек #1 перезапущен по плану и доведён до merge этой сессией. Треки #2/#3 — следующие.

---

## 1. Что готово и в master (PR #26–#43)

**Продукт (было ранее):** курс 6 тиров / ~459 уроков (гайдед-формат, голоса-эксперты, чистые раскладки) + тренажёр (гайдед-шаги, отчёт, коуч, детекты, эргономика).

**P1 — Биллинг** (ADR-008, PR #27): провайдер-агностичный `PaymentProvider` + StubProvider (весь путь без денег) + YooKassaProvider **skeleton**; checkout→webhook→active, идемпотентность, честный `period`; paywall-gate `/lessons/{n}/access`; фронт `pricing.js→/billing/checkout`. Gate 6/6.

**P2 — OAuth + синк** (ADR-007, PR #27): OAuth Yandex/VK (PKCE, MockStrategy) 26/26; серверный синк `/me/*` + guest-migration 45/45; **live-фронт развёрнут на useApi** (auth-sync.js, task.js→saveAttempt) — совмещённый E2E 6/6.

**Админ-панель Ф1–Ф4** (спека `docs/spec/admin/`, PR #29-38):
- Ф1 RBAC (3 роли user/analyst/support/superadmin) + аудит + re-auth (one-time getdel для денег) + Обзор + Пользователи — 18/18.
- Ф2 Подписки + Возврат (refund через провайдера, идемпотентный + partial-unique на гонку) — 19/19.
- Ф3 Статистика (воронка/retention/drop-off/скилл/деньги — из наличных таблиц) + эмиссия `events` — 34/34.
- Ф4 имперсонация (refresh-гейт 409, imp-аудит middleware) + роли (инвариант «не себе») + **TOTP-2FA** superadmin (Fernet-секрет at-rest, recovery argon2 one-time) + nginx allowlist — 26/26.
- **Ф4-SEC: APPROVE-WITH-FIXES**, все код-фиксы внесены. Фронт админки — `admin/index.html` + `assets/js/admin.js`.

**Качество/P4** (PR #36-42): адаптив «слабые клавиши» Phase 1 (прототип lesson_01, backward-compat); контент-линтер `scripts/lint_lessons.py` (печатаемый текст стерилен 0/459); admin-UI Ф3/Ф4 браузерный E2E (+фикс баннера имперсонации); удержание/стрики v1 (`retention.js`, спека `docs/spec/methodology/retention_streaks_spec.md`); **голос эксперта Якимова на весь tier1 1-99** (тёплый тон по фидбэку PO; тронут только нарратив, печатаемый слой байт-идентичен).

---

## 2. PO-блокеры (разблокируешь — команда делает)

| Что нужно от Ивана | Разблокирует |
|---|---|
| **YooKassa-shop** (shop_id/secret, верификация 1-3 дня) | Боевой `YooKassaProvider` (create_checkout/refund) + F2-PROD; prod-env |
| **3–5 живых тестеров** (по одному на тир) | **P0-валидация** уроки 1-10 (важнее новых фич по ROADMAP; наблюдаемость из events уже пишется) |
| **Макет онбординга** | P3-редизайн (форма конфлейтит юзера/наставника/возраст — memory `feedback_onboarding_ux`) |
| **Реальные OAuth-креды** Yandex/VK (S2.1) | Боевой вход (сейчас mock — всё работает, кроме реального провайдера) |

**Prod-cutover чек-лист (операционный — `docs/spec/admin/03_WORK_PLAN.md` §5b):**
1. nginx `admin_allowlist.conf`: `allow all;` → реальные IP + `deny all;` + `real_ip` за LB.
2. prod-`.env`: `REQUIRE_SUPERADMIN_2FA=true` + `TOTP_ENCRYPTION_KEY=<Fernet>` (форсится fail-fast при `APP_ENV=prod`).
3. `BILLING_PROVIDER=yookassa` + shop-креды (после подтверждения shop).

---

## 3. Мелкие продуктовые решения (когда захочешь)

- **Ритм-шаблоны** (~13 уроков tier1: 39/45/53/57/62/66/72/77/82/87/91/95/97) — кросс-тировый голос «методика курса» с 🎵, НЕ якимовский. Унифицировать в Якимова или оставить отдельным согласованным голос-слотом?
- **Адаптив Phase 2** — раскатка на все уроки + remediation-дрилл + decay + weak-keys в профиле. Сначала Ася калибрует пороги `[TUNE]` на реальных данных (после P0-тестеров).
- **Удержание v2** — push/email-напоминания (отдельная инфра + privacy-ревью Сергея). Ника рекомендовала НЕ в v1.
- **Голос Якимова на другие тиры** (ru_kids/ru_teen/en_*) — у каждого свой эксперт (memory `project_tier_experts`); при желании — тот же приём.

---

## 4. Инфра / как гонять

- **Тест-стек:** VM cme-server (192.168.7.115), Docker; `docker compose --profile app up -d` (backend+nginx :8090, postgres, redis, mailpit). На VM untracked `backend/docker-compose.override.yml` (`!override []` на host-порты — закрывает конфликт с нативными PG/Redis). Паттерн gate/браузер-E2E — memory `vm-playwright-pattern`.
- **Линтер контента:** `python scripts/lint_lessons.py` — **459 уроков, HIGH 0, WARN 0**. ✅ CI-гейт (content-lint).
- **CI (GitHub Actions):** на каждый push/PR в master — `.github/workflows/ci.yml` (~2.5 мин, 7 блокирующих джоб). Локальный прогон статик-гейта: `python -m http.server 8000` + `python scripts/ci_run_gate.py --suite static [--only x.py]`. Стек-гейт (auth 8/8 + синк 18/18 + admin-гейты в контейнере) локально — только на VM; на раннере — сам. ADR-004 CI-часть superseded (см. status update в ADR).
- **Backend локально (НОВОЕ, PR #58):** `cd backend && uv sync --frozen && uv run pytest -q -k "not anti_timing_attack_pattern"` — uv сам ставит CPython 3.12 из uv.lock; без Docker db-тесты корректно скипаются (65 passed / 8 skipped). Ruff: `ruff check .` + `ruff format --check .` (пин 0.8.6 = CI). Обновление зависимостей — через `uv lock` осознанным PR.

## 5. Где детали
- **ROADMAP:** `docs/ROADMAP.md` (единый план, приоритеты).
- **Бэкенд-решения:** `docs/spec/backend/decisions/ADR-*.md` (006 капча, 007 OAuth, 008 биллинг).
- **Админка:** `docs/spec/admin/{01_PRD,02_TSD,03_WORK_PLAN}.md`.
- **Спеки методологии:** `docs/spec/methodology/{adaptive_repetition_spec,retention_streaks_spec,expert_*}.md`.
- **API-контракт:** `backend/openapi.yaml`.
- **Память:** `MEMORY.md` (индекс) → `project_state` (снимок), `project_team`, `vm_playwright_pattern`, `feedback_*`.
