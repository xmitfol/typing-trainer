"""TOTP-2FA примитивы (Ф4b): шифрование секрета at-rest + recovery-коды.

Разделение (как security.py): чистые крипто-хелперы, без БД/HTTP.

Шифрование TOTP-секрета at-rest (Ф4-SEC):
  - Ключ Fernet берём из settings.totp_encryption_key (base64 32 байта), если
    задан. Это PROD-путь: отдельный ключ ⇒ ротация независимо от jwt_secret_key.
  - Если ключ не задан (dev) — ДЕРИВИРУЕМ его из jwt_secret_key через HKDF-SHA256
    (info=b"admin-totp-fernet-v1"). Так секрет всё равно шифруется (не plaintext
    в БД), но в prod следует задать totp_encryption_key явно (см. config.py).

Recovery-коды: генерим N случайных читаемых кодов, показываем PLAINTEXT один раз,
храним только sha256-хеши (hex). Проверка — по хешу; использованный удаляется
вызывающим кодом (one-time).
"""

import base64
import hashlib
import hmac
import secrets

import pyotp
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

from app.config import get_settings

_HKDF_INFO = b"admin-totp-fernet-v1"
RECOVERY_CODE_COUNT = 8
TOTP_VALID_WINDOW = 1  # ±1 шаг (30с) — допуск на рассинхрон часов


def _derive_fernet_key() -> bytes:
    """Fernet-ключ (base64 32 байта). Явный из config или HKDF из jwt_secret."""
    settings = get_settings()
    if settings.totp_encryption_key is not None:
        raw = settings.totp_encryption_key.get_secret_value().encode("utf-8")
        # Ожидаем готовый base64-urlsafe Fernet-ключ; если это не так — Fernet
        # упадёт с понятной ошибкой при инстанцировании (fail-fast в prod).
        return raw
    # Dev-путь: деривируем стабильный 32-байтный ключ из jwt_secret_key.
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=_HKDF_INFO,
    )
    derived = hkdf.derive(settings.jwt_secret_key.encode("utf-8"))
    return base64.urlsafe_b64encode(derived)


def _fernet() -> Fernet:
    return Fernet(_derive_fernet_key())


# ─── Секрет at-rest ─────────────────────────────────────────────────────


def generate_secret() -> str:
    """Новый TOTP base32-секрет (plaintext, для отдачи в otpauth-uri)."""
    return pyotp.random_base32()


def encrypt_secret(plain_base32: str) -> str:
    """Зашифровать TOTP base32-секрет → Fernet-токен (str, для хранения в БД)."""
    return _fernet().encrypt(plain_base32.encode("utf-8")).decode("utf-8")


def decrypt_secret(token: str) -> str:
    """Расшифровать Fernet-токен → TOTP base32-секрет.

    Raises InvalidToken если ключ сменился/данные битые (не тихий пропуск).
    """
    return _fernet().decrypt(token.encode("utf-8")).decode("utf-8")


# ─── TOTP verify ────────────────────────────────────────────────────────


def verify_totp(plain_base32_secret: str, code: str) -> bool:
    """Проверить TOTP-код против секрета (окно ±1). False на пустой/битый код."""
    if not code:
        return False
    try:
        return pyotp.TOTP(plain_base32_secret).verify(code.strip(), valid_window=TOTP_VALID_WINDOW)
    except Exception:  # noqa: BLE001 — любой сбой pyotp = невалидный код
        return False


def otpauth_uri(plain_base32_secret: str, account_email: str, issuer: str) -> str:
    """otpauth://-URI для QR (Google Authenticator и т.п.)."""
    return pyotp.TOTP(plain_base32_secret).provisioning_uri(
        name=account_email, issuer_name=issuer
    )


# ─── Recovery-коды ──────────────────────────────────────────────────────


def _hash_recovery(code: str) -> str:
    """sha256(hex) нормализованного recovery-кода (без дефисов, upper)."""
    normalized = code.replace("-", "").replace(" ", "").upper()
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def generate_recovery_codes(count: int = RECOVERY_CODE_COUNT) -> tuple[list[str], list[str]]:
    """Сгенерировать N recovery-кодов. Возвращает (plaintext_list, hash_list).

    Plaintext показываем юзеру ОДИН раз; в БД кладём только hash_list.
    Формат кода: XXXX-XXXX (8 hex-символов, читаемо).
    """
    plaintext: list[str] = []
    hashes_: list[str] = []
    for _ in range(count):
        raw = secrets.token_hex(4).upper()  # 8 hex chars
        code = f"{raw[:4]}-{raw[4:]}"
        plaintext.append(code)
        hashes_.append(_hash_recovery(code))
    return plaintext, hashes_


def match_recovery(code: str, stored_hashes: list[str]) -> str | None:
    """Вернуть совпавший ХЕШ из списка (constant-time сверка) или None.

    Вызывающий удаляет вернувшийся хеш из recovery_codes (one-time).
    """
    if not code:
        return None
    candidate = _hash_recovery(code)
    for h in stored_hashes:
        if hmac.compare_digest(candidate, h):
            return h
    return None
