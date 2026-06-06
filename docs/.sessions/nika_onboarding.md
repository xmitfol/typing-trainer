# Onboarding: Ника (Project Manager)

> **Дата:** 2026-06-06
> **Передаёт:** Клод-архитектор
> **Принимает:** Ника
> **Цель:** дать Нике полную картину проекта, чтобы она могла координировать с
> первого дня без необходимости спрашивать «а что у нас сейчас?»

---

## 0. Twenty-second briefing

Если читать совсем кратко:

> **Typing-trainer SaaS** — vanilla JS клавиатурный тренажёр для RU+EN
> аудитории (взрослые/подростки/дети × 2 языка = 6 курсов). Фронт **готов**
> (23 коммита в `integration/new-shell`, дизайн-аудит закрыт, 459 уроков),
> backend ещё **не начат** — есть SDD-пакет на 11 недель. GitHub-аккаунт
> Ивана **заблокирован** (ждёт ответа поддержки), поэтому ничего не пушится
> и нет PR. Твоя задача — координировать команду из 12 ролей, начиная с
> момента, когда backend стартует.

---

## 1. Команда и зоны ответственности

Полный roster — [docs/AGENT_TEAM.md](../AGENT_TEAM.md). Кратко кто за что:

| Роль | Кто | Что делает | Контакт по теме |
|---|---|---|---|
| Product Owner | **Иван** (живой человек) | Vision, бюджеты, утверждение релизов | Любое стратегическое решение |
| Architect | **Клод** | Архитектура, ADR, code review | Технические решения, схема |
| **Project Manager** | **Ты, Ника** | Координация, sprints, risks, status | Всё ниже по этому документу |
| Product Manager | **Полина** | PRD, roadmap, метрики продукта | Приоритизация, фичи |
| Frontend | **Алекс** | Vanilla JS, UI, адаптивность | Pages, components |
| Backend | **Борис** | FastAPI, PostgreSQL, JWT | API, schema |
| AI/ML | **Ася** | Weak keys analyzer (Phase 3) | Рекомендации |
| Content | **Катя** | 459 уроков, методология | Контент уроков |
| Marketing | **Марина** | Positioning, конкуренты | Launch |
| UX Research | **Юля** | Tests, инсайты | Юзер-тесты |
| QA | **Квинн** | Тестирование | Verify-suite |
| DevOps | **Дима** | Netlify, CI/CD, deploy | Инфраструктура |
| Security | **Сергей** | Compliance, аудит | 152-ФЗ, GDPR |
| Tech Writer | **Тимофей** | Документация | Update docs |

**Важно:** это AI-роли, не живые люди. Один человек (Иван) и команда AI-агентов. Делегирование задач — через Agent tool.

---

## 2. Текущее состояние проекта (2026-06-06)

### 2.1. Что готово
- ✅ **Phase 1 (Client-side MVP)** — закрыта
- ✅ **Frontend redesign** — 23 коммита поверх master в ветке `integration/new-shell`
  - Pages: index, onboarding, dashboard, course, lesson, task, builder, settings, achievements, profile, pricing
  - i18n RU/EN с runtime switching
  - MentorBubble интегрирован
  - Inline ExerciseInsert в уроках
  - Profile page с 6 табами
  - Polish-пакет (toolbar features, onboarding silent)
- ✅ **Content** — 459 уроков мигрированы на rich tip schema
- ✅ **Verify suite** — 26 Playwright-скриптов покрывают все ключевые flow
- ✅ **Backend SDD** — полный pack (PRD + TSD + IMPL_PLAN + 3 ADR) в [docs/spec/backend/](../spec/backend/)

### 2.2. Что блокировано
- 🚨 **GitHub аккаунт `xmitfol` заблокирован** — Иван написал в поддержку, ждём
- ⛔ Из-за этого: 23 коммита не пушены, PR'ов нет, CI не работает
- ⛔ Backend ещё не начат — нет разработчика

### 2.3. Что в работе
- Прямо сейчас в active-state — ничего (между фазами)
- Текущая сессия (этот документ) — твой onboarding

### 2.4. Что дальше по плану
- Когда GitHub разблокируется → разрулить PR-очередь
- Когда появится backend-dev (или будет решено делегировать Борису) → стартовать Sprint 0 из [03_IMPL_PLAN.md](../spec/backend/03_IMPL_PLAN.md)

---

## 3. Архитектура проекта (краткий тур)

### 3.1. Стек

| Слой | Что используется |
|---|---|
| Frontend | Vanilla HTML + CSS + JS, без build-step'а, без React |
| Persistence (Phase 1) | LocalStorage — всё хранится в браузере |
| Backend (Phase 2, не реализован) | Python 3.12 + FastAPI + PostgreSQL 16 + Redis 7 |
| Auth (запланирован) | Email/pass + Yandex OAuth + VK OAuth |
| Платёжка (запланирована) | YooKassa (RU only) |
| Deploy | Yandex Cloud / Selectel (план) |
| Email | Yandex 360 SMTP (план) |

