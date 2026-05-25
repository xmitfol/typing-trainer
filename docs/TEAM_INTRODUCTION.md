# 👋 Знакомство с командой Typing Trainer

> **Для:** Иван (Product Owner)
> **От:** Клод (Architect Agent)
> **Дата:** 14 ноября 2025

Привет, Иван! Рад представить тебе полную команду агентов, которые будут работать над проектом Typing Trainer.

---

## 🏗️ Архитектура команды

```
                         ┌─────────────────┐
                         │   Иван (PO)     │
                         │  Product Owner  │
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │  Клод (Claude)  │
                         │   Architect     │
                         └────────┬────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
   ┌────▼────┐              ┌─────▼─────┐           ┌──────▼──────┐
   │ Core    │              │ Business  │           │  Support    │
   │ Team    │              │ Team      │           │  Team       │
   └────┬────┘              └─────┬─────┘           └──────┬──────┘
        │                         │                         │
  ┌─────┼──────┐           ┌──────┼──────┐          ┌──────┼──────┐
  │     │      │           │      │      │          │      │      │
 Alex Boris  Ася         Полина Marina  Юля       Квинн  Дима  Сергей
Frontend Backend AI/ML   PM    Marketing UX       QA    DevOps Security
  Катя
Content
```

---

## 👥 Основная команда (Core Team)

### 1. 🎨 Алекс (Frontend Agent)
**Роль:** UI/UX разработчик

**Личность:**
- Перфекционист, внимателен к деталям
- "Пользователи чувствуют качество до того, как понимают его"

**Зона ответственности:**
- Виртуальная клавиатура
- Все UI компоненты
- Анимации (60fps обязательно!)
- Адаптивный дизайн
- Accessibility

**Текущая работа (Sprint 6):**
- ✅ Виртуальная клавиатура готова
- 🔄 UI для AI Level 1
- 🔄 Polish и баг-фиксы

**Файлы:** `assets/css/`, `assets/js/`, `index.html`

**Контакт:** @frontend-alex

---

### 2. ⚙️ Борис (Backend Agent)
**Роль:** Backend разработчик

**Личность:**
- Прагматик, заботится о безопасности
- "Двигайся быстро, но не ломай вещи"

**Зона ответственности:**
- FastAPI backend (Phase 2)
- PostgreSQL + Redis
- JWT authentication
- RESTful API
- Database optimization

**Статус:** ⏸️ **Ждет Phase 2** (Sprint 7)

**Будущие задачи:**
- User registration/login
- Cloud sync API
- Statistics API
- Lessons management API

**Файлы:** `backend/` (создадим в Phase 2)

**Контакт:** @backend-boris

---

### 3. 🤖 Ася (AI/ML Agent)
**Роль:** Специалист по машинному обучению

**Личность:**
- Аналитик, data-driven
- "Данным мы верим, модели проверяем"

**Зона ответственности:**
- Анализ слабых клавиш
- Детекция плато скорости
- Персонализированные рекомендации
- ML модели (Phase 2+)
- LLM интеграция (Phase 3)

**Текущая работа (Sprint 6):**
- 🔄 Weak Keys Analyzer (12h)
- 🔄 Speed Plateau Detector (8h)
- 🔄 Recommendations Engine (10h)

**Файлы:** `assets/js/ai/` (Phase 1), `backend/services/ai/` (Phase 2+)

**Контакт:** @ai-asya

---

### 4. 📝 Катя (Content Agent)
**Роль:** Создатель образовательного контента

**Личность:**
- Эмпатичный педагог, креативная
- "Каждое слово учит или вдохновляет"

**Зона ответственности:**
- 15 уроков для взрослых
- Мотивационные цитаты
- UI копирайт
- Инструкции и подсказки
- Детский курс (Phase 3)

**Текущая работа (Sprint 6):**
- ✅ Уроки 1-5 готовы
- 🔄 Уроки 6-15 (20h)
- 🔄 100 мотивационных цитат

**Файлы:** `data/texts/`, `data/quotes.json`

**Контакт:** @content-katya

---

## 💼 Бизнес-команда (Business Team)

### 5. 🎯 Полина (Product Manager Agent)
**Роль:** Product Manager

**Личность:**
- Стратег, user-centric
- "Решаем проблемы пользователей, а не строим фичи"

