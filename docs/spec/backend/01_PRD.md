# 01 · PRD — Backend MVP

> **Product Requirements Document**
> **Версия:** 1.0 · **Дата:** 2026-06-06 · **Owner:** Иван (Product Owner)
> **Статус:** 🟡 Draft (требует апрува PO)
> **Заменяет:** [docs/planning/MVP_PRD.md](../../planning/MVP_PRD.md) (2025-11-14, частично устарел)

---

## 1. Цель и контекст

### 1.1. Mission

Перевести typing-trainer из чистого client-side приложения (localStorage) в полноценный SaaS-продукт, где пользователь имеет аккаунт, прогресс синхронизируется между устройствами, доступен платный режим, и команда видит реальные метрики использования.

### 1.2. Зачем

Текущее ограничение localStorage делает невозможным:
- Кросс-девайс прогресс (юзер не может продолжить на телефоне после ноутбука)
- Платная подписка (нет защищённого enforcement, кто платил — кто нет)
- Продуктовая аналитика (не знаем, где юзеры дропают, какие уроки сложные)
- Восстановление прогресса при потере браузерных данных
- Курсы для семьи / организаций (нужна модель Family / Team)

### 1.3. Положение в roadmap

```
Phase 1 (закрыта)  → Client-side MVP с localStorage   ✅ 21 коммит
Phase 2 (этот PRD) → Backend SaaS                     🟡 спека
Phase 3 (future)   → AI recommendations + B2B/Family  ⚪ backlog
```

---

## 2. Целевая аудитория

### 2.1. Сегменты

| Сегмент | Доля MVP | Описание |
|---|---|---|
| **RU взрослые** | 60% | 22-45 лет, IT-офис/удалёнка/студенты. Хотят 60+ зн/мин для работы. ЦЕЛЕВОЙ. |
| **RU подростки** | 20% | 12-17, школьники, готовятся к ЕГЭ/работе. Курс ru_teen. |
| **RU дети** | 10% | 6-11, родители покупают курс. Курс ru_kids. |
| **EN — экспаты, IT** | 10% | Англоговорящая аудитория. Все 3 возрастных группы. |

### 2.2. Персоны (расширены из MVP_PRD)

#### Анна, 28, Product Manager в IT
- Печатает «двумя пальцами» 25 зн/мин, хочет 60+
- Готова платить 490₽/мес если есть прогресс
- Использует Macbook днём + iPad вечером → **нужна синхронизация**
- Триггер для покупки: чувствует прогресс на 5-7 уроке

#### Дмитрий, 14, школьник
- Учится играть в Minecraft с мама-плательщицей
- Использует семейный аккаунт (родители платят за всех)
- Нужно: **Family-режим, контент попроще (ru_teen)**

#### Olga, 35, экспат в Берлине
- Платит в евро (но мы пока RU only — в backlog)
- Использует en_tier1 курс
- v1.0: **видит paywall и Settings → Currency = USD/EUR заглушку**

---

## 3. Use cases — основной цикл

### 3.1. Регистрация / Sign in

```
Гость на лендинге → клик «Начать бесплатно» → онбординг анонимный
                                              ↓
                               первые 3 урока сохраняются в localStorage
                                              ↓
                       prompt «Сохрани прогресс — зарегистрируйся»
                                              ↓
                  email/пароль  или  Yandex OAuth  или  VK OAuth
                                              ↓
                       localStorage → сервер (миграция за 1 запрос)
                                              ↓
                       профиль + прогресс синхронизированы
```

**Acceptance**: после регистрации юзер видит свой прогресс на другом устройстве после login.

### 3.2. Daily training session

```
Login → dashboard → "Продолжить курс" → lesson.html → task.html →
       → завершение упражнения → результат уходит на сервер
       → достижения проверяются на сервере → новые ачивки в UI
       → следующий урок открыт
```

**Acceptance**: прогресс виден на сервере через `/api/v1/me/progress` сразу после завершения task.

### 3.3. Покупка подписки

