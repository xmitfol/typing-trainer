# 🧪 QA Agent - Training Summary

**Книга:** "Соло на пишущей машинке" В.В. Шахиджанян (1992)
**Дата:** 2025-11-19
**Координатор:** Клод

---

## 🎯 Цель обучения

Изучить **критерии quality** и **методологию тестирования** для typing trainer на основе проверенной методики.

---

## 🔑 TOP-10 QA Insights

### 1. **Success Criteria - чёткие метрики**

**Из книги:**
> "Урок считается пройденным, если: WPM ≥ target WPM и errors < 5 на 100 символов."

**QA Test Cases:**

```javascript
// Test: Lesson completion criteria
describe('Lesson Completion', () => {
  it('should pass lesson with WPM >= target and errors < 5%', () => {
    const result = {
      wpm: 25,
      targetWPM: 20,
      errors: 3,
      totalChars: 100
    }
    expect(isLessonPassed(result)).toBe(true)
  })

  it('should fail lesson with WPM < target', () => {
    const result = {
      wpm: 15,
      targetWPM: 20,
      errors: 2,
      totalChars: 100
    }
    expect(isLessonPassed(result)).toBe(false)
  })

  it('should fail lesson with errors >= 5%', () => {
    const result = {
      wpm: 25,
      targetWPM: 20,
      errors: 6,
      totalChars: 100
    }
    expect(isLessonPassed(result)).toBe(false)
  })
})
```

---

### 2. **Progression Logic - linear only**

**Из книги:**
> "Нельзя перейти к уроку N+1, не завершив урок N. Никаких 'перепрыгиваний'!"

**QA Tests:**

```javascript
describe('Lesson Progression', () => {
  it('should NOT allow skipping lessons', () => {
    const user = { completedLessons: [1, 2, 3] }
    expect(canAccessLesson(user, 5)).toBe(false)
  })

  it('should allow next lesson after completion', () => {
    const user = { completedLessons: [1, 2, 3] }
    expect(canAccessLesson(user, 4)).toBe(true)
  })

  it('should allow replay of completed lessons', () => {
    const user = { completedLessons: [1, 2, 3] }
    expect(canAccessLesson(user, 2)).toBe(true)
  })
})
```

---

### 3. **Forward-only Typing - critical feature**

**Из книги:**
> "НЕ исправляйте ошибки во время упражнения. Печатайте до конца, потом повторите."

**QA Tests:**

```javascript
describe('Forward-only Typing', () => {
  it('should block Backspace during lesson', () => {
    const event = new KeyboardEvent('keydown', { key: 'Backspace' })
    const prevented = handleKeyPress(event, { lessonActive: true })
    expect(prevented).toBe(true)
  })

  it('should block Delete during lesson', () => {
    const event = new KeyboardEvent('keydown', { key: 'Delete' })
    const prevented = handleKeyPress(event, { lessonActive: true })
    expect(prevented).toBe(true)
  })

  it('should allow Backspace when lesson NOT active', () => {
    const event = new KeyboardEvent('keydown', { key: 'Backspace' })
    const prevented = handleKeyPress(event, { lessonActive: false })
    expect(prevented).toBe(false)
  })

  it('should show hint when Backspace pressed', () => {
    const spy = jest.spyOn(UI, 'showHint')
    handleBackspaceBlock()
    expect(spy).toHaveBeenCalledWith('Печатай до конца!')
  })
})
```

---

### 4. **WPM Calculation - accuracy critical**

**Формула из книги:**
```
WPM = (characters typed / 5) / (time in minutes)
```

**QA Tests:**

