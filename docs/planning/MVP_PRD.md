# Product Requirements Document (PRD) - MVP

> **Product:** Typing Trainer SaaS
> **Version:** MVP (v1.0)
> **Owner:** Полина (Product Manager)
> **Approved by:** Иван (Product Owner)
> **Date:** 14 ноября 2025
> **Status:** ✅ Approved

---

## 🎯 Executive Summary

**Mission:**
Создать AI-powered клавиатурный тренажер, который помогает пользователям освоить слепую печать в 2x быстрее благодаря персонализированным рекомендациям.

**Target Launch:**
ASAP (~4-5 недель от сегодня, конец ноября 2025)

**Success Criteria:**
- 100 активных пользователей в первый месяц
- 50% completion rate первого урока
- >4.0 user satisfaction
- <5 critical bugs
- D7 retention >30%

---

## 👥 Target Audience

### Primary Personas:

**1. Олег (35) - Офисный работник**
- Pain: Медленная печать, много опечаток
- Goal: Повысить продуктивность на работе
- Motivation: Карьерный рост, экономия времени
- Willingness to Pay: Высокая (платежеспособная аудитория)

**2. Дмитрий (28) - Программист**
- Pain: Смотрит на клавиатуру при спецсимволах
- Goal: 100+ WPM с полной автоматизацией
- Motivation: Coding flow, эргономика
- Willingness to Pay: Высокая

**3. Алиса (20) - Студентка**
- Pain: Медленные конспекты
- Goal: Быстро научиться полезному навыку
- Motivation: Подготовка к карьере
- Willingness to Pay: Средняя (ограниченный бюджет)

**Priority:** Офисные работники и программисты (платежеспособная аудитория)

---

## 🎯 Product Vision

**Vision Statement:**
"Лучший AI-powered клавиатурный тренажер для русскоязычной аудитории, который делает обучение слепой печати эффективным, увлекательным и персонализированным."

**6-Month Goal:**
Качественный продукт для узкой аудитории с high retention и user satisfaction.

**Positioning:**
> "AI-powered персонализированный тренажер нового поколения. Не просто уроки, а умный коуч, который знает твои слабые места."

**Tagline:**
> "Научись печатать вслепую в 2x быстрее с AI-тренером"

---

## 🏆 Competitive Advantage

### vs nabiraem.ru (главный конкурент):

**Наши преимущества:**
1. ✅ **AI-powered** - персонализированные рекомендации (у них НЕТ)
2. ✅ **Weak Keys Analyzer** - умный анализ проблемных клавиш (у них НЕТ)
3. ✅ **Современный UI/UX** - clean, fast, intuitive
4. ✅ **Quality focus** - 99 продуманных уроков vs много посредственных
5. ✅ **Desktop optimization** - 60fps, отличная производительность

**Их преимущества:**
1. ✅ Много языков (7 иностранных курсов)
2. ✅ Lifetime опция
3. ✅ Established brand

**Differentiation:**
Мы - **premium AI-powered продукт** для тех, кто хочет результат быстрее и эффективнее.

---

## 📦 MVP Scope

### **Included in MVP:**

#### **Content:**
- ✅ **30 уроков** (Блоки 1-2)
  - Блок 1 (уроки 1-15): Основы - домашний ряд + базовые клавиши
  - Блок 2 (уроки 16-30): Расширение - верхний и нижний ряды

#### **Features:**
- ✅ Virtual keyboard с цветовой кодировкой пальцев
- ✅ Real-time статистика (WPM, accuracy, errors)
- ✅ Star rating система (1-5 звезд)
- ✅ LocalStorage для сохранения прогресса
- ✅ **AI Weak Keys Analyzer** (simplified) - ключевая фича!
- ✅ Lesson navigation и прогресс-бар
- ✅ Responsive design (desktop focus)

#### **Monetization:**
- ✅ **Freemium с Day 1**
  - Free: Блок 1 (уроки 1-15)
  - Premium: Блок 2+ (уроки 16-30, потом до 99)

---

### **Explicitly Out of Scope (MVP):**

#### **Features:**
- ❌ User authentication (Phase 2)
- ❌ Cloud sync (Phase 2)
- ❌ Leaderboards (Phase 2)
- ❌ Full AI recommendations engine (v1.1 - неделя после launch)
- ❌ Speed Plateau Detector (v1.1)
- ❌ Mobile/tablet optimization (desktop only)
- ❌ Gamification (achievements, badges) - Phase 3
- ❌ Social features - Phase 3

#### **Content:**
- ❌ Уроки 31-99 (будут добавлены post-launch)
- ❌ Детский курс (Phase 3)
- ❌ Подростковый курс (Phase 3)
- ❌ English локализация (Phase 3)
- ❌ Специализированные курсы (программирование) - Phase 3

