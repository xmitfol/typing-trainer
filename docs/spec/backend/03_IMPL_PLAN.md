# 03 · Implementation Plan — Backend MVP

> **Implementation Plan**
> **Версия:** 1.0 · **Дата:** 2026-06-06
> **Производный от:** [02_TSD.md](02_TSD.md) v1.0
> **Длительность:** 10-12 недель (1 backend разработчик full-time + 0.3 frontend на интеграцию)

---

## 1. Принципы плана

1. **Sprint = 1 неделя** — короткие циклы с demo в пятницу
2. **Каждый sprint имеет verify-критерий** (зелёный E2E тест) — без него sprint не закрыт
3. **Frontend не ждёт бекенд** — параллельная разработка через mocks (MSW.js или localStorage adapter)
4. **Каждый sprint = 1 коммит на feature branch** → review → merge
5. **Risk-first** — auth + payments идут раньше, не оставляем на конец

---

## 2. Pre-sprint: подготовка инфраструктуры (week 0)

**Цель**: окружения готовы, мы можем catch'нуть код в первый sprint без задержек.

| Задача | Owner | Срок | Verify |
|---|---|---|---|
| Зарегистрировать домен `typing-trainer.ru` | PO | day 1 | `dig typing-trainer.ru` отвечает |
| Создать Yandex Cloud организацию + billing | PO | day 2 | login в console работает |
| Завести Docker Compose для local dev (postgres + redis + adminer) | Backend | day 3 | `docker compose up` поднимает 3 сервиса |
| Скаффолд backend/ репо: pyproject, ruff, mypy, pytest | Backend | day 4 | `make lint test` зелёный (даже без тестов) |
| Git workflow: `backend/main` branch protected, PR templates | DevOps/PO | day 5 | PR template виден при создании |
| OpenAPI skeleton с health endpoint | Backend | day 5 | `curl /health` → 200 |

**Gate**: к концу week 0 любой коммит в `backend/` проходит CI (lint + test stub).

---

## 3. Sprint 1: Auth foundation (week 1)

**Цель**: пользователь может зарегистрироваться, войти, выйти. Email-верификация работает.

### Tasks

| ID | Task | Estimate | Verify |
|---|---|---|---|
| S1.1 | Alembic migration: `users`, `oauth_accounts`, `user_settings` таблицы | 0.5d | `alembic upgrade head` chистая БД |
| S1.2 | `app/models/user.py` SQLAlchemy 2.0 модели | 0.5d | unit test create_user |
| S1.3 | `app/core/security.py` — Argon2 hash, JWT sign/verify | 1d | unit tests с известными векторами |
| S1.4 | `POST /api/v1/auth/signup` — email/pass + auto-create settings | 1d | integration test happy path + duplicate email |
| S1.5 | `POST /api/v1/auth/signin` — login → JWT cookies | 0.5d | integration test |
| S1.6 | `POST /api/v1/auth/signout` + `POST /auth/refresh` | 0.5d | integration tests |
| S1.7 | Email-провайдер интеграция (Yandex SMTP) + welcome email | 1d | реальный email прилетел в `gmail`-тест |
| S1.8 | `POST /auth/verify-email` + `POST /auth/forgot` + `POST /auth/reset` | 1d | E2E через mailhog в dev |

### Deliverable
- `verify_signup_flow.py` — Playwright тест: гость → signup → email link → verified
- Frontend: новый компонент `<auth-modal>` или `auth.html` (TBD)

### Gate
✅ Юзер может зарегистрироваться, получить welcome email, войти, выйти, восстановить пароль.

---

## 4. Sprint 2: OAuth + анонимный режим + миграция (week 2)

**Цель**: можно войти через Yandex/VK; гость может пройти 3 урока и потом «сохранить».

### Tasks

| ID | Task | Estimate | Verify |
|---|---|---|---|
| S2.1 | Yandex OAuth: register app, client_id/secret в env | 0.5d | manual: вошёл через Я-аккаунт |
| S2.2 | `app/core/oauth.py` — generic OAuth helper + Yandex strategy | 1d | unit test mock provider |
| S2.3 | `GET /auth/oauth/yandex/start` + `/callback` | 1d | integration test mock'нутый Yandex |
| S2.4 | VK OAuth — повторяем pattern для Yandex | 0.5d | integration test |
| S2.5 | `POST /auth/migrate-guest` — приём localStorage → INSERT progress/attempts | 1d | unit + E2E test |
| S2.6 | Frontend: модал «Зарегистрируйся, чтобы не потерять прогресс» | 0.5d | UX-проход |
| S2.7 | localStorage-to-API adapter с graceful fallback (offline) | 1.5d | verify_offline_mode.py |

