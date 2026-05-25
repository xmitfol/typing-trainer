# 006 Accessibility Compliance - Спецификация

> **Статус:** 🟡 draft
> **Создано:** 2025-11-16
> **Обновлено:** 2025-11-16
> **Автор:** Тимофей (Technical Writer)
> **Reviewers:** Клод (Architect), Quinn (QA), Иван (Product Owner)
> **Priority:** 🔴 Critical (Quality Gate 3 requirement)

---

## 📋 Краткое описание

Обеспечение полного соответствия приложения Typing Trainer стандарту WCAG 2.1 Level AA для доступности пользователей с ограниченными возможностями (keyboard-only navigation, screen readers, visual impairments).

---

## 🎯 Цели и ценность

### Для пользователя:
- **Accessibility for All:** Пользователи с disabilities могут полноценно использовать тренажер
- **Keyboard-Only Navigation:** Возможность использования без мыши (важно для слепых, users с motor disabilities)
- **Screen Reader Support:** Полная поддержка NVDA, JAWS, VoiceOver для незрячих пользователей
- **Visual Clarity:** Достаточный контраст и размер текста для пользователей с low vision
- **Inclusivity:** Никто не исключен из использования приложения

### Для бизнеса:
- **Legal Compliance:** Соответствие international accessibility laws (ADA, Section 508, European Accessibility Act)
- **Market Expansion:** +15-20% потенциальной аудитории (люди с disabilities)
- **SEO Boost:** Accessibility improvements = лучший SEO ranking
- **Brand Reputation:** Социальная ответственность и inclusive brand image
- **Competitive Advantage:** Мало typing trainers полностью accessible

### Для проекта:
- **Quality Standard:** WCAG AA = industry-recognized quality benchmark
- **Future-Proof:** Готовность к будущим accessibility regulations
- **Best Practices:** Adherence к web standards

---

## 👥 Целевая аудитория

**Primary:**
- **Пользователи с disabilities:**
  - Слепые (screen reader users)
  - Слабовидящие (low vision, color blindness)
  - Пользователи с motor disabilities (keyboard-only navigation)
  - Пользователи с cognitive disabilities (clear UI, simple language)
- Use case: Обучение touch typing с assistive technologies

**Secondary:**
- **Все пользователи:** Accessibility improvements = better UX for everyone
  - Keyboard shortcuts удобны всем (не только disabilities)
  - Высокий контраст улучшает читаемость на ярком свету
  - Clear UI помогает всем пользователям

---

## 📐 Функциональные требования

### Основной функционал

#### FR-1: Keyboard Navigation (WCAG 2.1.1, 2.1.2)
**Описание:** Все функции приложения доступны через клавиатуру без mouse.

**Acceptance Criteria:**
- [ ] **Tab Navigation:**
  - [ ] Tab перемещает фокус между interactive elements (слева направо, сверху вниз)
  - [ ] Shift+Tab перемещает фокус назад
  - [ ] Tab order логичен и соответствует визуальному порядку
  - [ ] Focus не попадает в "keyboard traps" (можно выйти из любого элемента)
- [ ] **Keyboard Shortcuts:**
  - [ ] Enter/Space активируют кнопки и links
  - [ ] Escape закрывает модальные окна и dropdowns
  - [ ] Arrow keys навигация внутри radio groups, lists
  - [ ] Все shortcuts документированы и не конфликтуют с browser/screen reader shortcuts
- [ ] **Typing Trainer Specific:**
  - [ ] Можно начать урок через клавиатуру (Enter на "Начать")
  - [ ] Можно сбросить урок через клавиатуру (shortcut или Tab → Enter)
  - [ ] Можно выбрать уровень сложности через клавиатуру (Tab + Arrow keys)
  - [ ] Virtual keyboard не требует mouse (подсветка работает автоматически)
- [ ] **Testing:**
  - [ ] Отключить mouse (физически или через DevTools)
  - [ ] Пройти весь user flow только на клавиатуре
  - [ ] Все функции доступны

**Priority:** 🔴 High (WCAG Level A requirement)

---

#### FR-2: Focus Indicators (WCAG 2.4.7)
**Описание:** Четкие визуальные индикаторы текущего focus для keyboard navigation.

