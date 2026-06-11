# Session Handoff — 2026-06-11 (обновлён: Sprint 1 auth-core)

> **Last session ended**: 2026-06-11 (Sprint 1 в работе; предыдущий заход — Phase 2 milestone)
> **For**: следующий Клод-architect или Иван (PO) при следующем заходе
> **TL;DR**: PR #25 **смержен**, Sprint 1 активен. Auth-core (signup/signin/signout/refresh) написан, запушен в `sprint-1/auth-foundation`. Капча → self-hosted (ADR-006), email → mailhog (Y360 отложен). Gate Sprint 1 ~60%. Дальше: S1.7 email → S1.8 verify/forgot/reset → S1.9 frontend.

---

## 0. Как продолжить (next session — читать первым)

**Состояние:** Sprint 1 auth-foundation, ветка `sprint-1/auth-foundation` (запушена, 6 коммитов над master). PR в master ещё НЕ открывал — открыть когда gate Sprint 1 ближе к зелёному.

**Рабочий режим (PO Иван, 2026-06-11):** действовать автономно, сверяясь с **Никой** (PM-агент) на узловых точках; PO-решения (продуктовые/архитектурные развилки, необратимые действия) — подтверждать у Ивана. См. memory `feedback_autonomous_with_nika`.

**Следующий шаг (рекомендация Ники):** `email-service` (SMTP-абстракция aiosmtplib→mailpit localhost:1025) → **S1.7** welcome email → **S1.8** verify-email/forgot/reset. Код не блокируется инфрой; E2E-шаги повиснут до реального `docker compose up`.

**Что НЕ проверить в dev-окружении Клода:** backend-стек (pytest/structlog/sqlalchemy) и Docker НЕ установлены. Весь backend-код проверяется `ast.parse` (syntax) + автономной логикой. Полный pytest + `docker compose up` + verify B1-001 — в CI / у Бориса.

---

## 1. Где мы остановились

### Active state
- **Branch**: `sprint-1/auth-foundation` запушен на origin (6 коммитов над master)
- **master**: содержит merged PR #25 (merge-commit `60677e0`)
- **PR #25**: ✅ MERGED 2026-06-11 (Phase 2 milestone, 44 коммита)
- **Local working tree**: clean

### Что сделано в этом заходе (2026-06-11, Sprint 1)
- **PO-решения**: PR #25 merged; капча → self-hosted ([ADR-006](../spec/backend/decisions/ADR-006.md), honeypot+PoW, отказ от Yandex SmartCaptcha); email → mailhog на dev (Y360 отложен).
- **S1.10** OpenAPI-контракт auth: [backend/openapi.yaml](../../backend/openapi.yaml) — 8 endpoints, JWT в httpOnly cookies.
- **Auth-core** (S1.0/S1.4/S1.4b/S1.5/S1.6): `core/db.py`+`core/redis.py` (async wiring, deps.py был заглушкой), `schemas/auth.py`, `services/auth_service.py`, `core/exceptions.py`, `api/v1/auth.py` (challenge/signup/signin/refresh/signout — honeypot+PoW gate, anti-timing, conditional-captcha, refresh-ротация с revoke jti в Redis).
- **Инфра** (Дима): `mailpit` в docker-compose (B1-002 закрыт); testcontainers Postgres-фикстура в `conftest.py` (B1-001 — код готов, нужен прогон с Docker).
- **Тесты**: `test_auth.py` — 14 (9 runnable без DB: captcha-gate/401/204; 5 DB-integration через `db_client`, гейт на Docker).