### Deliverable
- `verify_oauth_yandex.py`, `verify_oauth_vk.py`
- `verify_guest_to_account.py`

### Gate
✅ Yandex/VK login работают на staging. Гость может пройти урок → зарегистрироваться → прогресс не теряется.

---

## 5. Sprint 3: Profile + Progress sync (week 3)

**Цель**: все данные с фронта (profile, settings, progress, attempts) синхронизируются с БД.

### Tasks

| ID | Task | Estimate | Verify |
|---|---|---|---|
| S3.1 | Alembic: `progress`, `attempts` таблицы | 0.5d | `\d+ progress` корректен |
| S3.2 | `GET /me`, `PATCH /me`, `DELETE /me` (soft delete) | 1d | integration tests |
| S3.3 | `GET /me/settings`, `PATCH /me/settings` | 0.5d | integration tests |
| S3.4 | `POST /me/progress` — atomic save (progress + attempt + achievements) | 1.5d | integration test concurrency |
| S3.5 | `GET /me/progress` — все уроки текущего tier'а | 0.5d | integration test |
| S3.6 | `GET /me/history?cursor=&limit=` cursor pagination | 1d | integration test 1000 entries |
| S3.7 | Frontend: lessonProgress/testHistory читаем из API, fallback на localStorage | 1.5d | verify_sync_across_devices.py зелёный |

### Deliverable
- `verify_sync_across_devices.py` — 2 контекста Playwright, прогресс синхронизирован
- Documented adapter pattern в `assets/js/api-client.js`

### Gate
✅ Завершить упражнение на устройстве A → на устройстве B виден прогресс через 5 сек.

---

## 6. Sprint 4: Achievements engine + сервер-side enforcement (week 4)

**Цель**: ачивки вычисляются на сервере; нельзя «накрутить» через JS-консоль.

### Tasks

| ID | Task | Estimate | Verify |
|---|---|---|---|
| S4.1 | Перенести [achievements.js](../../../assets/js/achievements.js) каталог в Python (services/achievement_service.py) | 0.5d | unit tests на каталоге |
| S4.2 | `compute_achievements(user_id)` — все 22 ачивки из БД | 1d | unit test fixture |
| S4.3 | Trigger на `POST /me/progress` → check new earned → INSERT INTO achievements | 1d | integration test |
| S4.4 | `GET /me/achievements` | 0.5d | integration test |
| S4.5 | Frontend: ачивки с сервера + правка [achievements-page.js](../../../assets/js/achievements-page.js) | 1d | verify_achievements.py обновлён |
| S4.6 | WPM cap + accuracy sanity check на server-side | 0.5d | integration test «накрутка отбракована» |
| S4.7 | Migration script: импорт localStorage achievements в БД при signup | 0.5d | integration test |

### Deliverable
- `verify_server_achievements.py`
- `verify_anti_cheat.py` — попытка отправить wpm=99999 отвергается

### Gate
✅ Ачивки появляются на dashboard через server. Невозможно отправить wpm > 1500 или accuracy > 100.

---

## 7. Sprint 5: Lessons API + защита paywall'ом (week 5)

**Цель**: уроки отдаются с сервера, paywall enforced на бекенде.

### Tasks

| ID | Task | Estimate | Verify |
|---|---|---|---|
| S5.1 | Сервис LessonRepository — читает [data/lessons/](../../../data/lessons/) с диска, кеширует в Redis | 1d | unit test |
| S5.2 | `GET /lessons/{tier}/{n}` + i18n через Accept-Language | 1d | integration tests RU + EN |
| S5.3 | `GET /lessons/{tier}` — список с метаданными | 0.5d | integration test |
| S5.4 | `GET /lessons/{tier}/{n}/access` — paywall + linear progression check | 1d | integration test «6-й урок без подписки → 403» |
| S5.5 | Frontend: lesson-loader.js использует API endpoint | 1d | verify_lesson_loader_api.py |
| S5.6 | Cache invalidation: при изменении файла lesson_NN.json — TTL 5 мин или manual flush | 0.5d | manual test |

### Deliverable
- Все 459 уроков отдаются через API
- Free-tier юзер на 6-м уроке получает 403 с paywall response

### Gate
✅ Frontend больше не fetch'ает static JSON. 100% lesson access идёт через API. Linear progression и paywall работают на бекенде.

---

## 8. Sprint 6: Payments YooKassa — happy path (week 6)

**Цель**: можно купить подписку и unlock'нуть полный курс.

### Tasks