```
Юзер на 6-м уроке → paywall banner на dashboard/profile/lesson →
       → /pricing → выбор тарифа → форма оплаты YooKassa →
       → webhook YooKassa → подтверждение → unlock премиум функций →
       → email-чек
```

**Acceptance**: после успешной оплаты юзер видит весь курс (99 уроков), Family-аккаунт регистрирует до 4 человек.

### 3.4. Свои уроки (Builder)

Уже работает в localStorage. v1.0 — продолжаем localStorage (низкий приоритет для sync). v1.1 — sync в БД.

### 3.5. Восстановление пароля

```
"Забыл пароль" → email с токеном → форма new password → login
```

Стандарт.

---

## 4. Фичи MVP — что должно работать

### 4.1. ✅ MUST (без этого не релизим)

1. **Регистрация email/password** с подтверждением email
2. **Логин email/password** + восстановление пароля
3. **Yandex OAuth** + **VK OAuth** — клик-и-вошёл
4. **Анонимный режим** — гость может пройти первые N уроков без аккаунта (миграция при логине)
5. **Sync профиля** (`name`, `gender`, `audience`, `character`, `language`, `keyboardType`, `keyboardLayout`, `fingerHint`, `keySound`, `metronome`, `taskZoom`, `hideIndicator`, `previewOff`)
6. **Sync прогресса** (`lessonProgress[N] = {stars, bestWPM, bestAccuracy, bestTime, completedAt}`)
7. **Sync истории** (`testHistory[] = {lesson, completedAt, duration, wpm, accuracy}`)
8. **Sync достижений** (вычисляются на сервере, защита от подделки)
9. **YooKassa интеграция** — оплата 1/3/6/12 месяцев + Family тариф
10. **Подписки** — статус `free`/`subscribed_until`, защита уроков 6+ paywall'ом
11. **Lessons API** — `GET /api/v1/lessons/{tier}/{n}` отдаёт JSON (миграция со static)
12. **Базовая аналитика** — события `lesson_started/completed/failed`, `signup`, `subscribed`, `churned`
13. **i18n API** — backend знает язык юзера, отдаёт сообщения корректно
14. **Rate limiting** — защита от DDoS / спам-регистраций
15. **Email-уведомления** — welcome, payment_receipt, password_reset, weekly_summary (опционально)

### 4.2. 🟡 SHOULD (хотим, но можно урезать)

16. **Гостевой режим > N дней без логина** → данные удаляются
17. **Family-режим** — 4 sub-account'а под одним платящим
18. **Сертификат PDF** при завершении курса
19. **Eкспорт данных** (GDPR-compliance)
20. **Account deletion** (GDPR-compliance)

### 4.3. ❌ WON'T (не в v1.0)

- AI weak-keys анализ (separate AIML spec)
- Лидерборды / соревнования
- Магазин (наставники, темы)
- B2B / организации
- Sync custom lessons (Builder) — localStorage достаточно
- Stripe / международные платежи
- Mobile native (PWA достаточно)

---

## 5. Метрики успеха

### 5.1. Business KPI (3 месяца после launch)

| Метрика | Target | Stretch |
|---|---|---|
| **Платных подписок** (MRR-paying) | 200 | 500 |
| **Conversion rate** free → paid | 5% | 8% |
| **D7 retention** (signup → 7-day active) | 30% | 40% |
| **Churn monthly** | < 8% | < 5% |
| **DAU / WAU** | 0.4 | 0.5 |

### 5.2. Технические KPI

| Метрика | Target |
|---|---|
| **API p95 latency** | < 200ms |
| **Uptime** | 99.5% (= ~3.5 часа downtime/мес) |
| **Error rate** | < 0.5% per request |
| **Successful payment rate** | > 98% |
| **Email deliverability** | > 95% |

### 5.3. Product Health

- 100% завершённых lesson записаны в прогресс (нет потерь)
- 0 race conditions при двух одновременных сессиях
- < 1% юзеров жалуются на «потерял прогресс»

---

## 6. Constraints

### 6.1. Юридические

- **152-ФЗ** (RU персональные данные) — хранение на серверах в РФ или с согласием на международный трансфер
- **GDPR** (для EN-юзеров) — право на экспорт, право на забвение
- **Возрастной ценз** — kids tier (6-11) требует согласия родителей (COPPA-like)