### Что закрыто за сессию
| Phase | Что | Где |
|---|---|---|
| Frontend redesign (Phase 4-8) | dashboard, course, lesson, task, pricing + shell assembly + mobile keyboard | 10 коммитов до 2026-06-02 |
| Audit closure (P0/P1/P2) | MentorBubble, ExerciseInsert, Profile page, Polish pack, i18n, WPM fix, builder | 8 коммитов |
| Content migration | 458 уроков на rich tip schema | `91a1f8b` |
| **Backend SDD pack** | PRD + TSD + IMPL_PLAN + 5 ADR + security spec + localStorage schema | 6 коммитов |
| **Backend scaffold** | 8 models + security helpers + alembic initial + captcha + tests | `3f31b3a` |
| **Team coordination** | Ника onboarded, sprint-0/1/2/3 boards, dependency maps Sprint 0-7 | 5 коммитов |

### Где документация
- **Backend spec**: [docs/spec/backend/](../spec/backend/)
  - [README](../spec/backend/README.md) — навигация + 13 зафиксированных решений
  - [PRD](../spec/backend/01_PRD.md) v1.1
  - [TSD](../spec/backend/02_TSD.md) v1.2
  - [IMPL_PLAN](../spec/backend/03_IMPL_PLAN.md) v1.2
  - [risks.md](../spec/backend/risks.md) — 12 рисков (1 closed, 4 mitigating)
  - 5 ADR в [decisions/](../spec/backend/decisions/)
  - [security spec](../spec/backend/security/argon2_and_captcha.md)
  - [localStorage schema](../spec/backend/legacy/localStorage_schema.md)
- **Sprint coordination**: [docs/.sessions/sprints/](sprints/)
  - sprint-0/ (CLOSED), sprint-1/2/3 (pre-filled, pending start)
  - [dependency_map.md](sprints/dependency_map.md) Sprint 0-5 (33 deps)
  - [dependency_map_sprint_6_7.md](sprints/dependency_map_sprint_6_7.md) (30 deps)
- **Weekly digests**: [docs/.sessions/weekly/](weekly/)
  - [2026-W23.md](weekly/2026-W23.md) — последний digest

---

## 2. Команда (12 ролей + PO)

| Роль | Имя | Зона |
|---|---|---|
| Product Owner | **Иван** | Vision, decisions, payment |
| Architect | **Клод** | Системные решения, ADR, code review |
| **Project Manager** | **Ника** | Sprints, blockers, risks, status (новая роль, [profile](../../.claude/agents/project-manager-agent.md)) |
| Product Manager | Полина | PRD, roadmap |
| Frontend | Алекс | Vanilla JS, UI |
| Backend | Борис | FastAPI, PostgreSQL |
| AI/ML | Ася | Weak keys (Phase 3) |
| Content | Катя | 459 уроков |
| Marketing | Марина | Launch positioning |
| UX Research | Юля | User tests |
| QA | Квинн | Verify suite |
| DevOps | Дима | CI/CD, deploy |
| Security | Сергей | Compliance |
| Tech Writer | Тимофей | Docs |

**Делегирование**: через Agent tool. Например, `Agent(subagent_type='general-purpose', prompt='Ты — Ника, ...')`. Профили в [.claude/agents/](../../.claude/agents/).

---

## 3. Что ждёт PO (Иван) — 6 action items

| # | Что | Срок | Где сделать | Зачем |
|---|---|---|---|---|
| 1 | ~~**Merge PR #25**~~ | ✅ **СДЕЛАНО 2026-06-11** | — | Смержен (merge-commit 60677e0), master синхронизирован, Sprint 1 разблокирован |
| ~~2~~ | ~~Регистрация Yandex SmartCaptcha shop~~ | ❌ **ОТМЕНЕНО** | — | PO выбрал self-hosted капчу ([ADR-006](../spec/backend/decisions/ADR-006.md)) — внешней регистрации не нужно |
| 3 | **Y360 SMTP credentials** | ⏸️ **DEFERRED** (PO решил отложить) | Yandex 360 → `noreply@typing-trainer.ru` | Welcome email + verification. На dev используем **mailhog**; реальные креды нужны перед prod email-flow (не блокирует Sprint 1 код) |
| 4 | **Yandex OAuth app** | до Sprint 2 day 1 | https://oauth.yandex.ru | Sign in через Яндекс |
| 5 | **VK OAuth app** | до Sprint 2 day 1 | https://dev.vk.com | Sign in через VK |
| 6 | **YooKassa shop + recurring application** | **Sprint 6 day 1 (T-001)** | YK портал | Sprint 6-7 payments. Заявка занимает 1-3 дня — подавать заранее |
| 7 (optional) | Регистрация домена `typing-trainer.ru` | до Sprint 10 | Любой registrar | Для prod-деплоя |