| ID | Task | Estimate | Verify |
|---|---|---|---|
| S6.1 | Регистрация YooKassa shop (test mode + prod) | 0.5d (PO) | dashboard YK доступен |
| S6.2 | Alembic: `subscriptions` таблица | 0.5d | migration зелёная |
| S6.3 | `GET /pricing/plans` — отдаёт каталог из [pricing.js](../../../assets/js/pricing.js) | 0.5d | integration test |
| S6.4 | `POST /pricing/checkout` — создание YK платежа + сохранение в БД | 1.5d | integration test + manual в test mode |
| S6.5 | `POST /webhooks/yookassa` — signature validation + status update | 1.5d | unit test webhook + integration |
| S6.6 | Email уведомление о платеже (welcome to paid + receipt PDF) | 1d | реальный email |
| S6.7 | Frontend: `pricing.html` wire к `/pricing/checkout` + redirect на YK | 0.5d | verify_payment_e2e.py зелёный |

### Deliverable
- `verify_payment_e2e.py` — test card → webhook → subscription active → урок 6+ открыт
- В YK dashboard виден тестовый платёж

### Gate
✅ Можно оплатить в test mode → urok 6+ открывается. Webhook'и приходят и обрабатываются идемпотентно.

---

## 9. Sprint 7: Payments edge cases + recurring (week 7)

**Цель**: продление работает, отказы корректно обрабатываются.

### Tasks

| ID | Task | Estimate | Verify |
|---|---|---|---|
| S7.1 | Recurring: сохранение payment_method, cron'ер на продление | 1.5d | manual test в YK sandbox |
| S7.2 | Failure paths: declined card / expired / 3DS fail | 1d | integration tests |
| S7.3 | `POST /me/subscriptions/{id}/cancel` — отмена auto-renewal | 0.5d | integration test |
| S7.4 | Email reminders: 3 дня до окончания, день окончания | 1d | E2E manual |
| S7.5 | Idempotency проверка под нагрузкой (concurrent requests) | 0.5d | k6 stress test |
| S7.6 | Audit log таблица + service для всех payment-events | 1d | integration test |
| S7.7 | Frontend: статус подписки на dashboard + в profile | 0.5d | verify_subscription_ui.py |

### Deliverable
- `verify_payment_lifecycle.py` — buy → activate → renew → cancel → expire

### Gate
✅ Recurring продление работает в test mode. Все failure scenarios отображаются юзеру с понятными сообщениями.

---

## 10. Sprint 8: Analytics + telemetry (week 8)

**Цель**: события приходят на бекенд, можем строить funnel'ы.

### Tasks

| ID | Task | Estimate | Verify |
|---|---|---|---|
| S8.1 | Alembic: `events` таблица + monthly partitioning | 1d | manual `\d+ events_2026_06` |
| S8.2 | `POST /events/batch` — приём, валидация, INSERT | 1d | integration test batch 100 |
| S8.3 | Frontend: SDK для отправки событий (debounced, retry) | 1d | unit + integration test |
| S8.4 | События со фронта: signup, login, lesson_started, lesson_completed, lesson_failed, paywall_shown, subscribed | 0.5d | manual проверка в БД |
| S8.5 | Server-side события: payment_success, payment_failed, achievement_unlocked, churn | 0.5d | unit tests |
| S8.6 | Базовые funnel-queries в `docs/spec/backend/analytics-queries.sql` | 0.5d | manually run queries |
| S8.7 | Metabase / Redash setup для PO | 0.5d (DevOps) | PO видит D7 retention |

### Deliverable
- `analytics-queries.sql` с 10 ключевыми запросами (conversion, retention, churn, top lessons)
- BI dashboard на staging

### Gate
✅ PO может ответить на «сколько юзеров достигли 6-го урока за неделю» через готовый запрос.

---

## 11. Sprint 9: Family + GDPR (week 9)

**Цель**: семейный тариф работает + соответствие 152-ФЗ / GDPR.

### Tasks

| ID | Task | Estimate | Verify |
|---|---|---|---|
| S9.1 | `parent_user_id` колонка + RBAC проверки | 1d | unit test access |
| S9.2 | `GET /me/family`, `POST /me/family/add` — создание sub-account | 1d | integration tests |
| S9.3 | Frontend: Profile tab «Семья» (sub-accounts list) | 1d | verify_family_flow.py |
| S9.4 | `GET /me/export` — ZIP с JSON всех данных | 1d | integration test |
| S9.5 | `DELETE /me` — soft delete + email confirm + grace period | 1d | integration test |
| S9.6 | Hard-delete cron — через 30 дней grace | 0.5d | unit test |
| S9.7 | IP hashing в events (SHA256) | 0.5d | unit test |

### Deliverable
- `verify_family_flow.py`
- `verify_gdpr_export.py`
- `verify_gdpr_delete.py`

### Gate
✅ Родитель создаёт sub-account для ребёнка. Юзер может экспортировать и удалить свои данные.

---