### 6.2. Технические

- **Vanilla JS фронт** — никаких build-step'ов, никаких React. Backend — REST API + sessions через httpOnly cookies или JWT.
- **Backward compat** — фронт продолжает работать с localStorage если backend недоступен (graceful degradation)
- **i18n** — endpoints отдают данные на корректном языке (`Accept-Language` header или `language` поле)

### 6.3. Бизнес

- **Прайс зафиксирован** ([assets/js/pricing.js](../../../assets/js/pricing.js)): Полный 490/мес, Семейный 890/мес, скидки до -35% на 12 мес
- **Платёжка только RU** (YooKassa) — international платежи в backlog v1.1
- **Бюджет инфраструктуры** — стартовый VPS ≤ 3000₽/мес (Yandex Cloud / Selectel)

---

## 7. Скетчи / прототипы (ссылки)

Фронт-стороны уже готовы:
- **Onboarding flow** — [onboarding.html](../../../onboarding.html) (готов, нужно добавить auth-шаг)
- **Login/Signup forms** — НЕ ГОТОВЫ. Нужны: [docs/spec/backend/sketches/auth.png] (создать)
- **Paywall** — [pricing.html](../../../pricing.html) (готов как UI, нужно wire к YooKassa)
- **Profile** — [profile.html](../../../profile.html) (готов, нужно вытянуть данные с сервера вместо localStorage)
- **Dashboard** — [dashboard.html](../../../dashboard.html) (готов)

### Дизайн-handoff
Полный визуал: [docs/design/full plan/design_handoff_full/reference/](../../design/full plan/design_handoff_full/reference/)

---

## 8. Открытые вопросы (для будущих апдейтов PRD)

| # | Вопрос | Кто решает | Дедлайн |
|---|---|---|---|
| Q1 | Сколько уроков юзер проходит бесплатно (5 или 10)? | PO | до старта v1.0 |
| Q2 | Family — родитель видит прогресс детей? | PO | до старта payments |
| Q3 | Email-провайдер для transactional (Mailgun / SendGrid / Yandex 360)? | Backend lead | до старта auth |
| Q4 | Анонимный гость — сколько часов/дней данные хранятся до удаления? | PO | до auth-релиза |
| Q5 | Можно ли сменить character/audience после регистрации? | PO + Design | до v1.0 |

---

## 9. Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| YooKassa отклонит recurring (новая схема в РФ) | HIGH | Делаем «одноразовые» транзакции с авто-prompt'ом на продление |
| 152-ФЗ — хостинг в РФ не позволяет cross-border трансфер | MED | Yandex Cloud / Selectel — оба RU. Логи без PII в Cloudflare R2. |
| Конкурент (СОЛО на пишущей машинке) запускает свой SaaS | LOW | Мы быстрее (4 недели до релиза), UX лучше |
| Пользователи потеряли localStorage до миграции | HIGH | Phase 2.1 — обязательно опция «зарегистрироваться» в первые 5 минут с явным предложением |
| Backend крашится во время оплаты | CRITICAL | Idempotency keys, webhook retries, eventual consistency |

---

## 10. Definition of Done — v1.0 готов когда

- [ ] 100 пользователей зарегистрировано (закрытый бета)
- [ ] 10+ платных подписок прошли успешно
- [ ] Все 459 уроков отдаются через API (не из static)
- [ ] Прогресс синхронизирован между 2+ устройствами для тест-юзера
- [ ] verify_backend_e2e Playwright прогон зелёный
- [ ] Документация для разработчика бекенда обновлена
- [ ] Postmortem-шаблон готов в `docs/spec/backend/incidents/`

---

## Changelog

| Дата | Версия | Автор | Изменения |
|---|---|---|---|
| 2025-11-14 | 0.1 | Полина | Initial draft (MVP_PRD.md) |
| 2026-06-06 | 1.0 | Клод + PO | Полная переработка под пост-frontend-redesign состояние, добавлен payments+Lessons API scope |