**Зона ответственности:**
- Продуктовая стратегия и roadmap
- Приоритизация фич (RICE framework)
- Метрики продукта (DAU, retention, churn)
- Feature specs (PRD)
- Go/No-go решения

**Текущая работа (Sprint 6):**
- 🔄 Finalize MVP feature set
- 🔄 Go-to-market стратегия
- 🔄 Success metrics для launch
- 🔄 Plan Phase 2 features

**Ключевые метрики:**
- DAU/MAU
- D7/D30 retention
- NPS > 50
- Feature adoption rate

**Контакт:** @pm-polina

---

### 6. 📣 Марина (Marketing Agent)
**Роль:** Marketing Specialist

**Личность:**
- Креативный стратег, data-driven
- "Лучший продукт без пользователей = невидимый продукт"

**Зона ответственности:**
- SEO/SEM
- Content marketing (блог)
- Social media (VK, Telegram)
- Email campaigns
- Landing page optimization
- Acquisition campaigns

**Текущая работа (Sprint 6):**
- 🔄 Landing page copy
- 🔄 SEO setup (meta tags)
- 🔄 Google Analytics / Yandex.Metrica
- 🔄 Social profiles (VK, Telegram)
- 🔄 Launch announcement plan

**Цели (Q1):**
- 1000 visitors/month
- 100 sign-ups/month
- Top 3 Google для "клавиатурный тренажер"

**Контакт:** @marketing-marina

---

### 7. 🔍 Юля (UX Research Agent)
**Роль:** UX Researcher

**Личность:**
- Эмпатичная, любопытная
- "Спрашивай пользователей, а не предполагай"

**Зона ответственности:**
- User interviews
- Usability testing
- Persona development
- User journey mapping
- A/B test планирование
- User feedback анализ

**Текущая работа (Sprint 6):**
- 🔄 10 user interviews
- 🔄 3 personas (Олег, Алиса, Дмитрий)
- 🔄 Usability testing MVP
- 🔄 Competitor analysis
- 🔄 User journey map

**Ключевые персоны:**
- **Олег** (35): Офисный работник, хочет продуктивность
- **Алиса** (20): Студентка, нужны быстрые результаты
- **Дмитрий** (28): Программист, advanced level

**Контакт:** @ux-yulya

---

## 🛠️ Support Team

### 8. 🧪 Квинн (QA Agent)
**Роль:** Quality Assurance специалист

**Личность:**
- Скептик-детектив, методичный
- "Если это может сломаться, оно сломается"

**Зона ответственности:**
- Cross-browser testing
- Mobile responsive testing
- Performance profiling
- Accessibility audit
- Bug tracking
- Test automation (Phase 2+)

**Текущая работа (Sprint 6):**
- 🔄 MVP Polish & Bug Fixes (16h)
- 🔄 Final testing перед launch
- 🔄 Accessibility audit (WCAG 2.1 AA)

**Цели:**
- 0 critical bugs в production
- Lighthouse score > 90
- 60fps во время typing
- Cross-browser 100%

**Контакт:** @qa-quinn

---

### 9. 🚀 Дима (DevOps Agent)
**Роль:** DevOps Engineer

**Личность:**
- Reliability engineer, автоматизатор
- "Автоматизируй всё, мониторь всё"

**Зона ответственности:**
- Deployment (Netlify/Vercel)
- CI/CD pipeline
- Docker (Phase 2)
- Monitoring & logging
- Infrastructure as Code

**Текущая работа (Sprint 6):**
- 🔄 MVP Deployment (8h)
- 🔄 Custom domain + SSL
- 🔄 Google Analytics setup
- 🔄 Basic monitoring

**Цели:**
- 99.9% uptime
- Deploy time < 10min
- Automated backups

**Контакт:** @devops-dima

---

### 10. 🛡️ Сергей (Security Agent)
**Роль:** Security Engineer

**Личность:**
- Параноик (в хорошем смысле)
- "Доверяй, но проверяй. Лучше перепроверяй."

**Зона ответственности:**
- Security audits
- Penetration testing
- OWASP Top 10 compliance
- Authentication security (Phase 2)
- Vulnerability scanning
- Incident response

**Текущая работа (Sprint 6):**
- 🔄 Pre-launch security audit
- 🔄 Dependency vulnerability scan
- 🔄 Client-side security review
- 🔄 HTTPS/SSL verification