**Acceptance Criteria:**
- [ ] **Visibility:**
  - [ ] Focus indicator видим на ВСЕХ interactive elements (buttons, links, inputs, selects)
  - [ ] Контраст focus indicator ≥ 3:1 с фоном
  - [ ] Focus indicator НЕ скрыт через CSS (`outline: none` только если есть custom focus style)
- [ ] **Styling:**
  - [ ] Consistent focus style по всему приложению
  - [ ] Custom focus style (если используется) лучше browser default:
    ```css
    :focus {
      outline: 3px solid #4A90E2;
      outline-offset: 2px;
    }
    ```
  - [ ] Focus style отличается от hover style (разные состояния)
- [ ] **Typing Trainer Specific:**
  - [ ] Focus на "Начать урок" button при загрузке страницы
  - [ ] Focus на текстовое поле при начале урока
  - [ ] Focus indicators на difficulty level selectors
- [ ] **Testing:**
  - [ ] Navigate с клавиатуры и verify focus всегда видим
  - [ ] Test на разных фонах (светлый/темный)

**Priority:** 🔴 High (WCAG Level AA requirement)

---

#### FR-3: Screen Reader Support (WCAG 1.3.1, 4.1.2)
**Описание:** Полная поддержка screen readers (NVDA, JAWS, VoiceOver) через semantic HTML и ARIA.