---

## 💰 Monetization Strategy

> **Канонический источник цен:** `assets/js/pricing.js` (объект `PLANS`).
> Решение PO 2026-06-02: используется ценовая модель дизайн-handoff
> (Полный 490₽/мес / Семейный 890₽/мес, базовая месячная цена).
> Прежняя модель (299/399 Early Bird/Regular) — устарела.

### **Pricing Tiers:**

#### **Tier 1: Free** 🆓
- **Price:** 0₽ (навсегда)
- **Content:** Уроки 1-5 (paywall на уроке 6)
- **Features:**
  - Сохранение прогресса
  - Базовая статистика (WPM, accuracy)
  - Один язык / одна раскладка
- **Value Prop:** "Попробуй основы слепой печати бесплатно"

---

#### **Tier 2: Полный** 💎 (популярный)

- **Базовая цена:** **490₽/месяц**
- **Periods (со скидкой за длительность):**
  | Период | Цена | В мес | Скидка |
  |---|---|---|---|
  | 1 неделя | 150₽ | — | попробовать |
  | 1 месяц | 490₽ | 490₽ | базовая |
  | 3 месяца | 1 250₽ | 420₽ | −15% |
  | 6 месяцев (HIT) | 2 210₽ | 370₽ | −25% |
  | 1 год | 3 820₽ | 320₽ | −35% |

- **Содержимое:**
  - Все 99 уроков основного курса
  - Все 3 типа клавиатуры (Classic / Laptop / Ergonomic)
  - Все языки и раскладки (ЙЦУКЕН/QWERTY/+)
  - Тренажёр скорости с метрономом
  - Сертификат после завершения курса
  - Детальная аналитика и графики

**Value Prop:** "Лучший выбор для одного"

---

#### **Tier 3: Семейный** 👨‍👩‍👧‍👦

- **Базовая цена:** **890₽/месяц**
- **Periods:** аналогично Полному (×3=2270, ×6=4010, ×12=6940 итого)

- **Содержимое:**
  - Всё из Полного
  - До 5 профилей (взрослые + дети)
  - Подростковый курс с Кнопычем (75 уроков)
  - Детский курс с Клавочкой (50 уроков)
  - Родительская статистика по каждому профилю

**Value Prop:** "До 5 человек"

---

### **Payment Integration (Phase 2 backend):**

**Способы оплаты:** Карты (Visa/MC/МИР), СБП по QR, Кошельки (ЮMoney/Telegram).

**Payment Flow** (см. `pricing.html`):
1. Юзер достигает paywall (lesson 6) или нажимает «Выбрать тариф» с лендинга
2. Модал подписки: 5 периодов × 3 плана (Free/Полный/Семейный), live-пересчёт цены
3. Подтверждение → переход в payment step
4. Ввод карты + email для чека
5. 3D Secure → instant unlock premium контента
6. Email-чек

**Текущий статус:** UI всех экранов готов в `pricing.html` (DEMO режим — реальный платёжный шлюз = Phase 2 backend).

---

### **Pricing vs Competitor (nabiraem.ru):**

| Plan | nabiraem.ru | Typing Trainer | Difference |
|------|-------------|----------------|------------|
| Monthly | 333-392₽ | **490₽** (Полный) | +25-45% |
| 6 months | — | **370₽/мес** (со скидкой −25%) | competitive |
| Annual | — | **320₽/мес** (со скидкой −35%) | ≈ competitor monthly |
| Family | — | **890₽** (до 5 чел) | unique tier |
| Lifetime | 483₽/мес | ❌ нет (recurring only) | — |

Цены премиальнее конкурента в месячном тарифе — оправдывается лучшим UX, портретами наставников, эргономикой и семейным планом, которого у конкурентов нет.

**Justification for premium pricing:**
- AI-powered персонализация
- Современный UX
- Focused quality (99 продуманных уроков)
- Active development (новые фичи)

---

## 🎨 User Experience

### **User Journey:**

#### **1. Discovery:**
- Google Search: "клавиатурный тренажер"
- Social media post
- Word of mouth

#### **2. Landing Page:**
- Clear value proposition
- "Start for Free" CTA (no registration required)
- Quick demo/video
- Social proof (future: testimonials)

#### **3. First Session (Free User):**
- Click "Start"
- Brief tutorial (3 steps: "Смотри на экран, следи за подсветкой, набирай текст")
- Lesson 1 начинается сразу
- First "wow moment" - виртуальная клавиатура подсветка
- После урока: статистика + звезды + поощрение

#### **4. Onboarding (Lessons 1-5):**
- Прогресс виден (progress bar)
- Weak Keys hint появляется (AI magic moment)
- Steady improvement в WPM
- Unlock lesson 5 → чувство достижения

