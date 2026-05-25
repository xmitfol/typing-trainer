# Documentation Audit Guide

> **Версия:** 1.0
> **Дата:** 15 ноября 2025
> **Frequency:** Ежемесячно
> **Ответственный:** Тимофей (Technical Writer)
> **Адаптировано из:** NoFluff Bot docs-integrity-analysis.md

---

## 🎯 Назначение

Периодический audit документации проекта для обеспечения:
- **Completeness** - вся необходимая документация существует
- **Accuracy** - информация актуальна и корректна
- **Consistency** - единый стиль и структура
- **Quality** - высокое качество и полезность

---

## 📅 Периодичность

**Рекомендуется:**
- **Full Audit:** Раз в месяц
- **Quick Check:** Еженедельно
- **After Major Release:** Обязательно

---

## ✅ Audit Checklist

### 1. **Inventory Check** (Инвентаризация)

#### Проверить наличие ключевых документов:
- [ ] **Root level:**
  - [ ] README.md
  - [ ] CHANGELOG.md
  - [ ] CLAUDE.md

- [ ] **Team & Management:**
  - [ ] TEAM_INTRODUCTION.md
  - [ ] AGENT_TEAM.md
  - [ ] SESSION_CONTEXT.md (актуальный)
  - [ ] Agent profiles (11 файлов в `.claude/agents/`)

- [ ] **Product & Planning:**
  - [ ] MVP_PRD.md
  - [ ] ROADMAP.md
  - [ ] Детальный план реализации.md
  - [ ] Мастер-план системы курсов.md

- [ ] **Specs & Implementation:**
  - [ ] docs/specs/ (все спецификации)
  - [ ] docs/implementation/ (все планы)

- [ ] **Architecture:**
  - [ ] Архитектура системы.md
  - [ ] Frontend Architecture.md
  - [ ] AIML Architecture.md
  - [ ] Database Schema.md
  - [ ] Deployment Strategy.md

- [ ] **Processes:**
  - [ ] Specification_Workflow.md
  - [ ] Documentation_Audit_Guide.md (этот файл)

- [ ] **User Docs** (Phase 2):
  - [ ] Quick Start Guide
  - [ ] FAQ
  - [ ] Complete User Guide

---

### 2. **Completeness Check** (Полнота)

#### Проверить что все документы заполнены:
- [ ] Нет пустых или placeholder файлов
- [ ] Все обязательные секции заполнены
- [ ] Нет "TODO" или "[TBD]" в критичных местах

**Метрика:** % файлов полностью заполнены
**Target:** >90%

---

### 3. **Accuracy Check** (Актуальность)

#### Проверить актуальность информации:
- [ ] Даты "Last Updated" корректны
- [ ] Версии соответствуют текущему состоянию
- [ ] Технические детали accurate (нет устаревшей информации)
- [ ] Links работают (нет broken links)

**Метрика:** % документов обновлены в последние 30 дней
**Target:** >50% (для активных документов)

---

### 4. **Consistency Check** (Единообразие)

#### Проверить единообразие:
- [ ] Naming conventions соблюдаются
  - Specs: `XXX_Feature_Name_Specification.md`
  - Implementation: `Spec_XXX_Feature_Name_Implementation.md`
- [ ] Структура документов единообразна (следуют шаблонам)
- [ ] Стиль написания консистентен (tone, formatting)
- [ ] Статусы используются правильно (🟡🟢🔵✅)

---

### 5. **Quality Check** (Качество)

#### Оценить качество документации:
- [ ] Документы понятны (не требуют дополнительных пояснений)
- [ ] Примеры актуальны и полезны
- [ ] Диаграммы и визуализации (если есть) читаемы
- [ ] Терминология консистентна (создать Glossary при необходимости)

**Оценка:** По шкале 1-5 для каждой категории
**Target:** Средняя оценка >4.0

---

### 6. **Coverage Check** (Покрытие)

#### Проверить coverage всех аспектов проекта:
- [ ] Все фичи задокументированы
- [ ] Все процессы описаны
- [ ] Архитектурные решения зафиксированы
- [ ] API documented (Phase 2+)

**Метрика:** % фич с документацией
**Target:** >80%

---

## 📊 Audit Metrics

### Собрать следующие метрики:

#### **1. Quantitative Metrics:**
- **Total files:** Количество markdown файлов
- **By category:**
  - Specs: X файлов
  - Implementation Plans: X файлов
  - Architecture: X файлов
  - Processes: X файлов
  - User Docs: X файлов
