# Спецификации фич - Typing Trainer

> **Назначение:** Детальные технические спецификации всех функций проекта
> **Формат:** `XXX_Feature_Name_Specification.md`
> **Статусы:** 🟡 draft → 🟢 approved → 🔵 in_progress → ✅ implemented

---

## 📋 Индекс спецификаций

### ✅ Implemented (Реализовано)

[Пока пусто - спецификации будут добавляться по мере работы]

---

### 🔵 In Progress (В разработке)

[Пока пусто]

---

### 🟢 Approved (Утверждено к реализации)

[Пока пусто]

---

### 🟡 Draft (Черновики)

#### 1. [006_Accessibility_Compliance_Specification.md](./006_Accessibility_Compliance_Specification.md) 🔴 CRITICAL
**Что:** WCAG 2.1 Level AA compliance - полная доступность для пользователей с disabilities
**Автор:** Тимофей (Technical Writer)
**Reviewers:** Клод (Architect), Quinn (QA), Иван (Product Owner)
**Создано:** 2025-11-16
**Оценка:** 18 часов (2-3 дня)
**Приоритет:** 🔴 CRITICAL - Quality Gate 3 requirement (все specs должны пройти accessibility audit)

**Краткое описание:**
- 9 функциональных требований (keyboard navigation, screen readers, color contrast, etc.)
- 135+ acceptance criteria чекбоксов
- Comprehensive testing strategy (Lighthouse, axe DevTools, WAVE, screen readers)
- Target: Lighthouse Accessibility Score ≥ 90

---

#### 2. [009_Ergonomic_Keyboard_Layout_Design_Brief.md](./009_Ergonomic_Keyboard_Layout_Design_Brief.md) 🟢 LOW
**Что:** ТЗ для дизайнера на визуал раздельной (split) эргономической клавиатуры
**Автор:** Клод (Architect)
**Reviewers:** Иван (PO), Алекс (Frontend)
**Создано:** 2026-05-24
**Оценка:** ~6-10 ч дизайнерской работы + ~8 ч фронта после макетов
**Приоритет:** 🟢 LOW (Phase 1 nice-to-have, не блокирует MVP)

**Краткое описание:**
- Раздельная клавиатура для пользователей split-ergonomic железа (Kinesis, MS Sculpt, Moonlander…)
- Сохраняет существующую палитру пальцев (6 цветов) — это пользовательская инструкция, не декор
- 2 обязательных макета (D-1 split desktop, D-2 mobile) + 2 опциональных
- Deliverables: Figma + PNG-mockups + SVG (опц.) + сводный документ с размерами
- Разблокирует «Эргономическая» опцию в [Onboarding](007_User_Profile_Onboarding.md), сейчас disabled с badge «скоро»

> **Примечание:** Кроме указанных 006 и 009, в директории также лежат файлы 007 и 008 не добавленные в этот индекс. Привести индекс в актуальное состояние — задача Тимофея.

---

## 📊 Статистика

| Статус | Количество | Процент |
|--------|------------|---------|
| ✅ Implemented | 0 | 0% |
| 🔵 In Progress | 0 | 0% |
| 🟢 Approved | 0 | 0% |
| 🟡 Draft | 1 | 100% |
| **TOTAL** | **1** | **100%** |

---

## 🎯 Приоритетные спецификации для создания

### Phase 1 (MVP) - Критичные:
1. **001_AI_Weak_Keys_Analyzer_Specification.md** 🔴 HIGH
   - AI Level 1 функциональность
   - Анализ слабых клавиш пользователя
   - Ответственный: Ася (AI/ML Agent)

2. **002_Freemium_Model_Specification.md** 🔴 HIGH
   - Логика 15 free / 84 premium уроков
   - Paywall UI и UX
   - Ответственный: Полина (PM) + Алекс (Frontend)

3. **003_Progress_Tracking_Specification.md** 🟠 MEDIUM
   - LocalStorage структура для прогресса
   - UI отображения прогресса
   - Ответственный: Алекс (Frontend)

4. **004_Lessons_Content_System_Specification.md** 🟠 MEDIUM
   - Структура уроков
   - Загрузка контента
   - Ответственный: Катя (Content)

5. **005_Statistics_Display_Specification.md** 🟢 LOW
   - WPM, accuracy, errors display
   - Real-time updates
   - Ответственный: Алекс (Frontend)

---

### Phase 2 (Backend Integration):
6. **101_User_Authentication_Specification.md**
7. **102_Cloud_Sync_Specification.md**
8. **103_Payment_Integration_Specification.md**
9. **104_AI_Level_2_ML_Models_Specification.md**

---

### Phase 3 (Expansion):
10. **201_Kids_Course_Specification.md**
11. **202_Gamification_Specification.md**
12. **203_Social_Features_Specification.md**

---

## 📝 Как создать новую спецификацию

### 1. Выбрать номер
- Phase 1 (MVP): 001-099
- Phase 2 (Backend): 100-199
- Phase 3 (Expansion): 200-299
- Phase 4 (Scaling): 300+

### 2. Скопировать шаблон
```bash
cp docs/specs/template.md docs/specs/001_Feature_Name_Specification.md
```

