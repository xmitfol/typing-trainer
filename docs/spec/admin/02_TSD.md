# 02 · TSD — Админ-панель (Technical Specification)

> **Technical Specification Document**
> **Версия:** 1.0 · **Дата:** 2026-07-02
> **Производный от:** [01_PRD.md](01_PRD.md) v1.0
> **Стек:** тот же, что backend — Python 3.12 + FastAPI + async SQLAlchemy 2.0 + PostgreSQL 16 + Redis 7
> **Related:** [ADR-005](../backend/decisions/ADR-005-DRAFT.md) (renewal), [ADR-006](../backend/decisions/ADR-006.md) (auth-cookies/captcha), [ADR-007](../backend/decisions/ADR-007.md) (OAuth), [ADR-008](../backend/decisions/ADR-008.md) (provider-agnostic billing)

---

## 1. Архитектура

Админка — **не отдельный сервис**, а модуль того же FastAPI-приложения: API под `/api/v1/admin/*` (тег `admin`), фронт — статичные страницы `/admin/*.html`. Переиспользует существующие доменные сервисы, не дублируя бизнес-логику.

```
Browser (сотрудник)  /admin/*.html + admin.css + api-client (admin-методы)
        │ httpOnly cookies (та же auth, что у юзеров) + роль в JWT/БД
        ▼
Nginx  (может ограничить /admin по IP-allowlist — усиление, фаза 4)
        ▼
FastAPI  /api/v1/admin/*   →  require_admin_role(min_role)  ← гейт
        │
        ├─ admin_service.py  (оркестрация, аудит)
        │      └─ переиспользует billing_service / auth_service / me_service / email_service
        ▼
PostgreSQL (+ новые: users.role, admin_audit_log, charge.status='refunded')
Redis      (re-auth scope-токены, кэш аналитики, rate-limit)
```

### 1.1. Принципы (наследуются из backend/02_TSD §1.2)
- API-first, все под `/api/v1/admin/`, в OpenAPI тег `admin`.
- No business logic в views — слой `admin_service`.
- Async везде; миграции через Alembic.
- **Least privilege:** каждый эндпоинт объявляет минимальную роль; чувствительные — ещё и re-auth.
- **Аудируемость:** любое мутирующее действие → запись в `admin_audit_log`.

---

## 2. RBAC-модель

### 2.1. Роль на User
Новая колонка `users.role`:
```sql
role VARCHAR(12) NOT NULL DEFAULT 'user'
    CHECK (role IN ('user','analyst','support','superadmin'))
```
`'user'` — обычный (99.99%), в админку не входит. Иерархия прав: `analyst < support < superadmin`.

### 2.2. Гейт-зависимость (копия паттерна `require_active_subscription`)
В `backend/app/deps.py` уже есть образец — `require_active_subscription(user, session) -> User` (403). По аналогии:
```python
ROLE_RANK = {"user": 0, "analyst": 1, "support": 2, "superadmin": 3}

def require_admin_role(min_role: str):
    async def _dep(user: CurrentUser) -> User:
        if ROLE_RANK.get(user.role, 0) < ROLE_RANK[min_role]:
            raise HTTPException(403, {"code": "ADMIN_FORBIDDEN", ...})
        return user
    return _dep

# алиасы для читаемости в сигнатурах эндпоинтов
RequireAnalyst    = Depends(require_admin_role("analyst"))
RequireSupport    = Depends(require_admin_role("support"))
RequireSuperadmin = Depends(require_admin_role("superadmin"))
```
Использует существующие `CurrentUser` / `current_user_required` (чтение access-cookie → `decode_token` → `get_active_user`). Никакого отдельного admin-логина: та же auth Sprint 1, роль решает доступ.

### 2.3. Re-auth для чувствительных операций
Возврат / смена роли / имперсонация требуют повторного ввода пароля:
- `POST /admin/reauth {password}` → проверка (Argon2, как signin) → короткий **scope-токен** в Redis `admin:reauth:{user_id}` (TTL ~5 мин).
- Чувствительные эндпоинты требуют заголовок `X-Admin-Reauth: <token>`; зависимость `require_reauth` проверяет наличие/валидность в Redis, потом удаляет (one-time на операцию — по вкусу, либо TTL-окно).