- **Average file size:** Средний размер (строки)
- **Update frequency:** Файлов обновлено за последние 30 дней

#### **2. Status Metrics:**
- **Spec statuses:**
  - 🟡 Draft: X
  - 🟢 Approved: X
  - 🔵 In Progress: X
  - ✅ Implemented: X
- **Completion rate:** % specs implemented / total specs

#### **3. Quality Metrics:**
- **Broken links:** Количество неработающих ссылок
- **Missing sections:** Документы с missing sections
- **Outdated docs:** >90 дней без обновлений
- **User feedback:** Оценка полезности (если собирается)

---

## 📝 Audit Report Template

После каждого audit создавать отчет:

```markdown
# Documentation Audit Report - [Month Year]

**Date:** YYYY-MM-DD
**Auditor:** Тимофей (Technical Writer)
**Scope:** Full / Quick Check

---

## 📊 Summary Statistics

| Category | Count | Change from last audit |
|----------|-------|------------------------|
| Total Files | X | +Y/-Z |
| Specs | X | +Y |
| Implementation Plans | X | +Y |
| Architecture Docs | X | 0 |
| Process Docs | X | +Y |

---

## ✅ Strengths

- [Хорошо организованная категория]
- [Актуальная документация по X]
- [High quality Y]

---

## ⚠️ Issues Found

### High Priority:
- [ ] Issue 1: [Описание]
- [ ] Issue 2: [Описание]

### Medium Priority:
- [ ] Issue 3: [Описание]

### Low Priority:
- [ ] Issue 4: [Описание]

---

## 🎯 Recommendations

1. [Рекомендация 1]
2. [Рекомендация 2]
3. [Рекомендация 3]

---

## 📈 Metrics

**Completeness:** X%
**Accuracy:** X%
**Consistency:** X/5
**Quality:** X/5
**Coverage:** X%

**Overall Score:** X% (target: >85%)

---

## 🔄 Action Items

- [ ] Action 1: [Что сделать] - Assignee: [Кто] - Due: [Когда]
- [ ] Action 2: [Что сделать] - Assignee: [Кто] - Due: [Когда]

---

**Next Audit:** [Date]
```

---

## 🔧 Tools для Audit

### Manual Tools:
- **Find broken links:** `grep -r "](.*\.md)" docs/ | check links`
- **Find TODO items:** `grep -r "TODO\|TBD\|\[TBD\]" docs/`
- **Count files:** `find docs/ -name "*.md" | wc -l`
- **Last updated:** `ls -lt docs/**/*.md | head -20`

### Automated Tools (опционально):
- **markdownlint:** Проверка синтаксиса markdown
- **link-checker:** Автоматическая проверка links
- **Vale:** Style guide enforcement

---

## 📚 Best Practices

### During Audit:
1. ✅ **Systematic approach:** Следуй checklist по порядку
2. ✅ **Document findings:** Записывай все issues сразу
3. ✅ **Prioritize:** High/Medium/Low priority для issues
4. ✅ **Actionable recommendations:** Конкретные action items

### After Audit:
1. ✅ **Create report:** Используй template выше
2. ✅ **Share with team:** Уведоми Клода и Ивана
3. ✅ **Track action items:** Monitor прогресс
4. ✅ **Update this guide:** Улучшай процесс

---

## 📋 Quick Audit (Weekly)

Сокращенная версия для еженедельной проверки:

- [ ] SESSION_CONTEXT.md актуален (last 7 days)
- [ ] ROADMAP прогресс обновлен
- [ ] Новые specs добавлены в индекс
- [ ] Критичные documents updated
- [ ] Broken links проверены

**Time:** ~30 минут

---

## 🔗 Related Documents

- **INDEX.md:** [../INDEX.md](../INDEX.md)
- **Specs Index:** [../specs/README.md](../specs/README.md)
- **Implementation Plans:** [../implementation/README.md](../implementation/README.md)
- **NoFluff Bot Analysis:** [../Learning/docs-integrity-analysis.md](../Learning/docs-integrity-analysis.md)

---

## 📅 Audit History

| Date | Auditor | Scope | Overall Score | Issues Found |
|------|---------|-------|---------------|--------------|
| 2025-11-15 | Тимофей | Initial Setup | N/A | N/A |
| TBD | TBD | Full Audit | TBD | TBD |

---

**Maintained by:** Тимофей (Technical Writer)
**Last Updated:** 15 ноября 2025
**Version:** 1.0
**Next Review:** Декабрь 2025