### 3. Заполнить шаблон
- Статус: начинаем с 🟡 draft
- Автор: указать агента (Ася, Алекс, Катя, и т.д.)
- Reviewers: всегда Клод + Иван

### 4. Workflow
```
🟡 draft → (review) → 🟢 approved → 🔵 in_progress → ✅ implemented
```

### 5. Создать Implementation Plan
После одобрения спецификации создать план в `docs/implementation/`

---

## 🔧 Требования к спецификациям

### Обязательные секции:
- ✅ Краткое описание
- ✅ Цели и ценность
- ✅ Функциональные требования (с Acceptance Criteria - минимум 3)
- ✅ UI/UX требования
- ✅ Технические требования
- ✅ Тестирование
- ✅ Метрики успеха
- ✅ **NEW:** Accessibility considerations (keyboard nav, screen readers, contrast)

### Опциональные секции:
- Data Model (если применимо)
- Security considerations (если применимо)
- Deployment strategy

### 🚦 Quality Gates (ОБЯЗАТЕЛЬНО с версии 1.1)

Все спецификации должны пройти **3 Quality Gates** перед реализацией:

**Gate 1: Draft → Approved** (47 checkpoints)
- Документация полная и детальная
- Functional Requirements с testable Acceptance Criteria
- Accessibility requirements указаны
- Technical review пройден (Клод, Иван)

**Gate 2: Approved → In Progress** (16 checkpoints)
- Implementation Plan создан
- Dependencies resolved
- Team aligned (все агенты в курсе)

**Gate 3: In Progress → Implemented** (72 checkpoints - САМЫЙ ВАЖНЫЙ!)
- Все Acceptance Criteria выполнены
- Manual Testing passed (Chrome, Firefox, Safari, Mobile)
- **Accessibility Audit ПОЛНЫЙ** (WCAG AA):
  - Lighthouse Accessibility ≥ 90
  - axe DevTools - 0 violations
  - WAVE - 0 errors
  - Keyboard navigation works
  - Screen reader tested (NVDA or VoiceOver)
- Code Quality passed
- QA Sign-off от Quinn

📖 Подробнее: [Specification Workflow](../processes/Specification_Workflow.md)

---

## 📚 Связанные документы

### Процессы:
- **Specification Workflow:** [../processes/Specification_Workflow.md](../processes/Specification_Workflow.md) - Quality Gates, статусы, workflow
- **Documentation Audit Guide:** [../processes/Documentation_Audit_Guide.md](../processes/Documentation_Audit_Guide.md)

### Шаблоны:
- **Specification Template:** [template.md](./template.md)
- **Implementation Plan Template:** [../implementation/template.md](../implementation/template.md)

### Стандарты:
- **Terminology System:** [../domain/typing-terminology.md](../domain/typing-terminology.md) - Используйте ТОЛЬКО эти термины!
- **Accessibility Spec:** [006_Accessibility_Compliance_Specification.md](./006_Accessibility_Compliance_Specification.md) - WCAG AA requirements

### Планы:
- **Implementation Plans:** [../implementation/README.md](../implementation/README.md)

---

## 🔗 Полезные ссылки

- **MVP PRD:** [../planning/MVP_PRD.md](../planning/MVP_PRD.md)
- **ROADMAP:** [../planning/ROADMAP.md](../planning/ROADMAP.md) *(скоро)*
- **Architecture:** [../architecture/](../architecture/)

---

## ✅ Checklist для новой спецификации

### Перед созданием спецификации убедитесь:
- [ ] Проверили, нет ли уже такой спецификации
- [ ] Определили номер (001-099 для Phase 1)
- [ ] Определили автора (агента)
- [ ] Ознакомились с template.md
- [ ] Ознакомились с Specification Workflow (Quality Gates!)
- [ ] **NEW:** Изучили Terminology System (используем ТОЛЬКО стандартные термины!)
- [ ] **NEW:** Ознакомились с Accessibility Spec (все features должны быть accessible!)

### Во время написания спецификации:
- [ ] Используйте термины ТОЛЬКО из [typing-terminology.md](../domain/typing-terminology.md)
- [ ] Acceptance Criteria - минимум 3, testable
- [ ] Accessibility requirements указаны (keyboard nav, screen readers, contrast)
- [ ] Technical requirements детализированы
- [ ] Testing strategy определена

### После создания спецификации:
- [ ] Добавили в этот индекс (README.md) в секцию Draft
- [ ] Обновили статистику
- [ ] Отправили на review Клоду и Ивану
- [ ] Прошли Quality Gate 1 (47 checkpoints) → статус 🟢 approved
- [ ] Создали Implementation Plan (template.md в docs/implementation/)
- [ ] Прошли Quality Gate 2 (16 checkpoints) → статус 🔵 in_progress
- [ ] После реализации - прошли Quality Gate 3 (72 checkpoints) → статус ✅ implemented
  - **Критично:** Accessibility Audit обязателен (Lighthouse ≥90, axe 0 violations, WAVE 0 errors)

---

**Maintained by:** Тимофей (Technical Writer)
**Last Updated:** 16 ноября 2025
**Version:** 1.1 (добавлены Quality Gates requirements и Terminology System)
