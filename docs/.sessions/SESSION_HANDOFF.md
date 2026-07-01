# Session Handoff — 2026-06-24 (Sprint 1 CLOSED, gate 8/8)

> **Last session ended**: 2026-06-24 (Sprint 1 завершён; auth-foundation доказан E2E)
> **For**: следующий Клод-architect или Иван (PO) при следующем заходе
> **TL;DR**: **Sprint 1 CLOSED — gate GREEN 8/8** (реальный E2E на Dockerized стеке VM). Полный auth: signup/signin/signout/refresh/verify-email/forgot/reset + welcome/verify/reset письма, self-hosted PoW-капча (ADR-006), same-origin nginx-proxy. Всё на ветке `sprint-1/auth-foundation`. Дальше: **Sprint 2 — OAuth** (ADR-007 готов) + guest-migration.

---

## 0. Как продолжить (next session — читать первым)

**Состояние:** Sprint 1 закрыт. Ветка `sprint-1/auth-foundation` (запушена, ~17 коммитов над master, до `c9c239c`). PR в master **ещё НЕ открыт** — решение PO: открыть/смержить Sprint 1 перед стартом Sprint 2 (или вести Sprint 2 в этой же ветке).

**Рабочий режим (PO Иван):** автономно, сверяясь с **Никой** (PM) на узлах; PO-решения (продуктовые/архитектурные развилки, необратимое) — у Ивана. См. memory `feedback_autonomous_with_nika`.

**Следующий шаг (Sprint 2, рекомендация Ники):** **S2.1** PO регистрирует OAuth-приложения Yandex+VK (client_id/secret + redirect_uri). Параллельно код: **S2.2** `core/oauth.py` (generic + Yandex стратегия) → **S2.3** `/auth/oauth/yandex/start`+`/callback` → **S2.4** VK. Архитектура зафиксирована в **[ADR-007](../spec/backend/decisions/ADR-007.md)**, эндпоинты в openapi.yaml. Плюс S2.5 guest-migration, S2.6/S2.7 frontend.
**Настоятельно (lessons-learned)**: завести инфра-задачу «CI с реальным Docker-прогоном стека» — 2 из 3 багов Sprint 1 проходили бы зелёный unit-CI (см. retro.md).