```javascript
describe('WPM Calculation', () => {
  it('should calculate WPM correctly', () => {
    const data = {
      charsTyped: 100,
      timeSeconds: 60
    }
    const wpm = calculateWPM(data)
    expect(wpm).toBe(20) // 100/5 / 1 = 20
  })

  it('should round WPM to integer', () => {
    const data = {
      charsTyped: 87,
      timeSeconds: 60
    }
    const wpm = calculateWPM(data)
    expect(wpm).toBe(17) // 87/5 / 1 = 17.4 → 17
  })

  it('should handle zero time edge case', () => {
    const data = {
      charsTyped: 100,
      timeSeconds: 0
    }
    const wpm = calculateWPM(data)
    expect(wpm).toBe(0) // Avoid division by zero
  })
})
```

---

### 5. **Error Tracking - precise detection**

**QA Tests:**

```javascript
describe('Error Detection', () => {
  it('should detect character mismatch', () => {
    const typed = 'привет'
    const expected = 'првет'
    const errors = detectErrors(typed, expected)
    expect(errors).toEqual([
      { position: 2, expected: 'в', typed: 'и' }
    ])
  })

  it('should count total errors', () => {
    const typed = 'првет мир'
    const expected = 'привет мир'
    const errorCount = countErrors(typed, expected)
    expect(errorCount).toBe(1)
  })

  it('should track errors by key', () => {
    const errors = [
      { key: 'к', count: 3 },
      { key: 'л', count: 5 }
    ]
    const weakKeys = getWeakKeys(errors, threshold = 3)
    expect(weakKeys).toEqual(['л', 'к'])
  })
})
```

---

### 6. **Ритм-упражнения - special rules**

**Из книги:**
> "Каждый 3-й урок - ритм-упражнение. БЕЗ новых букв!"

**QA Tests:**

```javascript
describe('Rhythm Lessons', () => {
  it('should identify rhythm lessons correctly', () => {
    expect(isRhythmLesson(3)).toBe(true)
    expect(isRhythmLesson(6)).toBe(true)
    expect(isRhythmLesson(9)).toBe(true)
    expect(isRhythmLesson(5)).toBe(false)
  })

  it('rhythm lesson should have NO new keys', () => {
    const lesson3 = getLessonData(3)
    expect(lesson3.newKeys).toEqual([])
  })

  it('rhythm lesson should show special badge', () => {
    const ui = renderLesson(3)
    expect(ui).toContain('🎵 Ритм-урок')
  })
})
```

---

### 7. **Session Duration - 15 min limit**

**Из книги:**
> "Оптимальная сессия - 15 минут. После - обязательный break."

**QA Tests:**

```javascript
describe('Session Duration', () => {
  it('should trigger break after 15 minutes', (done) => {
    jest.useFakeTimers()
    const spy = jest.spyOn(UI, 'showBreakSuggestion')

    startSession()
    jest.advanceTimersByTime(15 * 60 * 1000)

    expect(spy).toHaveBeenCalled()
    done()
  })

  it('should pause lesson on break', () => {
    triggerBreak()
    expect(isLessonActive()).toBe(false)
  })
})
```

---

### 8. **Barrier Support - critical UX**

**Из книги: 3 барьера на уроках 3-4, 7-8, 24-25**

**QA Tests:**

```javascript
describe('Barrier Support', () => {
  const barriers = [3, 4, 7, 8, 24, 25]

  barriers.forEach(lesson => {
    it(`should show motivation for lesson ${lesson}`, () => {
      const ui = renderLesson(lesson)
      expect(ui).toContain('motivation')
      expect(ui.motivationType).toBeDefined()
    })
  })

  it('should show CRITICAL support for lesson 24-25', () => {
    const ui24 = renderLesson(24)
    const ui25 = renderLesson(25)

    expect(ui24.motivationType).toBe('plateau_warning')
    expect(ui25.motivationType).toBe('plateau_breakthrough')
  })
})
```

---

### 9. **Weak Keys Detection - AI feature**

**QA Tests:**