### 3.2. Ключевые директории

```
/                       — статика, открывается в браузере
  index.html, dashboard.html, ...
assets/
  css/ js/ images/
data/lessons/           — 459 lesson JSON, 7 tier'ов
data/locales/           — ru.json + en.json
data/characters/        — реплики наставников
docs/
  spec/backend/         — Backend SDD (PRD + TSD + IMPL_PLAN + ADR)
  design/               — handoff от дизайнера + аудит 2026-06-04
  planning/             — старые MVP_PRD и PHASE_2_BACKLOG
  architecture/         — старые Backend_Architecture, Database Schema, ...
  .sessions/            — логи сессий, sprints/, weekly/ (теперь твоя зона)
scripts/                — 26 Playwright verify_*.py + migrate_lessons_rich_tips.py
.claude/agents/         — профили всех 13 ролей включая твой
```

### 3.3. Frontend flow

```
index.html (landing)
  ↓
onboarding.html (форма)
  ↓
dashboard.html
  ├→ course.html  →  lesson.html (теория)  →  task.html (практика)
  ├→ profile.html
  ├→ builder.html (Свои уроки)
  ├→ achievements.html
  └→ settings.html
```

### 3.4. Backend flow (запланирован)

```
Browser → Nginx → FastAPI workers → PostgreSQL + Redis
                       ↓
                  YooKassa (платежи)
                  Yandex 360 (email)
                  ARQ worker (async tasks)
```

Полная архитектура — [02_TSD.md §1](../spec/backend/02_TSD.md).

---

## 4. Backend SDD pack — твой будущий sprint board

Pack полный и закоммичен. Структура:

```
docs/spec/backend/
├── README.md                — 13 зафиксированных решений
├── 01_PRD.md (305)          — WHAT
├── 02_TSD.md (818)          — HOW
├── 03_IMPL_PLAN.md (362)    — WHEN (11 sprint'ов)
└── decisions/               — WHY (3 ADR)
    ├── ADR-001              — Anonymous 3-day TTL
    ├── ADR-002              — Profile mutation policy
    └── ADR-003              — Family read-only visibility
```

### 4.1. 11 sprint'ов из IMPL_PLAN

| Sprint | Цель | Verify-gate | Week |
|---|---|---|---|
| 0 | Инфраструктура | `make lint test` зелёный | 0 |
| 1 | Auth foundation | `verify_signup_flow.py` | 1 |
| 2 | OAuth + миграция гостя | `verify_guest_to_account.py` | 2 |
| 3 | Profile + Progress sync | `verify_sync_across_devices.py` | 3 |
| 4 | Achievements engine | `verify_anti_cheat.py` | 4 |
| 5 | Lessons API + paywall | 100% API access | 5 |
| 6 | YooKassa happy path | `verify_payment_e2e.py` | 6 |
| 7 | Payment edge cases | `verify_payment_lifecycle.py` | 7 |
| 8 | Analytics | PO отвечает на funnel | 8 |
| 9 | Family + GDPR | 3 verify-скрипта | 9 |
| 10 | Production-ready | k6 p95 < 200ms | 10 |
| 11-12 | Open beta | 100 users, 10 paying | 11-12 |

**Твой первый шаг**, когда backend стартует — открыть `docs/.sessions/sprints/sprint-0/` и завести sprint board.

### 4.2. Открытые риски из PRD/TSD

Полный список — [docs/spec/backend/risks.md](../spec/backend/risks.md) (ты ведёшь).

Топ-3:
1. **YooKassa recurring** — новая схема в РФ, может не сработать. Mitigation: fallback на single payment.
2. **GitHub блокировка** — задерживает start. Mitigation: продолжаем локально, не теряем фокус.
3. **Backend разработчик заболеет** — нет hot-swap. Mitigation: документация каждого sprint'а.

---

## 5. Твои артефакты и шаблоны

Все твои документы будут жить в `docs/.sessions/`:

```
docs/.sessions/
├── sprints/
│   ├── sprint-0/
│   │   ├── board.md         — TODO / In Progress / Blocked / Done
│   │   ├── standup.md       — daily лог
│   │   ├── blockers.md      — активные блокеры
│   │   └── retro.md         — после закрытия
│   ├── sprint-1/
│   └── ...
├── weekly/
│   ├── 2026-W23.md          — еженедельный digest для PO
│   ├── 2026-W24.md
│   └── ...
└── nika_onboarding.md       — этот файл
```

Plus:
- [docs/spec/backend/risks.md](../spec/backend/risks.md) — risk register (создан, ты ведёшь)
- [docs/spec/backend/incidents/](../spec/backend/) — incident post-mortems (создаются по факту)

### 5.1. Что делать каждое утро

1. Открыть текущий sprint board → проверить статусы
2. Обновить standup-лог
3. Если есть блокер > 24ч — эскалировать (отметить в `blockers.md`, написать PO)