ADR-005 PO ещё не подтвердил (рекомендую прочитать перед Sprint 6).

---

## 4. Что делать дальше (следующая сессия)

**Sprint 1 — Auth foundation, gate ~60%.** Готово: S1.0-S1.6, S1.10 (см. [sprint-1/board.md](sprints/sprint-1/board.md)). Auth-core (signup/signin/signout/refresh) написан и запушен.

### Осталось до gate Sprint 1
| Задача | Что | Owner | Зависит |
|---|---|---|---|
| **S1.7** | `email-service` (SMTP-абстракция aiosmtplib→mailpit) + welcome email при signup | Клод/Борис | mailpit (✅ в compose) |
| **S1.8** | `POST /auth/verify-email` + `/auth/forgot` + `/auth/reset` | Клод/Борис | S1.7 (email-service) |
| **S1.9** | Frontend: `<auth-modal>`/`auth.html` wire к API + **PoW-solver в Web Worker** + honeypot | Алекс | контракт openapi.yaml ✅ |
| verify B1-001 | один прогон `pytest -m '' app/tests/test_auth.py` в среде с **Docker** → 5 integration-тестов зелёные | Дима/Борис | Docker |

**Рекомендованный порядок (Ника):** email-service → S1.7 → S1.8 (код не блокируется инфрой; E2E «письмо в mailpit UI» повиснет до `docker compose up`).

**Гейт Sprint 1**: `verify_signup_flow.py` зелёный (signup→welcome→verify→signin→signout→reset).

### Открытые блокеры (Sprint 1)
- **B1-001** testcontainers — фикстура написана, нужен прогон с Docker (ETA ~1 debug-итерация). Owner Дима/Борис. См. [blockers.md](sprints/sprint-1/blockers.md).
- **B1-002** mailpit — ✅ закрыт (в docker-compose), зелёный после `docker compose up -d`.

### Параллельные prep-tracks (если есть простой)
- **Ника**: Sprint 4/5 boards pre-fill; dependency_map_sprint_8_9
- **Тимофей**: api_guide draft из openapi.yaml

---

## 5. Ключевые архитектурные решения (читать перед работой)

| ADR | Что | Когда применяется |
|---|---|---|
| [ADR-001](../spec/backend/decisions/ADR-001.md) | Anonymous guest 3-day TTL | Sprint 2 (cleanup cron) |
| [ADR-002](../spec/backend/decisions/ADR-002.md) | Profile mutation policy (AGE_DOWNGRADE forbidden) | Sprint 3 (PATCH /me) |
| [ADR-003](../spec/backend/decisions/ADR-003.md) | Family read-only parental visibility | Sprint 9 |
| [ADR-004](../spec/backend/decisions/ADR-004.md) | Single-vendor YC — **OPTIONAL** теперь (GH unblocked) | deferred |
| [ADR-005](../spec/backend/decisions/ADR-005.md) | YooKassa Hybrid recurring + email fallback | Sprint 6-7 |
| [ADR-006](../spec/backend/decisions/ADR-006.md) | Self-hosted anti-bot (honeypot+PoW) вместо SmartCaptcha | Sprint 1 (S1.4) |

---

## 6. Ключевые цифры

