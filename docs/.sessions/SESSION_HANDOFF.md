# Session Handoff — 2026-06-11

> **Last session ended**: 2026-06-11 (~28 days, начало 2026-06-02)
> **For**: следующий Клод-architect или Иван (PO) при следующем заходе
> **TL;DR**: 43 коммита запушены, PR #25 ожидает review/merge, Sprint 0 закрыт, Sprint 1 готов к KICKOFF после 6 PO action items.

---

## 1. Где мы остановились

### Active state
- **Branch**: `integration/new-shell` запушен на `origin/integration/new-shell`
- **PR**: [#25](https://github.com/xmitfol/typing-trainer/pull/25) — Phase 2 milestone: design audit closure + Backend SDD + Sprint 0 ready
- **Commits**: 43 шт. над master, все pushed
- **Local working tree**: clean

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
| 1 | **Merge PR #25** | сегодня-завтра | https://github.com/xmitfol/typing-trainer/pull/25 | Разблокировать master, начать Sprint 1 |
| 2 | **Регистрация Yandex SmartCaptcha shop** | до Sprint 1 day 1 | https://cloud.yandex.ru/services/smartcaptcha | R-007 защита от бот-регистраций |
| 3 | **Y360 SMTP credentials** | к Sprint 1 day 4 | Yandex 360 → создать `noreply@typing-trainer.ru` | Welcome email + verification |
| 4 | **Yandex OAuth app** | до Sprint 2 day 1 | https://oauth.yandex.ru | Sign in через Яндекс |
| 5 | **VK OAuth app** | до Sprint 2 day 1 | https://dev.vk.com | Sign in через VK |
| 6 | **YooKassa shop + recurring application** | **Sprint 6 day 1 (T-001)** | YK портал | Sprint 6-7 payments. Заявка занимает 1-3 дня — подавать заранее |
| 7 (optional) | Регистрация домена `typing-trainer.ru` | до Sprint 10 | Любой registrar | Для prod-деплоя |

ADR-005 PO ещё не подтвердил (рекомендую прочитать перед Sprint 6).

---

## 4. Что делать дальше (следующая сессия)

### Если PR #25 merge'нут
**Sprint 1 KICKOFF — Auth foundation** (по [03_IMPL_PLAN.md §3](../spec/backend/03_IMPL_PLAN.md)):
1. S1.1 Alembic migration уже готова (`backend/alembic/versions/202606071800_initial_schema.py`) — нужен `alembic upgrade head` в dev
2. S1.2 Models уже готовы (`backend/app/models/user.py`)
3. S1.3 Security helpers уже готовы (`backend/app/core/security.py`)
4. S1.4 `POST /api/v1/auth/signup` — НУЖНО НАПИСАТЬ (Борис или Клод-играет-Бориса)
5. S1.5 `POST /api/v1/auth/signin` — НУЖНО НАПИСАТЬ
6. S1.6 `POST /api/v1/auth/signout` + refresh — НУЖНО НАПИСАТЬ
7. S1.7 Email integration с Y360 — ждёт PO action #3
8. S1.8 Email verification + forgot/reset — НУЖНО НАПИСАТЬ

**Гейт Sprint 1**: `verify_signup_flow.py` зелёный.

### Если PR не merge'нут / blocked
Параллельные tracks:
- **Алекс**: pre-design `<auth-modal>` mockup на основе figma handoff
- **Тимофей**: api_guide draft (для onboarding Бориса)
- **Ника**: Sprint 4 board pre-fill (achievements engine, 7 задач)
- **Ника**: Sprint 5 board pre-fill (Lessons API + paywall, 6 задач)
- **Ника**: dependency_map_sprint_8_9.md (analytics + GDPR)
- **Клод**: написать заранее services/ модули (auth_service, user_service)

---

## 5. Ключевые архитектурные решения (читать перед работой)

| ADR | Что | Когда применяется |
|---|---|---|
| [ADR-001](../spec/backend/decisions/ADR-001.md) | Anonymous guest 3-day TTL | Sprint 2 (cleanup cron) |
| [ADR-002](../spec/backend/decisions/ADR-002.md) | Profile mutation policy (AGE_DOWNGRADE forbidden) | Sprint 3 (PATCH /me) |
| [ADR-003](../spec/backend/decisions/ADR-003.md) | Family read-only parental visibility | Sprint 9 |
| [ADR-004](../spec/backend/decisions/ADR-004.md) | Single-vendor YC — **OPTIONAL** теперь (GH unblocked) | deferred |
| [ADR-005](../spec/backend/decisions/ADR-005.md) | YooKassa Hybrid recurring + email fallback | Sprint 6-7 |

---

## 6. Ключевые цифры

| Метрика | Значение |
|---|---|
| **Дедлайн PERT P80** | 17 октября 2026 (W42) |
| **Local commits ahead of master** | 0 (всё запушено) |
| **PR open** | #25 (43 commits inside) |
| **Backend Python файлов** | 23 (все syntax-OK) |
| **Models в БД** | 8 таблиц + 16 индексов |
| **Frontend verify scripts** | 28 (все зелёные) |
| **Backend tests готовы** | ~35 (Sprint 0 baseline) |
| **Active risks** | 11 (1 closed, 4 mitigating, 6 open) |
| **Sprint 0 status** | ✅ Closed |
| **Sprint 1-3 boards** | pre-filled, pending start |

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