### 2.4. Бутстрап первого superadmin
Первую роль нельзя выдать через саму админку (курица-яйцо). Решение: alembic data-migration / CLI-команда (`python -m app.cli grant-role <email> superadmin`) — вне HTTP, для деплоя.

---

## 3. Изменения модели данных

Все — аддитивные, обратно совместимые (как billing-миграция `202607011200`).

### 3.1. `users.role` (миграция)
```python
op.add_column("users", sa.Column("role", sa.String(12),
    nullable=False, server_default="user"))
op.create_check_constraint("role_valid", "users",
    "role IN ('user','analyst','support','superadmin')")
# частичный индекс — быстрый список сотрудников
op.create_index("ix_users_staff", "users", ["role"],
    postgresql_where=sa.text("role <> 'user'"))
```
Модель `backend/app/models/user.py` — добавить `role: Mapped[str]` + в `__table_args__` CHECK.

### 3.2. `admin_audit_log` (новая таблица)
```python
class AdminAuditLog(Base):
    __tablename__ = "admin_audit_log"
    id:            Mapped[int]  = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    actor_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action:        Mapped[str]  = mapped_column(String(48))   # 'user.block','sub.refund','user.impersonate','role.set',...
    target_type:   Mapped[str]  = mapped_column(String(24))   # 'user' | 'subscription' | ...
    target_id:     Mapped[str]  = mapped_column(String(64))
    payload:       Mapped[dict] = mapped_column(JSONB, server_default=text("'{}'"))
    ip_hash:       Mapped[str | None] = mapped_column(String(64))   # SHA256(IP), как в events (152-ФЗ)
    created_at:    Mapped[datetime]   = mapped_column(TIMESTAMP(tz), server_default=text("now()"))
    # индексы: (actor_user_id, created_at DESC), (target_type, target_id, created_at DESC)
```
Пишется хелпером `admin_service.audit(session, actor, action, target_type, target_id, payload, ip_hash)` в каждой мутирующей операции.

### 3.3. Возврат — `subscription_charges.status` + `PaymentProvider.refund`
- В `SubscriptionCharge.status` добавить значение `'refunded'` (модель + CHECK, если он есть). Возврат создаёт charge-запись: `status='refunded'`, `amount_kopecks`, `charge_metadata={refund_id, reason, actor}`, `idempotency_key=f"refund:{payment_id}"`.
- Расширить Protocol `PaymentProvider` (`backend/app/core/billing.py`) методом:
  ```python
  def refund(self, *, provider_payment_id, amount_kopecks, idempotency_key) -> RefundResult: ...
  ```
  `RefundResult(refund_id, status)`. `StubProvider.refund` — эмуляция (подписанный `refund_id`, всегда success). `YooKassaProvider.refund` — реальный вызов YK Refunds API (TODO под подтверждённый shop, как остальные его методы).

Миграций контента/уроков нет — они вне scope (см. PRD §7).

---

## 4. API `/api/v1/admin/*`

Все эндпоинты — под `require_admin_role(...)`; мутирующие — пишут аудит; чувствительные — `require_reauth`. Тег `admin` в OpenAPI.