#### **5. Paywall (Lesson 15 → 16):**
- Completion Lesson 15: "Поздравляем! Ты освоил основы!"
- Stats summary: "Твой прогресс: 20 → 35 WPM (+75%)"
- Upgrade prompt:
  > "Продолжи обучение! Уроки 6-99 + клавиатура в 3 типах + сертификат.
  > Полный: 490₽/мес (или 320₽/мес при годовой подписке −35%)"
- CTA: "Upgrade to Premium" / "Remind me later"

#### **6. Premium User:**
- Instant unlock всех уроков (16-30 сейчас, потом больше)
- Full AI recommendations активны
- Детальная статистика доступна
- Email: "Welcome to Premium! Here's what's new..."

#### **7. Mastery:**
- Complete 99 lessons
- Certificate generation
- Encourage to share (social proof)
- Become advocate

---

### **Key Screens:**

1. **Landing Page** - Value prop, CTA, demo
2. **Lesson Screen** - Keyboard, text, stats, hints
3. **Stats Panel** - WPM, accuracy, graph, weak keys
4. **Lesson Navigation** - List, progress, lock/unlock
5. **Results Screen** - Stars, stats, next lesson CTA
6. **Upgrade Modal** - Pricing, benefits, CTA
7. **Payment Screen** - Stripe checkout

---

## 🤖 AI Features (Simplified for MVP)

### **AI Level 1: Weak Keys Analyzer**

**Что делает:**
- Анализирует последние 100 нажатий клавиш
- Определяет клавиши с highest error rate
- Ranking проблемных клавиш

**Output:**
```
Твои слабые клавиши:
🔴 Ф - 35% ошибок
🟠 Ы - 22% ошибок
🟡 Ъ - 18% ошибок

Совет: Повтори упражнение 3 для буквы Ф
```

**Implementation:**
- Client-side JavaScript (no backend needed)
- Real-time analysis
- localStorage для истории

**Free vs Premium:**
- Free: Top 3 слабые клавиши
- Premium: Top 10 + детальная статистика + рекомендации упражнений

---

### **AI Level 1.1 (v1.1 - неделя после launch):**

**Speed Plateau Detector:**
- Отслеживает WPM тренд (последние 10 тестов)
- Определяет застой (plateau)
- Trigger для специальных упражнений

**Full Recommendations Engine:**
- Персонализированные советы на основе паттернов
- "Тебе стоит сфокусироваться на..."
- Dynamic difficulty adjustment

---

## 📊 Success Metrics

### **Launch Metrics (Month 1):**

**Acquisition:**
- [ ] 1000 visitors
- [ ] 100 sign-ups (DAU)
- [ ] 10% conversion (visitor → user)

**Activation:**
- [ ] 70% complete lesson 1
- [ ] 50% complete lesson 5
- [ ] <10min time to first success

**Retention:**
- [ ] D1 retention: >40%
- [ ] D7 retention: >30%
- [ ] D30 retention: >15%

**Revenue:**
- [ ] 10 Premium subscribers (10% conversion)
- [ ] 3000₽ MRR
- [ ] <500₽ CAC (Customer Acquisition Cost)

**Quality:**
- [ ] <5 critical bugs
- [ ] >4.0 user satisfaction
- [ ] 60fps во время печати
- [ ] <2s page load

---

### **3-Month Metrics:**

**Acquisition:**
- [ ] 5000 total users
- [ ] 500 DAU
- [ ] Organic traffic 40%+

**Retention:**
- [ ] 30% reach lesson 10+
- [ ] D30 retention: >20%

**Revenue:**
- [ ] 50 Premium subscribers
- [ ] 15,000₽ MRR
- [ ] NPS > 40

**Product:**
- [ ] 99 уроков готовы
- [ ] AI recommendations работают
- [ ] <3 critical bugs

---

## 🚀 Launch Plan

### **Pre-Launch (Week 1-4):**

**Week 1-2: Development**
- Блок 2 контент (Катя: 20h)
- AI Weak Keys (Ася: 12h)
- Polish & bug fixes (Квинн: 16h)

**Week 3: Testing & Prep**
- Final QA (Квинн)
- Security audit (Сергей)
- Marketing materials (Марина)
- Payment integration test

**Week 4: Deploy**
- Deploy to Netlify (Дима)
- SSL + custom domain
- Analytics setup
- Monitoring

---

### **Launch Week:**

**Day 1: Soft Launch**
- Deploy to production
- Share with friends & family (seed users)
- Create VK group / Telegram channel

**Day 2-3: Content Seeding**
- Post on Habr.com
- Share on VC.ru
- Reddit (r/LearnRussian, r/typing)
- Personal network email

