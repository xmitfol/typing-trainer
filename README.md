# Typing Trainer

> Клавиатурный тренажёр на 459 уроков. 7 курсов в 3 возрастных дорожках (взрослые/подростки/дети) × 2 языка (RU/EN). Сертификация Bronze→Platinum.

[![Release](https://img.shields.io/badge/release-v0.2--parity-success)](https://github.com/xmitfol/typing-trainer/releases)
[![Lessons](https://img.shields.io/badge/lessons-459-blue)](#course-catalog)
[![Tiers](https://img.shields.io/badge/tiers-7-blue)](#course-catalog)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## О проекте

Клиентское веб-приложение для обучения слепой печати. Vanilla JavaScript, без build-системы, прогресс в localStorage. Полная параллель русских и английских курсов с возрастной дифференциацией (взрослые, подростки 12-17, дети 6-11).

**Чем отличается от других тренажёров:**
- 🎯 **Возрастные дорожки**: подросткам — гейминг/поп-культура/соц-сети, детям — сказки/животные, взрослым — деловые тексты/литература
- 🌍 **Полный паритет RU↔EN**: каждый английский курс имеет русский аналог идентичной структуры
- 🤖 **4 наставника с уникальными голосами**: Анна (учительница), Максим (опытный), Кнопыч (робот-геймер), Клавочка (добрая сказочница)
- 🏆 **Сертификация Bronze/Silver/Gold/Platinum** при завершении любого из 5 контент-курсов
- ⌨️ **3 layout клавиатуры**: Classic / Laptop / Ergonomic + live RU↔EN switching (ЙЦУКЕН↔QWERTY)
- 🌗 **Dark theme** auto через `prefers-color-scheme`

---

## Course Catalog

459 уроков в 7 тирах:

| Tier | Audience | Lang | Mentor | Lessons | Final WPM | Final chars |
|---|---|---|---|---|---|---|
| `tier1` | Adult | 🇷🇺 RU | Anna/Maxim | 99 | 105 | 419 |
| `block_1` | Diagnostic | 🇷🇺 RU | — | 11 | — | — |
| `ru_teen` | **Teen (12-17)** | 🇷🇺 RU | Кнопыч | 75 | 95 | 349 |
| `ru_kids` | **Kids (6-11)** | 🇷🇺 RU | Клавочка | 50 | 50 | 270 |
| `en_tier1` | Adult | 🇬🇧 EN | Anna/Maxim | 99 | 105 | 420 |
| `en_teen` | Teen (12-17) | 🇬🇧 EN | Knopych | 75 | 95 | 344 |
| `en_kids` | Kids (6-11) | 🇬🇧 EN | Klavochka | 50 | 50 | 271 |

Каждый контент-курс структурирован в 5-7 блоков с ритм-упражнениями, milestone-чекпойнтами, и финал-экзаменом для сертификации.

---

## Quick start

Статический сайт без build-системы. Запусти любой HTTP-сервер из корня:

```bash
# Python
python -m http.server 8000

# PHP
php -S localhost:8000

# Node.js
npx http-server -p 8000
```

Открой `http://localhost:8000` — на первой загрузке появится онбординг (имя + персонаж + клавиатура + язык). После онбординга курс автоматически выбирается по character+language (см. [Age-based routing](#age-based-routing)).

**Требования:** современный браузер (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+). Desktop-focused; mobile touch-keyboard layout — в Phase 2 backlog.

---

## Age-based routing

Выбор персонажа + языка на онбординге определяет курс:

| Character + Language | Tier |
|---|---|
| Anna/Maxim + RU | `tier1` (99 уроков, взрослый) |
| Anna/Maxim + EN | `en_tier1` (99 уроков, взрослый) |
| **Кнопыч + RU** | **`ru_teen`** (75 уроков, подросток) |
| **Knopych + EN** | **`en_teen`** (75 уроков, подросток) |
| **Клавочка + RU** | **`ru_kids`** (50 уроков, ребёнок) |
| **Klavochka + EN** | **`en_kids`** (50 уроков, ребёнок) |

Routing работает только на свежем онбординге — смена персонажа в Settings не трогает текущий tier (защита прогресса). Можно переключаться вручную через tier-switcher в sidebar.

---

## Features

### Content
- 459 уроков в 7 тирах с прогрессивной WPM (8 → 105)
- 4 наставника с локализованными character_tips (RU+EN, по 10 сценариев каждый)
- Rhythm-упражнения встроены в каждый блок для тренировки темпа
- Milestone-чекпойнты на L15/30/45/60/75/90 для больших курсов

### Interface
- **Lesson Picker** в sidebar со статусами (current/completed/available/locked) и star-rating
- **Tier-switcher** с группировкой по языку и age-kind border accents
- **Settings panel** — смена персонажа, сброс прогресса, UI language switcher, грид сертификатов
- **Top toolbar** — Classic/Laptop/Ergonomic switcher + Символы/Shift/Звук/Метроном toggles + RU/EN language pills

### Technical
- Vanilla JavaScript (ES6+), без build-системы
- Per-tier progress в localStorage с миграцией со старого flat-формата
- Web Audio API для keystroke sound + metronome
- CSS custom properties + `prefers-color-scheme` для auto dark theme
- Data-driven keyboard renderer (3 layouts × 2 языка)
- E2E tests via Playwright (см. [scripts/verify_*.py](scripts/))

---

## Project structure

```
typing-trainer/
├── index.html                  # Главная страница
├── assets/
│   ├── css/                    # main.css, keyboard.css, components.css, onboarding.css
│   └── js/                     # main.js, keyboard.js, onboarding.js, character-system.js,
│                               # certification.js, lesson-loader.js, settings-panel.js, etc.
├── config/
│   └── settings.js             # APP_CONFIG: tiers, certification thresholds, storage keys
├── data/
│   ├── lessons/
│   │   ├── tier1/              # 99 lessons (RU adult)
│   │   ├── block_1/            # 11 lessons (RU diagnostic)
│   │   ├── ru_teen/            # 75 lessons (RU teen)
│   │   ├── ru_kids/            # 50 lessons (RU kids)
│   │   ├── en_tier1/           # 99 lessons (EN adult)
│   │   ├── en_teen/            # 75 lessons (EN teen)
│   │   └── en_kids/            # 50 lessons (EN kids)
│   ├── characters/             # 8 character JSON-файлов (4 чарактеров × RU/EN)
│   └── quotes.json             # Цитаты для quote-panel
├── scripts/
│   ├── gen_*.py                # 14 lesson generators (для каждого блока/курса)
│   ├── verify_*.py             # Playwright E2E tests
│   └── fix_*.py                # Metadata fix scripts
└── docs/
    ├── planning/PHASE_2_BACKLOG.md   # Что осталось на Phase 2
    ├── architecture/                  # C4 модель, frontend/backend архитектура
    ├── design/                        # Design briefs (keyboard layouts, page variants)
    └── INDEX.md                       # Полный индекс документации
```

---

## Certification

Сертификация триггерится автоматически на финале любого контент-курса (L99/L75/L50) через `Certification.maybeAwardCertification()`.

| Level | WPM | Accuracy | Color |
|---|---|---|---|
| 💎 Platinum | ≥80 | ≥96% | `#e5e4e2` |
| 🥇 Gold | ≥60 | ≥93% | `#ffd700` |
| 🥈 Silver | ≥40 | ≥90% | `#c0c0c0` |
| 🥉 Bronze | ≥25 | ≥85% | `#cd7f32` |

Логика **upgrade-only**: новый сертификат пишется только если его уровень выше предыдущего. WPM/accuracy могут расти независимо. Грид всех заработанных сертификатов — в Settings → Достижения.

---

## Documentation

### Для разработчиков
- [Frontend Architecture](docs/architecture/Frontend%20Architecture.md)
- [C4 Architecture Model](docs/architecture/c4-model.md) (контекст / контейнеры / компоненты / код)
- [Design briefs](docs/design/) — keyboard layouts, page variants

### Планирование
- [PHASE_2_BACKLOG](docs/planning/PHASE_2_BACKLOG.md) — что осталось на Phase 2
- [Мастер-план системы курсов](docs/planning/Мастер-план%20системы%20курсов.md) — исходный контент-roadmap
- [MVP PRD](docs/planning/MVP_PRD.md)

### Команда
- [AGENTS.md](AGENTS.md) — команда AI-агентов
- [docs/AGENT_TEAM.md](docs/AGENT_TEAM.md) — структура и роли

**Полный индекс:** [docs/INDEX.md](docs/INDEX.md)

---

## Tech stack

**Сейчас (Phase 1):**
- Frontend: Vanilla JavaScript ES6+, HTML5, CSS3 custom properties
- Audio: Web Audio API
- Storage: LocalStorage (per-tier + per-lesson progress)
- Build: none — статические файлы
- Tests: Playwright (E2E), скрипты в `scripts/verify_*.py`

**Phase 2 (см. backlog):**
- Backend: TBD (Node.js / Ruby / Go)
- DB: PostgreSQL + Redis
- Auth: JWT, OAuth (Google/GitHub)
- Realtime: WebSocket (для multiplayer/tournament)
- Analytics: TBD (Metabase / Grafana)

---

## Roadmap

См. [docs/planning/PHASE_2_BACKLOG.md](docs/planning/PHASE_2_BACKLOG.md) для деталей.

- **v0.3 — Backend + accounts** (~6-8 недель): multi-device sync, JWT, серверный прогресс
- **v0.4 — Analytics + Mobile** (~7-8 недель параллельно): event tracking, mobile touch-keyboard
- **v0.5 — Tournament + i18n** (~10-12 недель параллельно): realtime multiplayer, полная UI локализация
- **v1.0 — Phase 2 complete**: SaaS-стек с accounts/multi-device/analytics/tournament/mobile

---

## Releases

- **[v0.2-parity](https://github.com/xmitfol/typing-trainer/releases/tag/v0.2-parity)** (2026-05-26) — Full RU↔EN parity (459 lessons, 7 tiers)
- **[v0.1-mvp](https://github.com/xmitfol/typing-trainer/releases/tag/v0.1-mvp)** (2026-05-25) — MVP launch (274 lessons, 5 tiers, certification)

Полный лог изменений: [CHANGELOG.md](CHANGELOG.md)

---

## Contributing

Проект в активной разработке. Contributing guidelines будут добавлены вместе с Backend в Phase 2.

Для содействия контентом — посмотри генераторы в `scripts/gen_*.py`, они content-table-driven и удобны для добавления уроков.

---

## License

MIT License — [LICENSE](LICENSE)

---

## Team

Над проектом работает команда из 11 AI-агентов (см. [docs/AGENT_TEAM.md](docs/AGENT_TEAM.md)) + Product Owner Иван. Архитектура и реализация в паре с Claude (Opus 4.7).

**Made with 🤖 + ❤️**
