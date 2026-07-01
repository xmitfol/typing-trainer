# Security spec — Argon2 params + Captcha integration

> **Date**: 2026-06-07
> **Owner**: Сергей (Security) / делал Клод в его роли
> **Purpose**: разблокировать Бориса на Sprint 1 day 1-2 — конкретные параметры Argon2id для password hashing + Captcha integration plan для R-007 (бот-регистрация).
> **Source**: TSD §4.4 (password hashing) + TSD §8 OWASP + R-007 risk.

---

## Часть 1 · Argon2id parameters

### Решение

**Algorithm**: Argon2id (не Argon2i, не Argon2d).
**Library**: `argon2-cffi>=23.1.0` (через `passlib[argon2]`) — уже в [backend/pyproject.toml](../../../../backend/pyproject.toml).

### Параметры production

```python
# app/core/security.py
from passlib.hash import argon2

PASSWORD_HASHER = argon2.using(
    type="ID",          # Argon2id — hybrid (vs i / d)
    time_cost=3,        # iterations — баланс safety/UX (~250ms на login)
    memory_cost=65536,  # KiB = 64 MiB (TSD §4.4 спецификация)
    parallelism=2,      # threads — соответствует средним 2-vCPU pod'ам
    hash_len=32,        # output 32 байта = 256 bit
    salt_len=16,        # 16 байт = 128 bit, по RFC 9106
)
```

### Параметры dev/test (быстрее)

```python
# В app/tests/conftest.py override чтобы тесты не были медленными
if env == "dev" and is_test:
    PASSWORD_HASHER = argon2.using(
        type="ID",
        time_cost=1,
        memory_cost=8192,   # 8 MiB
        parallelism=1,
        hash_len=32,
        salt_len=16,
    )
```

### Обоснование

| Параметр | Значение | Почему |
|---|---|---|
| **type=ID** | Argon2id | RFC 9106 рекомендация для general-purpose password hashing. Защищает от GPU attacks (как 2d) И от side-channel (как 2i). |
| **time_cost=3** | 3 iterations | OWASP 2025 minimum для interactive login. На бекенде 2 vCPU = ~250ms. UX-чувствительно не превышаем 500ms total. |
| **memory_cost=65536 (64 MiB)** | 64 MiB per hash | OWASP 2025 minimum. Защищает от GPU/FPGA bruteforce. Стоимость для нас: 64MiB × concurrent logins. При 100 concurrent = 6.4 GiB peak — OK для 4 GiB RAM pod'а (TSD §6.1) если concurrent < 60. **Trigger пересмотра**: если signin rate > 50/sec — смотрим Argon2id-tuner. |
| **parallelism=2** | 2 threads | Соответствует worker config (2 vCPU pod). Не больше — иначе один hash съест все CPU. |
| **hash_len=32 / salt_len=16** | 256 bit hash, 128 bit salt | RFC 9106 рекомендация. Защищает от rainbow tables практически навсегда. |

### Re-hash policy (важно для compliance)

При каждом успешном login:
1. Если `argon2.needs_update(stored_hash)` returns True → re-hash с текущими params, save в БД.
2. Это происходит автоматически если мы потом усилим time_cost или memory_cost — старые юзеры мигрируют постепенно при login.
3. Логировать в `events`: `password_rehash` (для analytics — сколько % юзеров обновили хеш).

```python
# app/services/auth_service.py snippet
async def verify_password(plain: str, stored_hash: str, user_id: UUID) -> bool:
    if not PASSWORD_HASHER.verify(plain, stored_hash):
        return False
    if PASSWORD_HASHER.needs_update(stored_hash):
        new_hash = PASSWORD_HASHER.hash(plain)
        await user_repo.update_password_hash(user_id, new_hash)
        await event_service.emit("password_rehash", user_id=user_id)
    return True
```

### Anti-timing-attack

`PASSWORD_HASHER.verify()` из passlib константно-временной — не нужны дополнительные защиты.

Для случая **email не существует**:
```python
# WRONG (раскрывает существование email через тайминг):
user = await user_repo.find_by_email(email)
if not user:
    raise InvalidCredentials("user not found")
if not PASSWORD_HASHER.verify(password, user.password_hash):
    raise InvalidCredentials("wrong password")

# RIGHT (всегда выполняем hash, обе ветки = same time):
user = await user_repo.find_by_email(email)
dummy_hash = "$argon2id$v=19$m=65536,t=3,p=2$..."  # precomputed at startup
target_hash = user.password_hash if user else dummy_hash
ok = PASSWORD_HASHER.verify(password, target_hash)
if not (user and ok):
    raise InvalidCredentials("auth failed")  # один и тот же error для both
```

### Migration path при будущем усилении

