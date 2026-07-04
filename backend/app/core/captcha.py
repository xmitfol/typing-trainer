"""Self-hosted anti-bot (R-007 mitigation) — по ADR-006.

Заменяет внешний Yandex SmartCaptcha на stateless проверку без сторонних API:
  - Слой 1: honeypot — скрытое поле формы (проверяется в endpoint'е, см. schema)
  - Слой 2: proof-of-work (hashcash) — HMAC-подписанный challenge + nonce
  - Слой 3: IP rate-limit — отдельно (slowapi), не здесь

Challenge stateless: аутентичность через HMAC на JWT_SECRET_KEY, сервер не хранит
выданные challenge. Защита от replay — короткоживущий salt в Redis (один
challenge = одна регистрация).

Применяется на endpoints с риском бот-атак:
- POST /auth/signup (always)
- POST /auth/forgot (always)
- POST /me/family/add (always)
- POST /auth/signin (conditional: после 3 failed/IP/час)
"""

import base64
import hashlib
import hmac
import json
import secrets
import time

import structlog

from app.config import get_settings

logger = structlog.get_logger(__name__)

# Dev-only bypass token (для verify-скриптов, чтобы не считать PoW)
DEV_BYPASS_TOKEN = "test-bypass-captcha"

# Алгоритм challenge — для версии/совместимости с frontend-солвером
CHALLENGE_ALGORITHM = "sha256-leading-zero-bits"


def _sign(payload_b64: str, secret: str) -> str:
    """HMAC-SHA256 подпись payload (base64url) → hex."""
    return hmac.new(secret.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()


def issue_challenge() -> dict:
    """Выдать новый PoW-challenge (GET /api/v1/auth/challenge).

    Stateless: ничего не пишем в БД/Redis на этом шаге. Аутентичность и
    неизменность difficulty гарантирует HMAC-подпись.
    """
    settings = get_settings()
    now = int(time.time())
    payload = {
        "salt": secrets.token_urlsafe(16),
        "iat": now,
        "exp": now + settings.captcha_challenge_ttl_seconds,
        "difficulty": settings.captcha_pow_difficulty,
    }
    payload_b64 = base64.urlsafe_b64encode(
        json.dumps(payload, separators=(",", ":")).encode()
    ).decode()
    return {
        "challenge": payload_b64,
        "signature": _sign(payload_b64, settings.jwt_secret_key),
        "difficulty": payload["difficulty"],
        "algorithm": CHALLENGE_ALGORITHM,
    }


def _leading_zero_bits(digest: bytes) -> int:
    """Сколько ведущих нулевых бит в digest."""
    bits = 0
    for byte in digest:
        if byte == 0:
            bits += 8
            continue
        # старший ненулевой байт — досчитываем нули в нём
        bits += 8 - byte.bit_length()
        break
    return bits


def _pow_solved(salt: str, nonce: str, difficulty: int) -> bool:
    """Проверка решения PoW: sha256(salt:nonce) имеет ≥ difficulty нулевых бит."""
    digest = hashlib.sha256(f"{salt}:{nonce}".encode()).digest()
    return _leading_zero_bits(digest) >= difficulty


async def verify_captcha(
    challenge: str,
    signature: str,
    nonce: str,
    *,
    ip: str | None = None,
    redis=None,
) -> bool:
    """Проверить решение PoW-challenge. True если человек, False если бот/fail.

    Args:
        challenge: base64url payload, выданный issue_challenge()
        signature: HMAC-подпись challenge
        nonce: решение, найденное клиентом
        ip: для логов
        redis: async Redis-клиент для replay-guard (если None — replay не проверяется,
               допустимо только в dev/тестах)

    Поведение:
      - dev + challenge == DEV_BYPASS_TOKEN → True (для verify-скриптов)
      - битая/поддельная подпись → False
      - истёкший challenge → False
      - неверное решение PoW → False
      - повторный salt (replay) → False
    """
    settings = get_settings()

    # Dev bypass для verify-скриптов
    if settings.app_env == "dev" and challenge == DEV_BYPASS_TOKEN:
        return True

    if not challenge or not signature or not nonce:
        logger.info("captcha.missing_fields", ip=ip)
        return False

    # 1. Подпись — constant-time сравнение
    expected_sig = _sign(challenge, settings.jwt_secret_key)
    if not hmac.compare_digest(expected_sig, signature):
        logger.info("captcha.bad_signature", ip=ip)
        return False

    # Декодируем payload (подпись уже подтвердила его целостность)
    try:
        payload = json.loads(base64.urlsafe_b64decode(challenge.encode()))
        salt = payload["salt"]
        exp = int(payload["exp"])
        difficulty = int(payload["difficulty"])
    except (ValueError, KeyError, TypeError) as e:
        logger.warning("captcha.bad_payload", error=str(e), ip=ip)
        return False

    # 2. Свежесть
    if time.time() > exp:
        logger.info("captcha.expired", ip=ip)
        return False

    # 3. Решение PoW
    if not _pow_solved(salt, nonce, difficulty):
        logger.info("captcha.pow_unsolved", ip=ip, difficulty=difficulty)
        return False

    # 4. Replay-guard: salt можно использовать один раз
    if redis is not None:
        ttl = max(1, exp - int(time.time()))
        # SET key NX EX ttl → True если ключа не было (первое использование)
        is_first_use = await redis.set(f"captcha:salt:{salt}", "1", nx=True, ex=ttl)
        if not is_first_use:
            logger.info("captcha.replay", ip=ip)
            return False

    return True