| Метод | Путь | Мин. роль | re-auth | Назначение |
|---|---|---|:--:|---|
| POST | `/admin/reauth` | analyst | — | Выдать scope-токен (ввод пароля) |
| GET | `/admin/overview` | analyst | — | Метрики дашборда (период) |
| GET | `/admin/users` | support | — | Список/поиск/фильтр (пагинация) |
| GET | `/admin/users/{id}` | support | — | Карточка: профиль+подписки+прогресс+family+oauth |
| PATCH | `/admin/users/{id}` | support | — | Правка профиля (переиспользует `me_service.patch_profile`) |
| POST | `/admin/users/{id}/block` | support | — | soft-delete (`deleted_at`) |
| POST | `/admin/users/{id}/restore` | support | — | Снять блок |
| POST | `/admin/users/{id}/reset-password` | support | — | Письмо сброса (`email_service`) |
| POST | `/admin/users/{id}/verify-email` | support | — | Ручная верификация |
| POST | `/admin/users/{id}/impersonate` | support | ✅ | Короткий access-токен юзера (см. §5) |
| POST | `/admin/users/{id}/role` | superadmin | ✅ | Назначить роль сотруднику |
| GET | `/admin/subscriptions` | support | — | Список подписок (фильтр по статусу/плану) |
| GET | `/admin/subscriptions/{id}` | support | — | Карточка + charge-лог |
| POST | `/admin/subscriptions/{id}/cancel` | support | — | `billing_service.cancel_subscription` |
| POST | `/admin/subscriptions/{id}/grant` | support | — | Ручная выдача/продление (период, причина) |
| POST | `/admin/subscriptions/{id}/refund` | superadmin | ✅ | Возврат через провайдер |
| GET | `/admin/analytics/funnel` | analyst | — | Воронка signup→…→churn |
| GET | `/admin/analytics/retention` | analyst | — | D1/D7/D30 |
| GET | `/admin/analytics/lessons` | analyst | — | Drop-off по урокам |
| GET | `/admin/analytics/skill` | analyst | — | Распределение WPM/accuracy |
| GET | `/admin/analytics/revenue` | analyst | — | MRR / подписки / decline rate |

Схемы — `backend/app/schemas/admin.py` (pydantic v2), стиль как `schemas/me.py`/`billing.py`.

---

## 5. Сервисный слой

Новый `backend/app/services/admin_service.py` — оркестрация + аудит, переиспользует доменные сервисы:

- **users:** `list_users(filters, page)`, `get_user_detail(id)` (агрегирует profile+subscriptions+progress+family+oauth), `patch_profile` (→ me_service), `block/restore` (ставит/снимает `deleted_at`), `reset_password` (→ email_service + токен), `verify_email` (→ auth_service.mark_email_verified), `set_role`.
- **billing:** `list_subscriptions(filters)`, `get_subscription_detail(id)` (+ charge-лог), `cancel` (→ billing_service.cancel_subscription), `grant_subscription(user, plan, period, reason)` (создаёт active-подписку с provider='manual', пишет audit), `refund(subscription, amount, reason)` (→ provider.refund + charge `refunded`).
- **analytics:** агрегатные SQL-запросы (см. §6).
- **audit:** `audit(...)` — единая запись в `admin_audit_log`.

### 5.1. Имперсонация (безопасно)
`POST /admin/users/{id}/impersonate` (support+, re-auth):
1. Проверка: цель — **не админ** (нельзя имперсонировать роль ≥ analyst); цель не заблокирована.
2. Выдать **короткий** access-токен целевого юзера (TTL ~15 мин; помеченный `imp=actor_id` в claims — чтобы бэкенд/логи знали, что это имперсонация).
3. Записать аудит (`user.impersonate`, actor, target, ip_hash).
4. Фронт: открывает приложение под этим токеном, показывает **постоянный баннер** «Вы вошли как {email} · Выйти» (сброс → возврат в админку).
Refresh-токен целевого юзера **не выдаётся** (только короткий access — сессия истекает сама).

---

## 6. Аналитика

Агрегаты — SQL по существующим таблицам с готовыми индексами:
- **Воронка/retention:** `events` (`ix_events_type_time`, `ix_events_user_time`) — типы `signup`/`lesson_started`/`lesson_completed`/`subscribed`/`churned`. Требует, чтобы фронт/бэк начали **писать события** (сейчас таблица есть, наполнение — часть этой работы / Sprint 8; в фазе 3 админки включаем эмиссию ключевых событий).
- **Drop-off по урокам:** `progress` + `attempts` (кол-во дошедших до урока N vs завершивших).
- **Скилл:** гистограммы `best_wpm`/`best_accuracy` из `progress` по тирам.
- **Деньги:** MRR = Σ активных `subscriptions.amount_kopecks` нормировано на период; decline rate — из `subscription_charges` (`status='failed'`).