**Критически важен в Phase 2** при запуске backend!

**Цели:**
- 0 critical vulnerabilities
- HTTPS everywhere
- No secrets in code

**Контакт:** @security-sergey

---

## 📊 Статус команды по фазам

### Phase 1 (MVP) - Сейчас (Sprint 6)
**Активные агенты:**
- ✅ Алекс (Frontend)
- ✅ Ася (AI/ML)
- ✅ Катя (Content)
- ✅ Квинн (QA)
- ✅ Дима (DevOps)
- ✅ Полина (Product Manager)
- ✅ Марина (Marketing)
- ✅ Юля (UX Research)
- ✅ Сергей (Security)

**Неактивные:**
- ⏸️ Борис (Backend) - ждет Phase 2

---

### Phase 2 (Backend Integration) - Спринты 7-12
**Новые активные:**
- 🔴 Борис (Backend) - КРИТИЧЕН
- 🔴 Сергей (Security) - КРИТИЧЕН для backend

**Продолжают:**
- Все остальные агенты

---

### Phase 3 (Expansion) - Спринты 13-18
**Полная команда активна**

Возможно добавление:
- Data Analyst Agent (бизнес-аналитика)
- Support Agent (поддержка пользователей)
- Localization Agent (мультиязычность)

---

## 🎯 Как работать с командой

### Для тебя, Иван (Product Owner):

1. **Полина (PM)** - твой главный контакт
   - Обсуждай vision, приоритеты, roadmap
   - Получай статус-апдейты
   - Принимай go/no-go решения

2. **Клод (Architect)** - координация разработки
   - Технические решения
   - Спринт-планирование
   - Интеграция работы всех агентов

3. **Юля (UX Research)** - голос пользователей
   - User insights
   - Валидация гипотез
   - Обратная связь от пользователей

4. **Квинн (QA)** - quality gates
   - Готовность к релизу
   - Критичные баги
   - Quality sign-off

### Коммуникация:

**Ежедневно:**
- Slack для quick updates
- GitHub Issues для багов/фич

**Еженедельно:**
- Sprint review (пятница)
- Sprint planning (понедельник)
- Product sync с Полиной

**Ежемесячно:**
- Roadmap review
- Metrics review
- User research insights

---

## 📂 Где найти агентов

Все профили агентов находятся в:
```
.claude/agents/
├── frontend-agent.md      # Алекс
├── backend-agent.md       # Борис
├── ai-ml-agent.md         # Ася
├── content-agent.md       # Катя
├── qa-agent.md            # Квинн
├── devops-agent.md        # Дима
├── product-manager-agent.md  # Полина
├── security-agent.md      # Сергей
├── marketing-agent.md     # Марина
└── ux-research-agent.md   # Юля
```

Каждый файл содержит:
- Полное описание роли
- Зоны ответственности
- Текущие задачи
- Как с ними работать
- Контакты

---

## 🚀 Следующие шаги

### Эта неделя (Sprint 6):
1. **Завершить MVP фичи** (Алекс, Ася, Катя)
2. **Final QA** (Квинн)
3. **Pre-launch marketing** (Марина)
4. **Security audit** (Сергей)
5. **Deploy to production** (Дима)

### После launch:
1. **Monitor metrics** (Полина, Марина)
2. **Collect user feedback** (Юля)
3. **Fix critical bugs** (Квинн → Алекс)
4. **Plan Phase 2** (Полина, Клод)

---

## 💬 Вопросы?

Если нужно:
- Изменить приоритеты → **Полина**
- Технический вопрос → **Клод**
- User feedback → **Юля**
- Маркетинг/рост → **Марина**
- Безопасность → **Сергей**
- Деплой/инфра → **Дима**

---

**Команда готова к работе! 🎉**

Иван, что скажешь? Кого-то хочешь добавить или изменить приоритеты?

---

**P.S.** Все агенты - это специализированные AI помощники. В реальности за всеми ними стою я, Claude, но каждый агент имеет свою экспертизу и стиль работы. Думай о них как о "шляпах", которые я надеваю в зависимости от задачи. Это помогает мне лучше фокусироваться на разных аспектах проекта.

**Maintained by:** Клод (Architect)
**Last Updated:** 14 ноября 2025
**Version:** 1.0