**Day 4-7: Amplification**
- Engage with early users
- Collect feedback
- Fix critical bugs (if any)
- Monitor metrics

---

### **Post-Launch (Weeks 2-12):**

**Week 2:**
- Analyze metrics
- User interviews (Юля: 10 users)
- Prioritize feedback

**Week 3-4:**
- Блок 3 контент (уроки 31-45)
- AI v1.1 (full recommendations)
- Quick wins from feedback

**Week 5-8:**
- Блоки 4-5 контент (уроки 46-75)
- Backend development начинается (Phase 2)

**Week 9-12:**
- Блоки 6-7 контент (уроки 76-99)
- Full course complete!
- Prepare Phase 2 launch

---

## 📋 Technical Requirements

### **Performance:**
- Page load: <2s
- Time to Interactive: <3s
- FPS во время typing: >55fps
- Lighthouse score: >90

### **Browser Support:**
- Chrome 80+ (primary)
- Firefox 75+
- Safari 13+
- Edge 80+

### **Responsive:**
- **Desktop:** 1920px, 1366px, 1024px (primary)
- **Tablet:** 768px (nice to have, но не приоритет)
- **Mobile:** Not supported в MVP

### **Security:**
- HTTPS only
- No secrets in code
- Input validation
- XSS prevention
- CSRF protection (Phase 2 - backend)

### **Accessibility:**
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast >4.5:1

---

## 🎯 Post-Launch Strategy

**Scenario: Build & Learn**

**Parallel tracks:**

**Track 1: Content Development**
- Week 2-3: Блок 3 (уроки 31-45)
- Week 4-5: Блок 4 (уроки 46-60)
- Week 6-7: Блок 5 (уроки 61-75)
- Week 8-10: Блоки 6-7 (уроки 76-99)

**Track 2: User Research**
- Weekly interviews (5-10 users)
- Usability testing новых фич
- Feedback analysis
- A/B testing

**Track 3: Backend Development (Phase 2)**
- Sprint 7-8: FastAPI + PostgreSQL setup
- Sprint 9-10: Authentication + Cloud sync
- Sprint 11-12: Full integration

**Decision Points:**
- Week 2: Go/no-go для Phase 2 (based on metrics)
- Week 4: Pricing adjustment (if needed)
- Week 8: Full course launch celebration

---

## ❌ Risks & Mitigations

### **Risk 1: Low conversion (free → premium)**
**Mitigation:**
- A/B test paywall messaging
- Offer trial (7 days premium free)
- Better value communication

### **Risk 2: High churn после lesson 5**
**Mitigation:**
- Improve onboarding flow
- Add micro-achievements
- Email re-engagement

### **Risk 3: Technical issues on launch**
**Mitigation:**
- Thorough QA (Квинн)
- Security audit (Сергей)
- Staged rollout (soft launch first)
- Monitoring & alerts (Дима)

### **Risk 4: Competitor response**
**Mitigation:**
- Speed to market (launch ASAP)
- Focus on AI differentiation
- Build community early

### **Risk 5: Slow content creation**
**Mitigation:**
- Катя starts now on блок 2
- Template-based approach
- Consider hiring content help

---

## 📞 Stakeholders

**Product Owner:** Иван
**Product Manager:** Полина
**Architect:** Клод

**Core Team:**
- Алекс (Frontend)
- Ася (AI/ML)
- Катя (Content)
- Квинн (QA)
- Дима (DevOps)
- Сергей (Security)

**Business Team:**
- Марина (Marketing)
- Юля (UX Research)

---

## ✅ Approval

**Approved by:** Иван (Product Owner)
**Date:** 14 ноября 2025

**Key Decisions Confirmed:**
- ✅ MVP: 99 уроков (полный tier1)
- ✅ Freemium: уроки 1-5 free / 6-99 premium (paywall на уроке 6)
- ✅ AI: Simplified Weak Keys Analyzer
- ✅ **Pricing (обновлено 2026-06-02):** Полный 490₽/мес, Семейный 890₽/мес (до 5 чел) — канонический источник `assets/js/pricing.js`
- ✅ Periods: 1 неделя / месяц / 3 / 6 (HIT) / год, скидки до −35% при годовой
- ✅ No Lifetime tier
- ✅ Desktop only
- ✅ Russia first
- ✅ Launch ASAP (~4-5 weeks)

---

**Next Steps:**
1. Briefing Катя (Content) - блоки 1-2 spec
2. Briefing Марина (Marketing) - pricing, positioning
3. Update Sprint 6 plan
4. Kickoff development

---

**Maintained by:** Полина (Product Manager)
**Version:** 1.0
**Last Updated:** 14 ноября 2025