Когда CPU дешевеет / мы получаем больше pod ресурсов:
- 2027 cycle: пересмотр на `time_cost=4, memory_cost=131072 (128 MiB)`
- Триггер: monitoring shows >5% logins > 500ms

Re-hash policy гарантирует постепенную миграцию без массового force-reset.

### Open questions для PO

Нет. Параметры зафиксированы.

---

## Часть 2 · Captcha integration (R-007 mitigation)

> ⚠️ **SUPERSEDED by [ADR-006](../decisions/ADR-006.md) (2026-06-11).**
> Решением PO выбор провайдера изменён: вместо внешнего **Yandex SmartCaptcha** —
> **self-hosted anti-bot** (honeypot + proof-of-work + rate-limit), без сторонних API.
> Ниже секции «Решение» / «Обоснование выбора» / integration-код оставлены как
> исторический контекст; **актуальная архитектура — в ADR-006**. Таблица endpoint'ов,
> rate-limit layering и dev-bypass семантика остаются в силе.

### Решение (актуальное, ADR-006)

**Self-hosted, три слоя, без внешних вызовов:**
1. **Honeypot** — скрытое поле формы; непустое → 403 мгновенно.
2. **Proof-of-Work** (hashcash) — `GET /auth/challenge` выдаёт HMAC-подписанный challenge;
   клиент ищет nonce с ≥`difficulty` нулевыми битами `sha256(salt:nonce)`. Stateless
   (подпись на `jwt_secret_key`), replay-guard через короткоживущий salt в Redis.
3. **IP rate-limit** — slowapi+Redis (как было).

Параметры/обоснование/трейд-оффы — в [ADR-006](../decisions/ADR-006.md). Код: [captcha.py](../../../../backend/app/core/captcha.py).

<details><summary>Историческое решение (Yandex SmartCaptcha) — superseded</summary>

**Provider**: **Yandex SmartCaptcha** (не Google reCAPTCHA, не hCaptcha).
**Mode**: Invisible (advanced) — challenge показывается только при подозрительном поведении, не всегда.

| Provider | Pros | Cons | Verdict |
|---|---|---|---|
| **Yandex SmartCaptcha** | RU-юрисдикция (152-ФЗ), интегрируется с Я360/Cloud IAM, бесплатно до 10K/мес | Чуть меньше aggressive ML чем reCAPTCHA v3 | ✅ выбираем |
| Google reCAPTCHA v3 | Лучший ML против ботов, большая БД ошибок | Google = заблокирован для части RU юзеров, 152-ФЗ серая зона | ❌ |
| hCaptcha | EU-альтернатива | Меньше distribution в RU, аналогичные проблемы | ❌ |
| Cloudflare Turnstile | Хорош, но Cloudflare не RU-юрисдикция | 152-ФЗ surface | ❌ |
| Custom (PoW / honeypot) | Полный контроль | ML не отслеживает паттерны атакующих | ❌ для v1.0 |

</details>

### Где интегрируем (по endpoint'ам)

Captcha **обязательно** на endpoints с высоким risk бот-атак:

| Endpoint | Captcha mode | Threshold |
|---|---|---|
| `POST /auth/signup` | Required (always) | — |
| `POST /auth/signin` | Conditional (после 3 failed login с IP за час) | `failed_count > 3` |
| `POST /auth/forgot` | Required (always) | — |
| `POST /events/batch` (анонимные) | Conditional (rate-limit overflow) | `> 100 events/min/IP` |
| `POST /me/family/add` | Required (always) | — |
| Прочие | Не нужно | — |

### Frontend integration

```html
<!-- На onboarding.html (signup step) -->
<script src="https://smartcaptcha.yandexcloud.net/captcha.js"></script>
<div id="captcha-container" data-sitekey="{{ env.YANDEX_CAPTCHA_SITE_KEY }}"></div>
```

```javascript
// При сабмите signup form
const captchaToken = window.smartCaptcha.getResponse(captchaWidgetId);
const response = await apiClient._http('POST', '/auth/signup', {
    ...formData,
    captcha_token: captchaToken,
});
```

Если token пустой → frontend блокирует submit, показывает «Пройдите проверку».

### Backend validation

```python
# app/core/captcha.py
import httpx
from app.config import get_settings

YANDEX_CAPTCHA_VERIFY_URL = "https://smartcaptcha.yandexcloud.net/validate"

async def verify_captcha(token: str, ip: str) -> bool:
    """Validate Yandex SmartCaptcha token. Returns True if human."""
    settings = get_settings()
    async with httpx.AsyncClient(timeout=5) as client:
        r = await client.post(
            YANDEX_CAPTCHA_VERIFY_URL,
            params={
                "secret": settings.yandex_captcha_server_key,
                "token": token,
                "ip": ip,
            },
        )
    if r.status_code != 200:
        return False  # fail-closed — отказываем при API недоступности
    data = r.json()
    return data.get("status") == "ok"
```

