"""Admin 2FA business logic (Ф4b) — enroll/verify/disable/status + enforcement.

Оркестрация вокруг Admin2FA-модели + core/totp примитивов. Секрет в БД лежит
зашифрованным (Fernet); наружу отдаём plaintext base32/otpauth только в enroll.
Аудит (2fa.enabled/2fa.disabled) — через admin_service.audit.
"""

from datetime import UTC, datetime
from uuid import UUID

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core import totp
from app.models.admin_2fa import Admin2FA
from app.models.user import User
from app.services import admin_service

logger = structlog.get_logger(__name__)


def _now() -> datetime:
    return datetime.now(UTC)


async def get_2fa(session: AsyncSession, user_id: UUID) -> Admin2FA | None:
    return (
        await session.execute(select(Admin2FA).where(Admin2FA.user_id == user_id))
    ).scalar_one_or_none()


async def is_enabled(session: AsyncSession, user_id: UUID) -> bool:
    row = await get_2fa(session, user_id)
    return bool(row and row.enabled)


async def enroll(session: AsyncSession, actor: User, *, issuer: str) -> tuple[str, str]:
    """Начать/перегенерить enrollment. Возвращает (otpauth_uri, plaintext_secret).

    Идемпотентно при повторе ДО подтверждения: перегенерит секрет (enabled=False).
    Если 2FA уже enabled — тоже перегенерит секрет и СБРАСЫВАЕТ enabled в False
    (повторный enroll = переустановка; enabled вернётся только после verify).
    """
    plain_secret = totp.generate_secret()
    enc = totp.encrypt_secret(plain_secret)
    row = await get_2fa(session, actor.id)
    if row is None:
        row = Admin2FA(
            user_id=actor.id,
            secret=enc,
            enabled=False,
            recovery_codes=[],
            confirmed_at=None,
        )
        session.add(row)
    else:
        row.secret = enc
        row.enabled = False
        row.recovery_codes = []
        row.confirmed_at = None
    await session.commit()
    uri = totp.otpauth_uri(plain_secret, account_email=actor.email, issuer=issuer)
    logger.info("admin.2fa_enroll", user_id=str(actor.id))
    return uri, plain_secret


async def verify_and_enable(
    session: AsyncSession, actor: User, *, code: str, ip_hash: str | None = None
) -> list[str] | None:
    """Подтвердить TOTP-код → enabled=True + N recovery-кодов (plaintext, ONCE).

    Возвращает список plaintext recovery-кодов при успехе, None если код неверный
    (или enrollment не начат). Аудит 2fa.enabled — только на успехе.
    """
    row = await get_2fa(session, actor.id)
    if row is None:
        return None
    plain_secret = totp.decrypt_secret(row.secret)
    if not totp.verify_totp(plain_secret, code):
        return None
    plaintext, hashes_ = totp.generate_recovery_codes()
    row.enabled = True
    row.confirmed_at = _now()
    row.recovery_codes = hashes_
    await admin_service.audit(
        session,
        actor=actor,
        action="2fa.enabled",
        target_type="user",
        target_id=actor.id,
        payload={"email": actor.email},
        ip_hash=ip_hash,
        commit=False,
    )
    await session.commit()
    logger.info("admin.2fa_enabled", user_id=str(actor.id))
    return plaintext


async def disable(
    session: AsyncSession, actor: User, *, ip_hash: str | None = None
) -> None:
    """Отключить 2FA: enabled=False + чистка secret/recovery. Аудит 2fa.disabled."""
    row = await get_2fa(session, actor.id)
    if row is not None:
        await session.delete(row)
    await admin_service.audit(
        session,
        actor=actor,
        action="2fa.disabled",
        target_type="user",
        target_id=actor.id,
        payload={"email": actor.email},
        ip_hash=ip_hash,
        commit=False,
    )
    await session.commit()
    logger.info("admin.2fa_disabled", user_id=str(actor.id))


async def check_reauth_totp(
    session: AsyncSession, user: User, *, totp_code: str | None
) -> str:
    """Enforcement на /admin/reauth для superadmin (Ф4b).

    Возвращает код-результат:
      - "not_required"  — 2FA не применяется (не superadmin, или dev+не enabled).
      - "ok"            — TOTP или recovery валиден (при recovery — уже потреблён).
      - "enrollment"    — require_superadmin_2fa=True, но 2FA не enabled.
      - "required"      — 2FA enabled, но totp_code не передан.
      - "invalid"       — totp_code передан, но не совпал (ни TOTP, ни recovery).

    Пароль проверяется В ЭНДПОИНТЕ до вызова этой функции.
    """
    if user.role != "superadmin":
        return "not_required"

    row = await get_2fa(session, user.id)
    enabled = bool(row and row.enabled)

    if not enabled:
        if get_settings().require_superadmin_2fa:
            return "enrollment"
        return "not_required"

    # 2FA enabled → totp_code обязателен.
    if not totp_code:
        return "required"

    assert row is not None
    plain_secret = totp.decrypt_secret(row.secret)
    if totp.verify_totp(plain_secret, totp_code):
        return "ok"

    # Не TOTP — пробуем recovery (one-time).
    matched = totp.match_recovery(totp_code, list(row.recovery_codes))
    if matched is not None:
        row.recovery_codes = [h for h in row.recovery_codes if h != matched]
        await session.commit()
        logger.info("admin.2fa_recovery_used", user_id=str(user.id))
        return "ok"

    return "invalid"
