# Session Handoff — 2026-07-04 (вечер: автономные хвосты §0.1а закрыты, CI 8/8 блокирующих)

> **Last session**: 2026-07-04 (вечер) — координатор + агенты (Борис/Полина×2, решение Полина+Ника по block_1), PR #61–#65.
> **For**: следующий Клод или Иван (PO).
> **TL;DR**: `master = 875466c`, PR #26–#65. Борд Ники §0.1 был закрыт утренней сессией (PR #45–#59);
> этой сессией **закрыты ВСЕ автономные хвосты** (бывший §0.1а):
> 1) **YooKassa `parse_webhook`** — offline-нормализация payload'ов + 36 юнит-тестов (PR #61; верификация
> источника — осознанный парк до shop, fail-fast NotImplementedError);
> 2) **mypy 92→0 и backend-typecheck БЛОКИРУЮЩИЙ** (PR #64) — **в CI больше нет наблюдательных джоб, 8/8
> блокирующие**; заодно ruff запинен ==0.8.6 в uv.lock (дрейф 0.15.20 vs CI устранён);
> 3) **block_1 `text_sequence` починен** (PR #62, решение Полины+Ники: чинить, не дропать) — линтер теперь
> стережёт канон рук/пальцев (WARN);
> 4) **адаптив-раскатка на ВСЕ тиры** (PR #63) + **unit>1 токена** (PR #65): **386/515 шагов декларативные**,
> legacy 129 = 108 непериодических by design + **21 отложенный «набор слов ×2» — новое PO-решение, §3**.
> Автономного больше нет — дальше только PO-блокеры (§2) и мелкие решения (§3).
>
> *(Предыдущие handoff'ы — в git-истории этого файла.)*

---

## 0. Как продолжить (читать первым)

**Всё автономное — сделано.** Ветки от свежего `master`, паттерн: фича → ветка → PR → merge. Следующий шаг определяется PO-блокерами (§2) или мелкими продуктовыми решениями (§3). Если PO молчит — можно брать парк-карточки i18n (§3) только вместе с их триггерами (EN-запуск / P3-редизайн), иначе не трогать.

**Режим работы:** автономно, sequencing через **Нику** (PM), продуктовые/архитектурные/необратимые развилки — за **Иваном** (PO). Команда агентов: Борис (backend+DevOps), Алекс (frontend), Полина (product/контент), Сергей (security), Ася (адаптив-спека), Ника (PM). См. memory `feedback_autonomous_with_nika`, `project_team`.

### 0.1 Сессия 2026-07-04 (вечер) — детали PR #61–#65

1. **PR #61 — YooKassa webhook-нормализация** (`backend/app/core/billing.py`):
   `YooKassaProvider.normalize_webhook` — статическая чистая функция, offline: `payment.succeeded`/`payment.canceled`/`refund.succeeded` → `WebhookEvent`; refund привязан к `object.payment_id` (исходный платёж — по нему `apply_webhook` ищет подписку); `payment_method_id` только при `saved:true` (ADR-005); суммы через Decimal. `parse_webhook` = `_verify_webhook_source()` (**NotImplementedError — парк до подтверждённого shop**, боевой парсинг невозможен by design, есть тест-сторож) → `normalize_webhook()`. 36 юнит-тестов в `app/tests/test_billing.py`; сьюта 101 passed / 8 skipped.
2. **PR #62 — block_1 text_sequence** (решение Полины+Ники: **чинить**, block_1 был единственным битым тиром из 6): реально было **388 битых элементов из 928** в 9 файлах (цифра «~4К» из прошлого handoff — это пары конфликтующих вхождений, не элементы). `regen_text_sequence.py --force` (структурное сравнение вместо склейки char; + фикс относительных путей), 9 файлов перегенерированы, печатаемый слой байт-в-байт нетронут. **`lint_lessons.py` теперь проверяет hand/finger против канона ЙЦУКЕН** (WARN; `FINGER_MAP` импортируется из регенератора — один источник правды).
3. **PR #63 — адаптив-раскатка на остальные тиры** (`migrate_steps_declarative.py` без изменений): ru_kids 17, ru_teen 22, en_tier1 73, en_kids 32, en_teen 35 = **179 шагов**; block_1 пропущен (0 step-шагов). Контроли: байт-идентичность 73/73, линтер 459/0/0, гейт adaptive_phase2 17/17, идемпотентность.
4. **PR #65 — unit>1 токена** (разведка подтвердила: движок УЖЕ умеет — `buildTarget` повторяет unit как непрозрачную строку; менялся только `decompose()` мигратора: минимальный период k≥2): **+76 шагов** (68 чередований одиночных клавиш, вкл. 18 tier1 «а о а о»; 8 чередований групп «фыва олдж»). Доп-контроль: `' '.join([unit]*baseReps) == target` байт-в-байт для всех 386 декларативных шагов. **21 «набор слов ×2» отложен** (явное исключение в детекте) — PO-решение, см. §3.
5. **PR #64 — mypy strict 92→0** (26 файлов) + **backend-typecheck блокирующий** (наблюдательных джоб в CI не осталось): `audit(target_id: UUID | str)` (нормализация внутри, 12 вызовов не тронуты); `auth_service.py:114` — **НЕ баг** (гард был, mypy не видел narrowing через производный bool; переписан прямым гардом, anti-timing сохранён 1:1); `CookieKwargs` TypedDict (auth+admin); **ruff запинен `==0.8.6`** в pyproject+uv.lock (= CI-пин; churn lock — только ruff).

> Паттерн сессии: координатор сам делал малые PR (#61, #62) и мержил все; Борис (mypy) и Полина (раскатка ×2) — фоновые агенты в изолированных worktree; решение чинить/дропать block_1 — агент Полина+Ника. Конфликтов веток — 0 (треки разведены по файлам заранее).

### 0.2 Борд Ники «финал без платежей» + CI-долг — история (закрыто ранее)

Утренняя сессия 2026-07-04 и ранее (PR #45–#59): CI real-Docker, адаптив Phase 2 (движок), tier1-раскатка 125/186, E2E-синк 6 тиров 18/18, block_1 char-слой, admin `/admin/billing/charges`, ruff 448→0, backend-tests блокирующая, продуктовый фикс verify-токена до писем (PR #57), uv.lock. Детали — в git-истории этого файла (handoff PR #60).

---

## 1. Что готово и в master (сводка)

**Продукт:** курс 6 тиров + block_1 диагностический / 459 уроков (гайдед-формат, голоса-эксперты, чистые раскладки) + тренажёр (гайдед-шаги, отчёт, коуч, детекты, эргономика) + адаптив Phase 1+2 (remediation/decay/weak-keys; **386/515 шагов декларативные** на всех тирах).

**P1 — Биллинг** (ADR-008, PR #27): провайдер-агностичный `PaymentProvider` + StubProvider (весь путь без денег); YooKassaProvider: **нормализация webhook готова и оттестирована (PR #61)**, HTTP-методы и верификация источника — TODO до shop. Checkout→webhook→active, идемпотентность, честный `period`; paywall-gate; фронт `pricing.js→/billing/checkout`.

**P2 — OAuth + синк** (ADR-007): OAuth Yandex/VK (PKCE, MockStrategy) 26/26; серверный синк `/me/*` + guest-migration 45/45; live-фронт на useApi.

**Админ-панель Ф1–Ф4** (PR #29–38): RBAC + аудит + re-auth, подписки/возвраты, статистика + events, имперсонация + TOTP-2FA + nginx allowlist. Ф4-SEC: APPROVE-WITH-FIXES, внесены.

**Качество/P4** (PR #36–42): контент-линтер (теперь и канон рук text_sequence), удержание/стрики v1, голос Якимова весь tier1.

**Backend-код**: mypy strict 0 ошибок, ruff 0.8.6 чисто, pytest 101/8 skipped (локально: `uv sync --frozen`).

---

## 2. PO-блокеры (разблокируешь — команда делает)

| Что нужно от Ивана | Разблокирует |
|---|---|
| **YooKassa-shop** (shop_id/secret, верификация 1-3 дня) | Боевой `YooKassaProvider` (HTTP-методы + верификация webhook-источника; нормализация уже готова, PR #61) + F2-PROD; prod-env |
| **3–5 живых тестеров** (по одному на тир) | **P0-валидация** уроки 1-10 (важнее новых фич; события уже пишутся) + калибровка порогов [TUNE] адаптива (Ася) |
| **Макет онбординга** | P3-редизайн (memory `feedback_onboarding_ux`) |
| **Реальные OAuth-креды** Yandex/VK (S2.1) | Боевой вход (сейчас mock) |

**Prod-cutover чек-лист** (`docs/spec/admin/03_WORK_PLAN.md` §5b): nginx allowlist реальные IP; `REQUIRE_SUPERADMIN_2FA=true` + `TOTP_ENCRYPTION_KEY`; `BILLING_PROVIDER=yookassa` + креды.

---

## 3. Мелкие продуктовые решения (когда захочешь)

- **НОВОЕ: 21 шаг «набор слов ×2»** (например «вол вал лов лава» ×2) — формально периодичны, но адаптив умножал бы целый список слов. Мигрировать в декларативные или оставить legacy? Полный список (тир/урок/шаг) — в PR #65. **Прецедент есть**: в пилотном tier1/lesson_01 два таких шага вручную декларативные с Phase 1 и работают.
- **Ритм-шаблоны** (~13 уроков tier1) — кросс-тировый голос с 🎵: унифицировать в Якимова или оставить голос-слотом?
- **Калибровка [TUNE]** порогов адаптива — после P0-тестеров (Ася).
- **Удержание v2** — push/email (отдельная инфра + privacy-ревью Сергея); Ника рекомендовала НЕ в v1.
- **Голоса других тиров** (ru_kids готов — Мария Сергеевна; ru_teen/en_* — план; memory `project_tier_experts`).
- **Парк-карточки i18n** (решение Ники, не трогать до триггеров): pricing i18n — до EN-запуска/пересмотра R-009; onboarding i18n — до P3-редизайна (i18n-first, тогда же чистка ~58 ключей); туда же i18n блока «Клавиши на прокачку» в профиле.

---

## 4. Инфра / как гонять

- **CI (GitHub Actions):** `.github/workflows/ci.yml`, ~2.5 мин, **8/8 джоб БЛОКИРУЮЩИЕ** (compile / content-lint / backend-lint / backend-tests / backend-typecheck / static-e2e ×2 / stack-e2e). Наблюдательных больше нет (PR #64).
- **Backend локально:** `cd backend && uv sync --frozen`, затем `uv run pytest -q -k "not anti_timing_attack_pattern"` (нужны env: `DB_PASSWORD` + `JWT_SECRET_KEY`, значения любые тестовые — как в ci.yml backend-tests) → 101 passed / 8 skipped без Docker. `uv run mypy app` → 0. `uv run ruff check . && uv run ruff format --check .` — ruff из lock теперь **0.8.6 = CI-пин**.
- **Линтер контента:** `python scripts/lint_lessons.py` — 459 уроков, HIGH 0, WARN 0 (теперь проверяет и hand/finger канон ЙЦУКЕН в text_sequence).
- **Статик-гейт локально:** `python -m http.server 8000` + `python scripts/ci_run_gate.py --suite static [--only x.py]` (27 скриптов).
- **Тест-стек VM:** cme-server (192.168.7.115), `docker compose --profile app up -d` (:8090); паттерн — memory `vm-playwright-pattern`. Стек-гейт локально — только на VM; в CI — сам.
- **Утилиты данных:** `scripts/regen_text_sequence.py [--check] [--force]` (канон text_sequence; --force — структурное сравнение, только с явными файлами); `scripts/migrate_steps_declarative.py` (декларативные шаги, детект периода k≥2, «×2-наборы слов» исключены до PO-решения).

## 5. Где детали
- **ROADMAP:** `docs/ROADMAP.md`. **ADR:** `docs/spec/backend/decisions/ADR-*.md` (006 капча, 007 OAuth, 008 биллинг).
- **Админка:** `docs/spec/admin/{01_PRD,02_TSD,03_WORK_PLAN}.md`. **Методология:** `docs/spec/methodology/*.md`.
- **API-контракт:** `backend/openapi.yaml`.
- **Память:** `MEMORY.md` (индекс) → `project_state` (снимок), `project_team`, `vm_playwright_pattern`, `feedback_*`.