### 5.2. Что делать в пятницу

1. Coordinate sprint demo (если конец sprint'а)
2. Написать weekly digest в `docs/.sessions/weekly/YYYY-WW.md` для Ивана
3. Facilitate retro если конец sprint'а

### 5.3. Что отслеживать постоянно

- **Sprint completion %** — цель 100%
- **Blocker time-to-resolution** — медиана < 24ч
- **Cross-team lag** — frontend ждёт backend и наоборот
- **Risk register dynamics** — новые / переоцененные / закрытые

---

## 6. Communication протоколы

### 6.1. Кому что эскалировать

| Тип проблемы | Кому | Канал |
|---|---|---|
| Архитектурный спор | Клод | ADR в `decisions/` |
| Продуктовое решение | Полина → если не решит → Иван | Слайт-чат / PRD |
| Sprint delay > 1 день | Иван (PO) | Weekly digest или эскалация |
| Security issue | Сергей | Immediate |
| Производственный incident | Дима + Клод + Иван | Telegram |
| Контент-блок | Катя | Sprint board |

### 6.2. Что НЕ должна делать Ника

- ❌ Писать код
- ❌ Принимать архитектурные решения
- ❌ Менять PRD/TSD без согласия PO/Клода
- ❌ Игнорировать risks register
- ❌ Закрывать sprint без зелёного verify-gate

---

## 7. Контекст последних 23 коммитов (для понимания трендов)

Полный лог в `git log`. Краткий нарратив того, что произошло перед твоим приходом:

1. **Frontend redesign** (15 коммитов) — переход с монолитного UI на multi-page архитектуру по дизайн-handoff'у
2. **i18n + WPM fix** — добавлена локализация RU/EN, исправлены WPM-баги
3. **MentorBubble** — реплики наставника интегрированы в task.html (раньше character-system был isolated)
4. **Lesson Builder** — пользовательские уроки
5. **Inline ExerciseInsert** — главный UX-паттерн дизайна, мини-упражнения внутри теории
6. **Profile Page** — закрыт самый большой P1 gap из аудита
7. **Polish pack** — последние P1/P2 пункты аудита
8. **Lesson migration** — 458 уроков мигрированы на rich tip schema
9. **Backend SDD** — твой будущий план работы

Дизайн-аудит [docs/design/AUDIT_2026-06-04.md](../design/AUDIT_2026-06-04.md) **полностью закрыт**.

---

## 8. Что делать прямо сейчас (твой Day 1)

1. **Прочитать этот документ полностью** ✓
2. **Изучить Backend SDD pack** — [docs/spec/backend/](../spec/backend/)
3. **Создать risk register** — `docs/spec/backend/risks.md` (стартовая версия — см. ниже)
4. **Создать первый weekly digest** — `docs/.sessions/weekly/2026-W23.md`
5. **Подготовить sprint-0 шаблон** — `docs/.sessions/sprints/sprint-0/board.md` (пока пустой, активируется когда backend стартует)
6. **Сверить с Полиной** roadmap — не нужно сегодня, нужно когда backend старт близко

---

## 9. Полезные ссылки

### Memory (контекст из прошлых сессий)
- `C:\Users\Ivan\.claude\projects\c--Dropbox-Project-saas-typing-trainer\memory\MEMORY.md` — все user-memory entries
- `project_state.md` — снимок 2026-06-02
- `project_code_state.md` — состояние кода
- `project_team.md` — roster команды (тебя надо туда добавить)
- `project_curriculum.md` — curriculum overview
- `feedback_onboarding_ux.md` — feedback про онбординг

### Docs
- [Backend SDD pack](../spec/backend/) — основной фокус
- [Design audit](../design/AUDIT_2026-06-04.md) — закрытый аудит фронта
- [AGENT_TEAM.md](../AGENT_TEAM.md) — устаревший roster (надо обновить)
- [pricing.js](../../assets/js/pricing.js) — источник истины по тарифам

### Tools
- 26 verify-скриптов в `scripts/verify_*.py`
- `python scripts/verify_<name>.py` — запуск любого
- HTTP server: `python -m http.server 8000` из корня

---

## 10. Финальный чек: ты готова к работе если

- [ ] Можешь объяснить за 30 секунд, что у нас на фронте и что на бекенде
- [ ] Знаешь, где лежит твой sprint board (`docs/.sessions/sprints/`)
- [ ] Знаешь, что risk register живёт в `docs/spec/backend/risks.md` и обновляется еженедельно
- [ ] Понимаешь различие с Полиной (Product Manager — что строим; ты — как координируем)
- [ ] Знаешь, кому что эскалировать (см. §6.1)
- [ ] Понимаешь, что backend ещё не стартовал и blocked GitHub'ом
- [ ] Готова написать первый weekly digest в пятницу

---

**Добро пожаловать в команду, Ника.** Если есть вопросы — отметь их в `docs/.sessions/sprints/sprint-0/blockers.md` или сразу к Клоду / PO.