| Метрика | Значение |
|---|---|
| **Дедлайн PERT P80** | 17 октября 2026 (W42) |
| **Активная ветка** | `sprint-1/auth-foundation` (6 коммитов над master, запушено) |
| **PR #25** | ✅ MERGED (merge-commit 60677e0) |
| **Auth endpoints** | 5 (challenge/signup/signin/refresh/signout), syntax-OK |
| **Backend tests** | 14 в test_auth (9 runnable + 5 DB-integration, Docker-gated); ~35 Sprint-0 baseline |
| **ADR** | 6 (ADR-006 = self-hosted captcha, NEW) |
| **Sprint 0 status** | ✅ Closed |
| **Sprint 1 status** | 🟢 In progress, gate ~60% (auth-core 100%) |
| **Active blockers** | B1-001 (testcontainers, нужен Docker-прогон), B1-002 ✅ closed |

---

## 7. Что НЕ нужно делать

- ❌ Не пушить prod backend деплой без auth (Sprint 1+)
- ❌ Не интегрировать YooKassa без T-001 ответа (recurring approval status)
- ❌ Не открывать регистрацию для не-RU IP до GDPR compliance (R-009)
- ❌ Не возвращаться к ADR-004 YC migration без явного решения PO
- ❌ Не модифицировать 5 ADR без создания нового ADR (supersede pattern)
- ❌ Не туда: `mentor` поле в user_profile (legacy дубль `character`)
- ❌ Не считать `typing_trainer_current_lesson` мигрируемым (это UI state)

---

## 8. Memory updates (актуальные)

Локация: `C:\Users\Ivan\.claude\projects\c--Dropbox-Project-saas-typing-trainer\memory\`

- [MEMORY.md](C:/Users/Ivan/.claude/projects/c--Dropbox-Project-saas-typing-trainer/memory/MEMORY.md) — index
- [project_state.md](C:/Users/Ivan/.claude/projects/c--Dropbox-Project-saas-typing-trainer/memory/project_state.md) — нужно обновить (последняя версия 2026-06-02)
- [project_code_state.md](C:/Users/Ivan/.claude/projects/c--Dropbox-Project-saas-typing-trainer/memory/project_code_state.md) — нужно обновить (упомянуть backend/ scaffold)
- [project_team.md](C:/Users/Ivan/.claude/projects/c--Dropbox-Project-saas-typing-trainer/memory/project_team.md) — Ника добавлена ✅

---

## 9. Длинные читания (если новая сессия и весь контекст пропал)

Порядок чтения для catch-up:
1. Этот файл (SESSION_HANDOFF.md) — 5 мин
2. [docs/spec/backend/README.md](../spec/backend/README.md) — 5 мин навигация
3. [docs/.sessions/weekly/2026-W23.md](weekly/2026-W23.md) — последний weekly digest, 5 мин
4. [docs/.sessions/sprints/sprint-1/board.md](sprints/sprint-1/board.md) — что готовится в Sprint 1, 10 мин
5. [docs/spec/backend/03_IMPL_PLAN.md](../spec/backend/03_IMPL_PLAN.md) — полный план 11 sprint'ов, 15 мин
6. **Только если есть конкретная задача** — relevant ADR + dependency map

---

## 10. Glossary (для contextless юзера)

- **ADR** — Architecture Decision Record. Immutable файл с обоснованием.
- **T-trigger** (T-001…T-004) — точки эскалации в ADR-005 YooKassa recurring.
- **B-NNN** — blocker в sprint board.
- **R-NNN** — risk в risk register.
- **D{sprint}-{n}** — dependency в map (D2-5 = Sprint 2, dependency #5).
- **S{sprint}.{n}** — task в IMPL_PLAN/sprint board.
- **PERT P80** — pessimistic-leaning estimate с 80% confidence interval.
- **MentorBubble** — компонент с репликами наставника на task.html.
- **ExerciseInsert** — inline мини-упражнение в lesson.html (rich tip schema).
- **rich tip schema** — формат `tips[]` в lesson JSON с типизированными объектами (p/drop/callout/exercise/pullquote/figure).

---

**End of handoff.** Хорошей следующей сессии 🚀