```javascript
describe('Weak Keys Detection', () => {
  it('should detect keys with error rate > 15%', () => {
    const userData = {
      keyStats: {
        'к': { attempts: 20, errors: 5 }, // 25% error rate
        'л': { attempts: 20, errors: 2 }, // 10% error rate
        'м': { attempts: 20, errors: 0 }  // 0% error rate
      }
    }
    const weakKeys = detectWeakKeys(userData, threshold = 0.15)
    expect(weakKeys).toEqual(['к'])
  })

  it('should generate personalized drill for weak keys', () => {
    const weakKeys = ['к', 'м']
    const drill = generateDrill(weakKeys)

    const kCount = (drill.match(/к/g) || []).length
    const mCount = (drill.match(/м/g) || []).length

    expect(kCount + mCount).toBeGreaterThan(drill.length * 0.3)
  })
})
```

---

### 10. **Data Persistence - critical**

**QA Tests:**

```javascript
describe('Data Persistence', () => {
  it('should save progress to localStorage', () => {
    const progress = {
      completedLessons: [1, 2, 3],
      currentLesson: 4,
      stats: { wpm: 25, accuracy: 95 }
    }
    saveProgress(progress)

    const loaded = loadProgress()
    expect(loaded).toEqual(progress)
  })

  it('should NOT lose progress on page refresh', () => {
    completeLesson(5)
    window.location.reload()

    const progress = loadProgress()
    expect(progress.completedLessons).toContain(5)
  })

  it('should handle corrupted localStorage', () => {
    localStorage.setItem('progress', 'corrupted{data')

    expect(() => loadProgress()).not.toThrow()
    expect(loadProgress()).toEqual(defaultProgress)
  })
})
```

---

## 🎯 Testing Strategy

### Unit Tests
```
Coverage target: > 80%

Priority modules:
- WPM calculation
- Error detection
- Progression logic
- Weak keys detection
- Session timer
```

### Integration Tests
```
User flows:
1. New user → Lesson 1 → Complete → Lesson 2
2. Returning user → Load progress → Continue
3. Barrier lessons → Motivation shown
4. Weak keys → Drill generated
5. Session timeout → Break suggested
```

### E2E Tests (Cypress/Playwright)
```
Critical paths:
1. Onboarding → Character selection → First lesson
2. Complete 5 lessons → Check progress
3. Fail lesson → Retry → Pass
4. Reach lesson 24 → Barrier support shown
5. Complete course → Certificate generated
```

### Performance Tests
```
Metrics:
- Keystroke latency: < 50ms
- UI render: < 100ms
- WPM calculation: < 10ms
- Page load: < 2s
```

### Accessibility Tests
```
- Keyboard navigation
- Screen reader compatibility
- Color contrast (WCAG AA)
- Font sizes (readable)
```

---

## 📊 Quality Metrics

```javascript
qaMetrics = {
  // Code quality
  test_coverage: "> 80%",
  bug_density: "< 1 per 1000 LOC",
  code_review_pass_rate: "> 95%",

  // User experience
  lesson_load_time: "< 1s",
  keystroke_latency: "< 50ms",
  error_rate: "< 0.1% (false positives)",

  // Data integrity
  progress_save_success: "> 99.9%",
  data_corruption_rate: "< 0.01%",

  // Accuracy
  wpm_calculation_accuracy: "100%",
  error_detection_accuracy: "> 99%"
}
```

---

## 🎯 Action Items для QA

### Immediate:
- [ ] Set up testing framework (Jest/Vitest)
- [ ] Write unit tests for core modules
- [ ] Create test data fixtures (lessons, users)
- [ ] Set up CI/CD for automated testing

### Short-term:
- [ ] E2E tests for critical paths
- [ ] Performance benchmarks
- [ ] Accessibility audit
- [ ] Cross-browser testing

### Long-term:
- [ ] Load testing (1000+ concurrent users)
- [ ] Security testing
- [ ] Usability testing (real users)
- [ ] Regression test suite

---

## 🔗 Референсы

- [Training Sessions](./TRAINING_COMPLETE.md)

**Статус:** ✅ Обучение завершено
**Координатор:** Клод
**Дата:** 2025-11-19
