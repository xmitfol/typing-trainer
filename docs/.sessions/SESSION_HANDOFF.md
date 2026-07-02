# Session Handoff — 2026-07-02 (SaaS-бэкенд + Админка + Качество закрыты)

> **Last session**: 2026-07-01 → 2026-07-02 — большая автономная сессия (координатор + команда агентов).
> **For**: следующий Клод или Иван (PO).
> **TL;DR**: `master = 4c207f3`. Весь **автономный объём закрыт** и в master (PR #26–#42): P1 биллинг + P2 OAuth/серверный синк + **админ-панель Ф1–Ф4** (пользователи/платежи/статистика/имперсонация/роли/2FA) + волна качества (адаптив Phase 1, контент-линтер, удержание/стрики, **голос Якимова на весь tier1**). Всё прогнано на реальном Docker-стенде VM. Дальше двигаться можно **только по PO-блокерам** (см. §2).
>
> *(Предыдущие handoff'ы — в git-истории этого файла.)*

---

## 0. Как продолжить (читать первым)

**Всё, что можно было сделать без тебя, — сделано.** Ветки от свежего `master`, паттерн: фича → ветка → PR → merge (не копим на длинной ветке). Следующий шаг определяется тем, что разблокирует PO (§2) — или мелким продуктовым решением (§3).

**Режим работы:** автономно, sequencing через **Нику** (PM), продуктовые/архитектурные/необратимые развилки — за **Иваном** (PO). Команда агентов: Борис (backend+DevOps, gate на VM), Алекс (frontend), Полина (product/контент), Сергей (security), Ася (адаптив-спека), Ника (PM). См. memory `feedback_autonomous_with_nika`, `project_team`.

---

## 1. Что готово и в master (PR #26–#42)

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
- **Линтер контента:** `python scripts/lint_lessons.py` (HIGH=0 обязателен; 2 WARN в block_1 — предсуществующий text_sequence-долг, метадата, не блокер). Кандидат в CI-гейт.
- **Lesson-learned (Sprint 1):** нужен CI с реальным Docker-прогоном (unit-CI пропускал баги). Ещё не заведён — инфра-долг.

## 5. Где детали
- **ROADMAP:** `docs/ROADMAP.md` (единый план, приоритеты).
- **Бэкенд-решения:** `docs/spec/backend/decisions/ADR-*.md` (006 капча, 007 OAuth, 008 биллинг).
- **Админка:** `docs/spec/admin/{01_PRD,02_TSD,03_WORK_PLAN}.md`.
- **Спеки методологии:** `docs/spec/methodology/{adaptive_repetition_spec,retention_streaks_spec,expert_*}.md`.
- **API-контракт:** `backend/openapi.yaml`.
- **Память:** `MEMORY.md` (индекс) → `project_state` (снимок), `project_team`, `vm_playwright_pattern`, `feedback_*`.