В endpoint:
```python
@router.post("/signup")
async def signup(
    payload: SignupRequest,
    request: Request,
    captcha_token: str = Depends(extract_captcha_header_or_body),
) -> UserResponse:
    if not await verify_captcha(captcha_token, request.client.host):
        raise HTTPException(403, detail={"code": "CAPTCHA_FAILED"})
    # ... остальная логика signup
```

### Env vars (добавить в .env.example) — ADR-006

```bash
# Self-hosted anti-bot (Sprint 1)
CAPTCHA_POW_DIFFICULTY=18           # ведущих нулевых бит; 18≈0.1-0.5s в браузере
CAPTCHA_CHALLENGE_TTL_SECONDS=600   # время жизни PoW-challenge
CAPTCHA_HONEYPOT_FIELD=nickname2    # имя скрытого поля формы
# HMAC-подпись challenge переиспользует JWT_SECRET_KEY (отдельный секрет не вводим)
```

### Dev mode bypass

В `app_env=dev` — captcha verification skip'аем если token == `"test-bypass-captcha"`. Это нужно для verify-скриптов чтобы они могли создавать test users.

```python
async def verify_captcha(token: str, ip: str) -> bool:
    settings = get_settings()
    if settings.app_env == "dev" and token == "test-bypass-captcha":
        return True
    # ... обычный flow
```

### Fail policy

**fail-closed в prod** (если Yandex Captcha API down → блокируем signup):
- Risk: legitimate users не могут зарегистрироваться при Yandex outage. Trade-off accepted.
- Альтернатива: degrade gracefully (allow without captcha) — отклоняем, потому что это окно для бот-атак.
- Monitoring: alert если captcha verification fail-rate > 50% в течение 5 минут (вероятно Yandex down).

### Rate limit + captcha layering

Captcha — **дополнение** к rate limit, не замена:

```
Layer 1: IP-based rate limit (slowapi + Redis)
         - /auth/signup: 3/IP/hour
         - /auth/signin: 5/IP/minute
Layer 2: Captcha verification (на endpoint'ах из таблицы выше)
Layer 3: Behavioral analytics (Sprint 8) — fraud detection по patterns
```

### Open questions для PO

Нет. ADR-006 закрыл оба прежних вопроса:
- ~~Регистрация Yandex SmartCaptcha shop~~ — отменена (self-hosted, внешней регистрации нет).
- ~~Acceptable fail-rate при Yandex outage~~ — неприменимо (нет внешнего API → нет outage-сценария). Рантайм-рычаг теперь `CAPTCHA_POW_DIFFICULTY`.

### Metrics для Sprint 10

Добавить в Grafana dashboard:
- Captcha challenge rate (% signup'ов, попавших в challenge)
- Captcha fail rate (% не прошедших)
- Bot signup count (caught by captcha)
- API verify latency (p95)

---

## Что Борису сделать в Sprint 1

### S1.3 (security.py — Argon2):
1. `from passlib.hash import argon2` → создать `PASSWORD_HASHER` объект с параметрами из §1
2. `hash_password(plain)` / `verify_password(plain, stored)` функции
3. **Unit tests с известными векторами** (см. argon2-cffi test suite — есть готовые)
4. Test: hash → verify → success
5. Test: needs_update returns True при разных параметрах

### S1.4 (signup endpoint — Captcha, ADR-006):
1. `CAPTCHA_POW_*` уже в `config.py` (Settings) ✅; добавить в `.env.example`
2. `app/core/captcha.py` уже переписан под PoW+honeypot ✅
3. Добавить `GET /api/v1/auth/challenge` (issue PoW challenge)
4. В `POST /auth/signup` — `Depends(verify_captcha_dep)` → 403 если honeypot непустой / PoW не решён / replay
5. Frontend: PoW-solver в Web Worker + honeypot-поле в `onboarding.html` (этап до submit)
6. Verify test: бот без решения → 403, валидное решение → 200, replay того же salt → 403

### Pre-requisite от PO

**Нет.** Self-hosted — внешней регистрации не требуется (ADR-006). Борис не заблокирован;
dev-bypass `test-bypass-captcha` остаётся для verify-скриптов.

---

## Changelog

| Date | Author | Change |
|---|---|---|
| 2026-06-07 | Сергей (играл Клод) | Initial: Argon2id params + Yandex SmartCaptcha integration |
| 2026-06-11 | Клод (по решению PO) | Часть 2 superseded by ADR-006: SmartCaptcha → self-hosted PoW+honeypot. Env vars, PO-prerequisite, S1.4 tasks обновлены. Argon2-часть без изменений. |