**Тестовый стек (как прогнать gate / E2E):**
- **VM cme-server (192.168.7.115)** теперь с Docker 29.6.0 (см. memory `vm-playwright-pattern`). Стек: `git clone` ветки → `cd backend && docker compose --profile app up -d` (на VM host-порты pg/redis заняты системными → в clone'е переназначены 5433/6380). E2E: `BASE=http://localhost:8090 python scripts/verify_signup_flow.py` через VM venv playwright. **Прогон даёт 8/8.**
- В dev-окружении Клода нет Docker/pytest — только syntax + автономная логика.

---

## 1. Где мы остановились

### Active state
- **Branch**: `sprint-1/auth-foundation` (~17 коммитов над master, до `c9c239c`, запушено)
- **master**: merged PR #25 (`60677e0`); PR для Sprint 1 ещё не открыт
- **Sprint 1**: ✅ CLOSED, gate GREEN 8/8 (2026-06-24)
- **Local working tree**: clean

### Что сделано (Sprint 1, итог)
- **Auth backend** (8 endpoints): signup/signin/signout/refresh/challenge + verify-email/forgot/reset. Argon2 + JWT httpOnly cookies + refresh-ротация (Redis blocklist) + anti-timing + conditional-captcha.
- **Капча** self-hosted PoW+honeypot ([ADR-006](../spec/backend/decisions/ADR-006.md)) — фронт solver в Web Worker, выверен против backend.
- **Email** ([ADR-005 §8] i18n RU+EN): welcome/verify/reset через aiosmtplib (dev=mailpit/prod=Y360). Одноразовые токены в Redis.
- **Frontend S1.9**: `auth.html` + `auth.js` + PoW Web Worker (`pow-worker.js`) + `api-client` auth-методы.
- **Инфра**: docker-compose профиль `app` (backend+nginx proxy, same-origin :8090), mailpit, testcontainers-фикстура. ADR-006/007.
- **3 бага найдены живым прогоном и пофикшены**: Dockerfile process-subst (dash), psycopg2-binary для alembic, verify-скрипт mailpit-extraction.
- **Тесты**: test_auth 20 + test_email 7 + verify_signup_flow.py (E2E 8/8 на VM).

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

## 4. Что делать дальше — Sprint 2 (OAuth + guest-migration)

**Sprint 1 ✅ CLOSED** (gate 8/8). Дальше [03_IMPL_PLAN.md §4](../spec/backend/03_IMPL_PLAN.md), архитектура OAuth — [ADR-007](../spec/backend/decisions/ADR-007.md).

| Задача | Что | Owner |
|---|---|---|
| **S2.1** | Регистрация OAuth-приложений Yandex + VK (client_id/secret + redirect_uri) | **PO (Иван)** |
| **S2.2** | `app/core/oauth.py` — generic helper + Yandex стратегия | Борис/Клод |
| **S2.3** | `GET /auth/oauth/yandex/start` + `/callback` (контракт в openapi.yaml ✅) | Борис/Клод |
| **S2.4** | VK OAuth (VK ID, PKCE) — повтор паттерна | Борис/Клод |
| **S2.5** | `POST /auth/migrate-guest` + APScheduler cleanup анонимов 3д (ADR-001) | Борис |
| **S2.6/S2.7** | Frontend: модал «сохрани прогресс» + localStorage→API adapter | Алекс |
| **CI (lessons-learned)** | GitHub Actions с реальным Docker-прогоном стека + verify_signup_flow | Дима |

**Решение PO нужно:** открыть PR `sprint-1/auth-foundation`→master и смержить перед Sprint 2 (или вести Sprint 2 в той же ветке). + S2.1 регистрация OAuth-приложений.

### Прогон gate/E2E (когда нужно)
VM cme-server с Docker (см. §0 + memory `vm-playwright-pattern`): `docker compose --profile app up -d` → `BASE=http://localhost:8090 python scripts/verify_signup_flow.py` = 8/8.

---

## 5. Ключевые архитектурные решения (читать перед работой)

| ADR | Что | Когда применяется |
|---|---|---|
| [ADR-001](../spec/backend/decisions/ADR-001.md) | Anonymous guest 3-day TTL | Sprint 2 (cleanup cron) |
| [ADR-002](../spec/backend/decisions/ADR-002.md) | Profile mutation policy (AGE_DOWNGRADE forbidden) | Sprint 3 (PATCH /me) |
| [ADR-003](../spec/backend/decisions/ADR-003.md) | Family read-only parental visibility | Sprint 9 |
| [ADR-004](../spec/backend/decisions/ADR-004.md) | Single-vendor YC — **OPTIONAL** теперь (GH unblocked) | deferred |
| [ADR-005](../spec/backend/decisions/ADR-005.md) | YooKassa Hybrid recurring + email fallback | Sprint 6-7 |
| [ADR-006](../spec/backend/decisions/ADR-006.md) | Self-hosted anti-bot (honeypot+PoW) вместо SmartCaptcha | Sprint 1 |
| [ADR-007](../spec/backend/decisions/ADR-007.md) | OAuth Yandex+VK — server-side auth code flow | Sprint 2 |

---

## 6. Ключевые цифры

| Метрика | Значение |
|---|---|
| **Дедлайн PERT P80** | 17 октября 2026 (W42) |
| **Активная ветка** | `sprint-1/auth-foundation` (~17 коммитов над master, до c9c239c) |
| **Auth endpoints** | 10 в openapi.yaml (8 реализованы Sprint 1 + 2 OAuth-prep) |
| **Backend tests** | test_auth 20 + test_email 7 + verify_signup_flow E2E **8/8** на VM |
| **ADR** | 7 (ADR-007 = OAuth, NEW) |
| **Sprint 0/1 status** | ✅ Closed (Sprint 1 gate GREEN 8/8) |
| **Blockers** | нет открытых (B1-001/002/003 сняты прогоном) |
| **Тестовый стек** | VM cme-server + Docker 29.6.0; `docker compose --profile app` → 8090 |

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