Тяжёлые запросы — кэш в Redis (`admin:analytics:{metric}:{period}`, TTL 5–15 мин). Материализованные вью — оптимизация фазы 3, если запросы станут дорогими.

---

## 7. Frontend

- Страницы: `admin/index.html` (Обзор), `admin/users.html`, `admin/billing.html`, `admin/stats.html` — общий каркас (шапка + таб-навигация). Допустимо single-page с табами; выбор при реализации.
- `assets/css/admin.css` — на дизайн-токенах `assets/css/tokens.css` (как `dashboard.css`).
- `assets/js/admin.js` + методы в `apiClient` для `/admin/*` (backend-only, `credentials:'include'`, как auth/billing-методы).
- Клиентский гейт: скрывать вкладки/кнопки по роли (из `GET /me` + role) — **UX-удобство, не защита**; настоящий гейт на сервере.
- Имперсонация — баннер поверх основного приложения (общий компонент).

---

## 8. Безопасность

- **RBAC** на каждом эндпоинте (min-роль) + **re-auth** на возврат/роль/имперсонацию.
- **Аудит** всех мутаций в `admin_audit_log` (actor, action, target, ip_hash, payload).
- **Rate-limit** на admin-эндпоинты (переиспользовать Redis-паттерн, как conditional-captcha/`ratelimit:*`).
- **Имперсонация:** короткий TTL, нельзя на админа, только access (без refresh), аудит, баннер.
- **Путь `/admin`:** в v1 — тот же домен; nginx IP-allowlist — усиление фазы 4. Отдельный поддомен — future (open question PRD §8).
- **152-ФЗ:** доступ к перс.данным логируется; IP — только хеш.
- **Ревью Сергея (security)** обязателен перед prod — по RBAC, имперсонации, re-auth, необходимости 2FA.

---

## 9. Тестирование

Gate-скрипт на реальном Docker-стеке VM (как auth 8/8, billing 6/6, /me 45/45):
1. **RBAC:** analyst → 403 на `/admin/subscriptions/{id}/refund`; support → 403 на `/admin/users/{id}/role`; user (без роли) → 403 на любой `/admin/*`.
2. **Re-auth:** чувствительный эндпоинт без `X-Admin-Reauth` → 401/403; с валидным токеном → успех.
3. **Refund на stub:** grant → refund → charge `refunded` создан, идемпотентность повторного refund, аудит записан.
4. **Имперсонация:** токен выдан + аудит; попытка имперсонировать админа → отказ; refresh не выдан.
5. **Users:** block → юзер получает 401/403 на защищённых эндпоинтах; restore возвращает доступ; каждое действие в аудите.
6. **Analytics:** агрегаты считаются, не пустые на засеянных данных, кэш срабатывает.

---

## 10. Rollout (фазы)

Каждая фаза — свой gate на стеке, аддитивная миграция.

| Фаза | Содержание | Даёт |
|---|---|---|
| **Ф1** | `users.role` + `admin_audit_log` + `require_admin_role` + re-auth + бутстрап superadmin + **Обзор** + **Пользователи (чтение/поиск/блок/restore/reset/verify)** | Поддержка может смотреть и базово рулить юзерами |
| **Ф2** | **Подписки** (список/карточка/charge-лог/cancel/grant) + **возврат** (`PaymentProvider.refund` + charge `refunded`) | Финансовые операции с аудитом |
| **Ф3** | **Статистика** (воронка/retention/drop-off/скилл/деньги) + эмиссия ключевых `events` + кэш | Продуктовая аналитика |
| **Ф4** | **Имперсонация** + support-инструменты + nginx IP-allowlist + (опц.) 2FA | Полный разбор обращений, усиление доступа |

Реализация — делегируется Борису (backend) + фронт-агенту; sequencing через Нику (PM). Первый шаг реализации — Ф1.