## 12. Sprint 10: Production-ready (week 10)

**Цель**: сервис стабильно работает под нагрузкой, мониторим, готовы к open beta.

### Tasks

| ID | Task | Estimate | Verify |
|---|---|---|---|
| S10.1 | Sentry integration (errors + performance) | 0.5d | manual: ошибка в Sentry |
| S10.2 | Prometheus metrics + Grafana dashboard | 1d | dashboard виден |
| S10.3 | UptimeRobot мониторы на `/health` + `/api/v1/lessons/tier1/1` | 0.5d | Robot шлёт OK |
| S10.4 | k6 load test: 100 concurrent users, 1 час | 0.5d | p95 < 200ms |
| S10.5 | Backup стратегия: managed PG snapshots ежедневно + еженедельный full export | 0.5d | restore test |
| S10.6 | DR plan: документ как восстановить с нуля за < 1 час | 0.5d | step-by-step ran |
| S10.7 | Security audit: ZAP scan + secret scanning | 1d | 0 critical findings |
| S10.8 | Polishing: error pages, обновлённая i18n, locale-aware emails | 1d | manual |

### Deliverable
- `verify_load_100users.py` (k6 wrapper)
- Runbook `docs/spec/backend/runbook.md`

### Gate
✅ 100 concurrent users → p95 < 200ms, error rate < 0.5%, 0 critical security issues.

---

## 13. Sprint 11-12: Beta launch + iteration (weeks 11-12)

**Цель**: приглашаем первых 100 юзеров, реагируем на feedback.

### Tasks

- W11: Open beta (waitlist signup), 100 invitations
- W11: Daily review метрик + Sentry, ежедневный hotfix-budget 0.5d
- W12: Анализ funnel'ов, фикс самых критичных drop-off'ов
- W12: Подготовка к public launch (PR-материалы, social, лендинг)

### Gate (= Definition of Done из PRD)
✅ 100 users зарегистрировано, 10+ платных подписок, все 459 уроков доступны через API, кросс-девайс sync работает, все E2E verify зелёные.

---

## 14. Risk register с mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| YooKassa отклонит recurring | M | H | План B: single payment + email-reminder перед окончанием |
| Backend разработчик заболеет на 1+ неделю | M | M | Документация каждого sprint'а в `docs/spec/backend/sprints/` |
| Yandex Cloud API breaking change | L | H | Multi-cloud разворачиваемость (Terraform + minimal vendor lock) |
| Атаки на signup (бот-регистрация) | H | M | reCAPTCHA v3 (или Yandex SmartCaptcha) с самого старта |
| Бекенд медленнее фронтенда | H | M | Каждый API endpoint имеет p95 target в TSD |
| GDPR-проверки от EU юзеров до релиза compliance | L | H | Изначально не открываем регистрацию для не-RU IP в v1.0 |

---

## 15. Communication & decision log

### Артефакты процесса

- **Daily standup** (асинхронный в `docs/spec/backend/sprints/sprint-N/standup.md`)
- **Sprint demo** (Loom-видео или live, пятница 16:00)
- **Sprint retro** (`docs/spec/backend/sprints/sprint-N/retro.md`)
- **Decision log** (`docs/spec/backend/decisions/ADR-NNN.md` — Architecture Decision Records)

### Кто принимает решения

| Тип | Owner |
|---|---|
| Продуктовое (новые фичи / приоритет) | PO (Иван) |
| Технические (стек, API контракты, схема БД) | Backend lead |
| UI / UX | Design |
| Security / compliance | PO + Backend lead |
| Релиз go/no-go | PO |

---

## 16. Готовность чек-листа перед launch

- [ ] Все 11 sprint'ов закрыты с gate'ами
- [ ] verify_*.py 100% зелёные (вкл. новые backend-тесты)
- [ ] Sentry / Grafana / UptimeRobot настроены
- [ ] Backup restore проверен на staging
- [ ] YooKassa переключена в prod mode
- [ ] DNS + SSL cert на prod домене
- [ ] Email-шаблоны на RU + EN ревьюнуты
- [ ] Robots.txt + sitemap.xml
- [ ] Privacy policy + ToS опубликованы
- [ ] Telegram-канал для уведомлений inсидентов
- [ ] Incident response runbook готов
- [ ] PO протестировал свой собственный flow (signup → купить → пройти урок → отменить → удалить аккаунт)

---

## Changelog

| Дата | Версия | Автор | Изменения |
|---|---|---|---|
| 2025-11-14 | 0.1 | Полина | Initial high-level Phase 2 plan (PHASE_2_BACKLOG.md) |
| 2026-06-06 | 1.0 | Клод + PO | Полная переработка под TSD v1.0; 11 sprint'ов с verify-gates |
