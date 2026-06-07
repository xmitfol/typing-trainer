"""Password hashing + JWT helpers.

По security spec (docs/spec/backend/security/argon2_and_captcha.md):
- Argon2id с OWASP 2025 minimum params (time=3, mem=64MiB, parallel=2)
- Re-hash on login если needs_update
- Anti-timing-attack через dummy_hash для несуществующих email'ов
- JWT HS256 (access 15min, refresh 30 дней) с typed claims

Покрыто тестами в app/tests/test_security.py.
"""

from datetime import UTC, datetime, timedelta
from typing import Literal, TypedDict
from uuid import UUID, uuid4

from jose import JWTError, jwt
from passlib.hash import argon2

from app.config import get_settings

# ─── Password hashing (Argon2id) ─────────────────────────────────────

# Production params: OWASP 2025 minimum для interactive login.
# На 2-vCPU pod'е (TSD §6.1) — ~250ms на hash, что укладывается в UX budget < 500ms.
_PROD_HASHER = argon2.using(
    type="ID",
    time_cost=3,
    memory_cost=65536,  # 64 MiB
    parallelism=2,
    hash_len=32,
    salt_len=16,
)

# Test params: быстрее для test runs — НЕ использовать в prod.
_TEST_HASHER = argon2.using(
    type="ID",
    time_cost=1,
    memory_cost=8192,  # 8 MiB
    parallelism=1,
    hash_len=32,
    salt_len=16,
)

# Precomputed dummy hash для anti-timing-attack на login.
# Это валидный argon2 hash от случайного пароля — verify() всегда вернёт False,
# но затратит то же время что и реальный verify, не раскрывая existence юзера.
_DUMMY_HASH: str | None = None


def _get_hasher() -> argon2:
    """Возвращает hasher по env (test = быстрый, остальное = prod)."""
    settings = get_settings()
    is_test = settings.app_env == "dev" and "PYTEST_CURRENT_TEST" in __import__("os").environ
    return _TEST_HASHER if is_test else _PROD_HASHER


def get_dummy_hash() -> str:
    """Singleton dummy hash для constant-time login. Lazy-init."""
    global _DUMMY_HASH
    if _DUMMY_HASH is None:
        _DUMMY_HASH = _get_hasher().hash("dummy-password-for-timing-attack-protection")
    return _DUMMY_HASH


def hash_password(plain: str) -> str:
    """Хэширует пароль Argon2id с params из get_hasher()."""
    if not plain:
        raise ValueError("Password cannot be empty")
    return _get_hasher().hash(plain)


def verify_password(plain: str, stored_hash: str) -> bool:
    """Проверяет пароль. Constant-time (anti-timing) гарантирован passlib.

    Использование на login:
        user = await user_repo.find_by_email(email)
        target = user.password_hash if user else get_dummy_hash()
        ok = verify_password(plain, target)
        if not (user and ok):
            raise InvalidCredentials("auth failed")
    """
    if not stored_hash:
        return False
    try:
        return _get_hasher().verify(plain, stored_hash)
    except (ValueError, TypeError):
        # Невалидный hash (corrupted DB row) — считаем как fail
        return False


def needs_rehash(stored_hash: str) -> bool:
    """True если hash был создан со старыми params. После успешного login
    вызови `new_hash = hash_password(plain)` и сохрани в БД.
    """
    return _get_hasher().needs_update(stored_hash)


# ─── JWT (HS256) ──────────────────────────────────────────────────────


class AccessTokenClaims(TypedDict):
    sub: str       # user_id (UUID stringified)
    exp: int       # unix timestamp
    iat: int       # issued at
    jti: str       # unique token id (для revocation)
    typ: Literal["access"]


class RefreshTokenClaims(TypedDict):
    sub: str
    exp: int
    iat: int
    jti: str
    typ: Literal["refresh"]


def _now_utc() -> datetime:
    return datetime.now(UTC)


def create_access_token(user_id: UUID, ttl: timedelta | None = None) -> tuple[str, str]:
    """Создаёт access-token. Возвращает (token, jti) — jti можно сохранить
    для revocation. Default TTL из settings (15 мин).
    """
    settings = get_settings()
    if ttl is None:
        ttl = timedelta(minutes=settings.jwt_access_ttl_minutes)
    iat = _now_utc()
    jti = str(uuid4())
    claims: AccessTokenClaims = {
        "sub": str(user_id),
        "exp": int((iat + ttl).timestamp()),
        "iat": int(iat.timestamp()),
        "jti": jti,
        "typ": "access",
    }
    token = jwt.encode(claims, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, jti


def create_refresh_token(user_id: UUID, ttl: timedelta | None = None) -> tuple[str, str]:
    """Создаёт refresh-token (30 дней default). Возвращает (token, jti).
    Refresh tokens — rotation на каждый use, jti кэшируем в Redis для revoke.
    """
    settings = get_settings()
    if ttl is None:
        ttl = timedelta(days=settings.jwt_refresh_ttl_days)
    iat = _now_utc()
    jti = str(uuid4())
    claims: RefreshTokenClaims = {
        "sub": str(user_id),
        "exp": int((iat + ttl).timestamp()),
        "iat": int(iat.timestamp()),
        "jti": jti,
        "typ": "refresh",
    }
    token = jwt.encode(claims, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, jti


def decode_token(token: str, expected_type: Literal["access", "refresh"]) -> dict:
    """Decode + validate JWT. Throws при невалидном/истёкшем/wrong type.

    Returns: словарь claims (для дальнейшей логики).
    Raises: jose.JWTError + дочерние при невалидности.
    """
    settings = get_settings()
    try:
        claims = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError:
        raise  # уже descriptive

    if claims.get("typ") != expected_type:
        raise JWTError(f"Wrong token type: expected '{expected_type}', got '{claims.get('typ')}'")

    return claims


def extract_user_id(token: str, expected_type: Literal["access", "refresh"]) -> UUID:
    """Удобный helper: decode + достать user_id."""
    claims = decode_token(token, expected_type)
    return UUID(claims["sub"])