**Acceptance Criteria:**
- [ ] **Semantic HTML:**
  - [ ] Используем semantic tags: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`
  - [ ] Headings structure: `<h1>` (page title) → `<h2>` (sections) → `<h3>` (subsections)
  - [ ] Buttons через `<button>`, links через `<a>`, inputs через `<input>`
  - [ ] NO divs with onclick handlers (use real buttons)
- [ ] **ARIA Labels:**
  - [ ] Все интерактивные элементы имеют `aria-label` или `aria-labelledby`:
    ```html
    <button aria-label="Начать урок 1 - Левая рука, буквы ФЫВА">Начать</button>
    ```
  - [ ] Virtual keyboard keys имеют `aria-label`:
    ```html
    <div class="key" data-key="ф" aria-label="Клавиша Ф, левый мизинец">Ф</div>
    ```
  - [ ] Statistics elements имеют labels:
    ```html
    <div aria-label="Скорость набора 45 слов в минуту">WPM: 45</div>
    ```
- [ ] **ARIA Live Regions:**
  - [ ] Real-time updates анонсируются через `aria-live`:
    ```html
    <div aria-live="polite" aria-atomic="true">
      Ошибка! Нажата клавиша Ы вместо А
    </div>
    ```
  - [ ] WPM, accuracy, errors updates анонсируются (aria-live="polite")
  - [ ] Lesson start/end/reset анонсируются (aria-live="assertive")
- [ ] **ARIA Roles:**
  - [ ] Virtual keyboard: `role="application"` с инструкциями
  - [ ] Statistics panel: `role="region"` с `aria-label="Статистика набора"`
  - [ ] Difficulty selector: `role="radiogroup"` с `aria-label="Выбор уровня сложности"`
- [ ] **Alternative Text:**
  - [ ] Все изображения (если добавим) имеют `alt` text
  - [ ] Decorative images: `alt=""` (пустой alt)
  - [ ] Informative images: descriptive alt
- [ ] **Testing:**
  - [ ] Тест с NVDA (Windows): `nvda -m`
  - [ ] Тест с VoiceOver (Mac): Cmd+F5
  - [ ] Все content readable и understandable
  - [ ] Navigation логична

**Priority:** 🔴 High (WCAG Level A requirement)

---

#### FR-4: Color Contrast (WCAG 1.4.3, 1.4.11)
**Описание:** Достаточный цветовой контраст для пользователей с low vision и color blindness.

**Acceptance Criteria:**
- [ ] **Text Contrast:**
  - [ ] Normal text (< 18pt): contrast ratio ≥ 4.5:1
  - [ ] Large text (≥ 18pt или ≥ 14pt bold): contrast ratio ≥ 3:1
  - [ ] Проверить ВСЕ текстовые элементы:
    - [ ] Body text
    - [ ] Headings
    - [ ] Button text
    - [ ] Statistics (WPM, accuracy, errors)
    - [ ] Virtual keyboard keys
    - [ ] Lesson text
- [ ] **UI Elements Contrast:**
  - [ ] Interactive elements (buttons, borders, focus indicators): contrast ≥ 3:1
  - [ ] Form inputs borders: contrast ≥ 3:1
  - [ ] Virtual keyboard keys: contrast ≥ 3:1
  - [ ] Graphical objects (если есть charts): contrast ≥ 3:1
- [ ] **Color-Coded Information:**
  - [ ] Virtual keyboard finger colors НЕ единственный способ различить zones:
    - [ ] Добавить patterns или labels (например, "L-pinky", "R-index")
    - [ ] Or provide alternative color scheme для color blind users
  - [ ] Error highlights: не только красный цвет, но и icon/text
  - [ ] Success states: не только зеленый, но и icon/text
- [ ] **Testing Tools:**
  - [ ] **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/
  - [ ] **Chrome DevTools:** Inspect → Accessibility panel → Contrast ratio
  - [ ] **Color Contrast Analyzer (CCA):** Desktop app для проверки
  - [ ] **axe DevTools:** Автоматическая проверка contrast
- [ ] **Current State Analysis:**
  - [ ] Pink keys (#FF69B4) на темном фоне: check ratio
  - [ ] Orange keys (#FFA500) на темном фоне: check ratio
  - [ ] Green keys (#00FF00) на темном фоне: check ratio (может быть проблема для deuteranopia)
  - [ ] Cyan/Blue keys на темном фоне: check ratio
  - [ ] Purple keys на темном фоне: check ratio

**Priority:** 🔴 High (WCAG Level AA requirement)

---

#### FR-5: Headings and Labels (WCAG 2.4.6, 3.3.2)
**Описание:** Descriptive headings и labels для screen readers и cognitive disabilities.

**Acceptance Criteria:**
- [ ] **Heading Structure:**
  - [ ] `<h1>`: "Клавиатурный тренажер" (1 на странице)
  - [ ] `<h2>`: Major sections ("Урок 1", "Статистика", "Выбор уровня")
  - [ ] `<h3>`: Subsections (если есть)
  - [ ] NO пропусков уровней (h1 → h3 без h2)
  - [ ] Headings последовательны (не декоративные)
- [ ] **Form Labels:**
  - [ ] Все inputs имеют associated `<label>`:
    ```html
    <label for="lesson-selector">Выберите урок:</label>
    <select id="lesson-selector" name="lesson">...</select>
    ```
  - [ ] Labels visible (не только placeholder text)
  - [ ] Labels descriptive ("Введите текст урока", не просто "Текст")
- [ ] **Button Labels:**
  - [ ] Descriptive button text ("Начать урок 1", не просто "Начать")
  - [ ] Icon buttons имеют `aria-label`:
    ```html
    <button aria-label="Сбросить статистику"><svg>...</svg></button>
    ```
- [ ] **Section Labels:**
  - [ ] `<section>` и `<article>` имеют `aria-label` или heading:
    ```html
    <section aria-label="Статистика текущей тренировки">...</section>
    ```

**Priority:** 🟠 Medium (WCAG Level AA requirement)

---

#### FR-6: Error Identification and Suggestions (WCAG 3.3.1, 3.3.3)
**Описание:** Clear error messages и suggestions для исправления.

**Acceptance Criteria:**
- [ ] **Error Detection:**
  - [ ] Typing errors определяются в real-time
  - [ ] Errors визуально highlighted (не только цветом!)
  - [ ] Error count обновляется
- [ ] **Error Messages:**
  - [ ] Descriptive error text: "Ошибка: нажата клавиша Ы вместо А"
  - [ ] Error messages анонсируются screen reader (aria-live="assertive")
  - [ ] Error messages НЕ исчезают слишком быстро (min 5 sec или до dismissal)
- [ ] **Error Prevention:**
  - [ ] Virtual keyboard подсказывает правильную клавишу (highlight next key)
  - [ ] Hints можно включить/выключить (user preference)
- [ ] **Success Feedback:**
  - [ ] Correct keypress feedback (звук/визуал/анонс)
  - [ ] Lesson completion message: "Урок завершен! WPM: 45, точность: 92%"

**Priority:** 🟠 Medium (WCAG Level A requirement)

---

#### FR-7: Resize Text (WCAG 1.4.4)
**Описание:** Текст можно увеличить до 200% без потери функциональности.

**Acceptance Criteria:**
- [ ] **Browser Zoom:**
  - [ ] Text масштабируется при browser zoom (Ctrl/Cmd + +)
  - [ ] Layout не ломается при zoom 200%
  - [ ] NO horizontal scrolling при zoom 200% (responsive design)
  - [ ] Все content visible и readable
- [ ] **Font Sizing:**
  - [ ] Используем relative units (rem, em), НЕ px для font-size:
    ```css
    body { font-size: 1rem; } /* 16px default */
    h1 { font-size: 2rem; } /* 32px */
    ```
  - [ ] Minimum font size ≥ 14px (лучше 16px) для body text
- [ ] **Testing:**
  - [ ] Zoom to 200% в Chrome, Firefox, Safari
  - [ ] Verify all text visible
  - [ ] Verify no layout breaks

**Priority:** 🟠 Medium (WCAG Level AA requirement)

---

#### FR-8: Language of Page (WCAG 3.1.1)
**Описание:** Correct language attribute для screen readers.

**Acceptance Criteria:**
- [ ] **HTML lang attribute:**
  ```html
  <html lang="ru">
  ```
- [ ] Если есть mixed language content (например, английский текст в русском интерфейсе):
  ```html
  <span lang="en">WPM (Words Per Minute)</span>
  ```
- [ ] Screen readers правильно произносят текст (русский accent для русского текста)

**Priority:** 🟢 Low (WCAG Level A requirement, easy fix)

---

#### FR-9: Link Purpose (WCAG 2.4.4)
**Описание:** Link text descriptive и понятен вне контекста.

**Acceptance Criteria:**
- [ ] **Descriptive Links:**
  - [ ] AVOID: "Нажмите сюда" или "Подробнее"
  - [ ] USE: "Перейти к уроку 2" или "Читать документацию по touch typing"
- [ ] **Link Context:**
  - [ ] Link text + surrounding context = понятно куда ведет
  - [ ] Screen reader users могут navigate по links (tab through) и понимать purpose

**Priority:** 🟢 Low (WCAG Level A requirement)

---

### Дополнительный функционал (опционально)

#### FR-10: Multiple Ways to Navigate (WCAG 2.4.5) - Level AA
- Skip links ("Перейти к основному контенту")
- Breadcrumbs (для multi-page версии)
- Site map (для complex app)

#### FR-11: Focus Order (WCAG 2.4.3) - Level A
- Preserve meaningful sequence при tab navigation
- (Уже покрыто в FR-1, но можно выделить отдельно)

---

## 🎨 UI/UX требования

### Макеты и wireframes
- NO changes to existing design required
- Focus на adding ARIA attributes и improving contrast
- Wireframes: N/A (accessibility layer поверх existing UI)

### User Flow
```
[Open App] → [Keyboard navigation works] → [Select lesson via keyboard] →
[Start lesson (Enter)] → [Type with real-time feedback] → [Screen reader announces errors/WPM] →
[Complete lesson] → [Review stats (keyboard accessible)] → [Start new lesson or exit]
```

### Состояния UI
- **Default state:** All interactive elements have visible focus indicators
- **Focused state:** Clear outline/highlight on current element
- **Error state:** Visual + auditory + screen reader announcement
- **Success state:** Visual + auditory + screen reader announcement
- **Loading state:** `aria-live` region announces "Загрузка урока..."

---

## 🔧 Технические требования

### Архитектура
- **Компоненты:**
  - `accessibility.js` - Модуль для ARIA live regions, focus management
  - `keyboard-navigation.js` - Enhanced keyboard shortcuts и tab order
  - `contrast-checker.js` - (optional) Runtime contrast validation в dev mode
- **Data flow:**
  - User action → Event handler → UI update → ARIA announcement (если нужно)
  - Typing error → Error detection → Visual highlight + Screen reader announcement

### Технологии
- **Frontend:**
  - Vanilla JavaScript (existing)
  - ARIA attributes (HTML5)
  - Semantic HTML5
  - CSS для focus styles
- **Testing:**
  - **Lighthouse** (Chrome DevTools) - Accessibility score
  - **axe DevTools** (Browser extension) - Automated testing
  - **WAVE** (Browser extension) - Visual accessibility audit
  - **Color Contrast Analyzer** - Desktop app
  - **Screen Readers:**
    - NVDA (Windows) - Free
    - JAWS (Windows) - Paid (industry standard)
    - VoiceOver (Mac) - Built-in
  - **Keyboard-only testing:** Disable mouse

### Performance требования
- **Latency:** ARIA live announcements < 500ms после события
- **Screen Reader Performance:** NO lag при navigation (optimize ARIA updates)
- **Resource usage:** Accessibility features should NOT impact typing performance

---

## 📊 Data Model

### Структура данных

**Accessibility Settings (LocalStorage):**
```javascript
{
  "accessibilitySettings": {
    "highContrast": false, // Enable high contrast mode
    "screenReaderMode": false, // Enhanced screen reader announcements
    "keyboardHints": true, // Show next key hints
    "soundFeedback": true, // Audio feedback for errors/success
    "reduceMotion": false, // Respect prefers-reduced-motion
    "fontSize": "medium", // small | medium | large
    "timestamp": "2025-11-16T10:00:00Z"
  }
}
```

**User Preferences (от browser):**
```javascript
// Detect user preferences
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
const prefersColorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
```

---

## 🧪 Тестирование

### Automated Tests (Tools)

#### Lighthouse Accessibility Audit
- [ ] **Setup:** Chrome DevTools → Lighthouse tab
- [ ] **Run:** Generate report (Accessibility category)
- [ ] **Target Score:** ≥ 90 (preferably 95+)
- [ ] **Key Checks:**
  - [ ] Contrast ratios pass
  - [ ] ARIA attributes valid
  - [ ] Form elements have labels
  - [ ] Images have alt text
  - [ ] Headings structure logical

#### axe DevTools
- [ ] **Setup:** Install browser extension (Chrome/Firefox)
- [ ] **Run:** axe DevTools → Scan page
- [ ] **Target:** 0 violations (especially Critical/Serious)
- [ ] **Fix:** All reported issues

#### WAVE Browser Extension
- [ ] **Setup:** Install WAVE extension
- [ ] **Run:** Click WAVE icon → Review errors/warnings
- [ ] **Target:**
  - 0 Errors
  - < 5 Warnings (some warnings acceptable if justified)
  - No Contrast Errors

---

### Manual Tests (Screen Readers)

#### NVDA (Windows)
```bash
# Start NVDA in speech viewer mode (for testing without sound)
nvda -m
```
- [ ] Navigate application using Tab, Arrow keys
- [ ] Verify all text readable
- [ ] Verify ARIA labels announced correctly
- [ ] Verify live regions announce updates (WPM, errors)
- [ ] Test lesson flow from start to finish

#### VoiceOver (Mac)
```bash
# Enable VoiceOver
Cmd + F5
```
- [ ] Same tests as NVDA
- [ ] Verify VoiceOver rotor navigation works (`Cmd + Option + U`)

---

### Manual Tests (Keyboard Navigation)

#### Disable Mouse Test
- [ ] **Setup:** Unplug mouse OR use DevTools → Rendering → Emulate: "Emulate a focused page"
- [ ] **Test Full User Flow:**
  1. [ ] Tab to difficulty selector → Arrow keys to select → Enter
  2. [ ] Tab to "Начать урок" → Enter
  3. [ ] Type lesson text (keyboard already in use)
  4. [ ] Tab to "Сбросить" → Enter
  5. [ ] Tab to statistics → review (accessible)
  6. [ ] Escape to close any modals
- [ ] **Verify:** All functions accessible without mouse

---

### Manual Tests (Contrast)

#### Color Contrast Analyzer
- [ ] Download CCA app
- [ ] **Test ALL color pairs:**
  - [ ] Body text / background
  - [ ] Headings / background
  - [ ] Button text / button background
  - [ ] Link text / background
  - [ ] Virtual keyboard keys (ALL colors):
    - [ ] Pink (#FF69B4) / key background
    - [ ] Orange (#FFA500) / key background
    - [ ] Green (#00FF00) / key background
    - [ ] Cyan (#00FFFF) / key background
    - [ ] Blue (#0000FF) / key background
    - [ ] Purple (#800080) / key background
  - [ ] Statistics text / panel background
  - [ ] Error messages / error background
- [ ] **Fix:** Any pair with ratio < 4.5:1 (text) or < 3:1 (UI)

---

### Integration Tests
- [ ] Тест: Screen reader + keyboard navigation вместе
- [ ] Тест: High contrast mode + zoom 200%
- [ ] Тест: Reduced motion preference respected

### E2E Tests (User Scenarios)

#### Scenario 1: Blind User with Screen Reader
**User:** Иван, слепой, использует NVDA
**Goal:** Пройти урок 1

**Steps:**
1. [ ] Open app → Screen reader announces "Клавиатурный тренажер"
2. [ ] Tab to difficulty selector → NVDA announces "Выбор уровня сложности"
3. [ ] Arrow down → NVDA announces "Уровень 1: Левая рука, буквы ФЫВА"
4. [ ] Tab to "Начать" → Enter
5. [ ] NVDA announces "Урок начался. Наберите текст: фыва фыва фыва"
6. [ ] Type text
7. [ ] On error: NVDA announces "Ошибка! Нажата клавиша Ы вместо А"
8. [ ] On completion: NVDA announces "Урок завершен! Скорость: 30 WPM, точность: 85%"
9. [ ] SUCCESS if all steps work

#### Scenario 2: User with Motor Disability (Keyboard-Only)
**User:** Мария, не может использовать мышь (tremor)
**Goal:** Выбрать урок, пройти, сбросить результаты

**Steps:**
1. [ ] Tab through interface (no mouse)
2. [ ] All buttons/controls accessible via Tab
3. [ ] Select lesson via keyboard
4. [ ] Complete lesson
5. [ ] Reset via keyboard (Tab to button → Enter)
6. [ ] SUCCESS if no mouse needed

#### Scenario 3: User with Low Vision
**User:** Петр, слабое зрение, использует zoom 200% и high contrast
**Goal:** Прочитать инструкции и пройти урок

**Steps:**
1. [ ] Browser zoom 200% (Ctrl/Cmd + +)
2. [ ] All text readable, no layout breaks
3. [ ] High contrast mode ON (browser setting)
4. [ ] All elements visible with sufficient contrast
5. [ ] Virtual keyboard keys distinguishable
6. [ ] SUCCESS if all visible and usable

---

## 📈 Метрики успеха

### KPIs
- **Accessibility Score (Lighthouse):** Target: ≥ 90 (current: TBD)
- **axe DevTools Violations:** Target: 0 critical/serious violations (current: TBD)
- **WAVE Errors:** Target: 0 errors (current: TBD)
- **Contrast Failures:** Target: 0 elements below WCAG AA thresholds (current: TBD)
- **Keyboard Navigation Coverage:** Target: 100% features accessible via keyboard (current: TBD)

### Instrumentation
- **Event tracking:**
  - `accessibility_test_lighthouse_score: <score>`
  - `accessibility_test_axe_violations: <count>`
  - `accessibility_keyboard_navigation_pass: true/false`
  - `accessibility_screen_reader_test_pass: true/false`
- **Analytics:** Track usage of accessibility features (если добавим настройки)
  - `accessibilitySettings.highContrast: true/false`
  - `accessibilitySettings.keyboardHints: true/false`

---

## 🔒 Безопасность и Compliance

### Security considerations
- [ ] ARIA attributes не содержат sensitive data
- [ ] Screen reader announcements не leak personal info (в Phase 1 нет personal info)
- [ ] Accessibility features не create новые XSS vectors (validate ARIA content)

### Compliance
- [ ] **WCAG 2.1 Level AA:** Full compliance (this spec)
- [ ] **ADA (Americans with Disabilities Act):** Compliance (via WCAG AA)
- [ ] **Section 508 (US):** Compliance (via WCAG AA)
- [ ] **EN 301 549 (European):** Compliance (via WCAG AA)
- [ ] **Future:** Ready for WCAG 2.2 (minimal additional requirements)

### Privacy
- N/A for Phase 1 (no personal data collection related to accessibility)

---

## 🚀 Deployment

### Rollout Strategy
- **Phase 1:** Audit existing app → Fix critical issues (contrast, keyboard nav)
- **Phase 2:** Add ARIA labels и screen reader support
- **Phase 3:** Test with real screen reader users (beta testers)
- **Phase 4:** Full rollout

### Feature Flags
- [ ] Feature flag: `accessibility_enhancements_enabled: true` (default: true)
- [ ] Sub-flag: `screen_reader_announcements: true` (можно отключить для testing)

### Rollback Plan
- Accessibility features non-breaking (только additions, не removals)
- If issues: disable specific ARIA live regions via feature flag
- No rollback needed (improvements only)

---

## 🔗 Зависимости

### Блокеры
- [ ] **None:** Accessibility можно добавлять инкрементально
- [ ] Recommended: Finish existing specs (001-005) before testing accessibility (чтобы не тестировать дважды)

### Связанные спецификации
- **All specs должны учитывать accessibility:**
  - [001_AI_Weak_Keys_Analyzer_Specification.md](./001_AI_Weak_Keys_Analyzer_Specification.md)
  - [002_Lesson_System_Block1_Specification.md](./002_Lesson_System_Block1_Specification.md)
  - [003_Lesson_System_Block2_6_Specification.md](./003_Lesson_System_Block2_6_Specification.md)
  - [004_Statistics_Dashboard_Specification.md](./004_Statistics_Dashboard_Specification.md)
  - [005_User_Profile_Progress_Specification.md](./005_User_Profile_Progress_Specification.md)

---

## ⏱️ Timeline

### Estimation
- **Audit (Lighthouse, axe, WAVE):** 2 часа
- **Fix Contrast Issues:** 3 часа (recolor virtual keyboard если нужно)
- **Add ARIA Labels:** 4 часа (все interactive elements)
- **Keyboard Navigation Improvements:** 3 часа (ensure all features accessible)
- **Screen Reader Testing:** 4 часа (NVDA + VoiceOver)
- **Documentation:** 2 часа (accessibility guide для пользователей)
- **Total:** 18 часов (~2-3 дня)

### Milestones
- [ ] Audit completed - Week 1
- [ ] Critical issues fixed (contrast, keyboard nav) - Week 1
- [ ] ARIA labels added - Week 2
- [ ] Screen reader testing passed - Week 2
- [ ] Final validation (all tools ≥ 90 score) - Week 2
- [ ] Production deployment - Week 2 end

---

## ❓ Open Questions

- [ ] **Q1:** Нужна ли настройка high contrast mode или полагаемся на browser settings?
  - **Recommendation:** Начать с browser settings (media queries), добавить toggle позже если нужно
- [ ] **Q2:** Добавить ли sound feedback для typing errors (для blind users)?
  - **Recommendation:** YES, опционально (user preference)
- [ ] **Q3:** Нужен ли "Skip to main content" link?
  - **Recommendation:** YES для Level AA, easy to add
- [ ] **Q4:** Как обрабатывать virtual keyboard для screen reader users (они не видят подсветку)?
  - **Recommendation:** Announce next key via ARIA live: "Следующая клавиша: Ф, левый мизинец"

---

## 📝 Notes

### WCAG 2.1 Level AA Principles:
1. **Perceivable:** Information must be presentable to users in ways they can perceive
   - Text alternatives (alt text)
   - Captions for audio
   - Adaptable content (semantic HTML)
   - Sufficient contrast
2. **Operable:** UI components must be operable
   - Keyboard accessible
   - Enough time to read/interact
   - No seizure-inducing content
   - Navigable
3. **Understandable:** Information and UI must be understandable
   - Readable text
   - Predictable behavior
   - Input assistance (error messages)
4. **Robust:** Content must be robust enough for assistive technologies
   - Compatible with current/future tools
   - Valid HTML/ARIA

### Resources:
- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **WebAIM:** https://webaim.org/
- **ARIA Authoring Practices:** https://www.w3.org/WAI/ARIA/apg/
- **MDN Accessibility:** https://developer.mozilla.org/en-US/docs/Web/Accessibility

---

## 🔄 Changelog

### [2025-11-16]
- Создана спецификация Accessibility Compliance (WCAG 2.1 Level AA)
- 9 функциональных требований (FR-1 to FR-9)
- Comprehensive testing strategy (Lighthouse, axe, WAVE, screen readers)
- Timeline: 18 часов (2-3 days)

---

**Maintained by:** Тимофей (Technical Writer)
**Approved by:** [Pending] Иван (Product Owner)
**Reviewed by:** [Pending] Клод (Architect), Quinn (QA)
**Status:** 🟡 draft
**Priority:** 🔴 Critical (Quality Gate 3 requirement - NO spec can pass Gate 3 without accessibility audit)
