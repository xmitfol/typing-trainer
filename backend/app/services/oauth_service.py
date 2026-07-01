"""OAuth-резолвинг аккаунта (Sprint 2, S2.3, ADR-007 §3).

Тонкие endpoint'ы (api/v1/oauth.py) вызывают resolve_oauth_login. Транзакция
здесь (commit явный). HTTP-кодов нет: при отсутствии email кидаем
OAuthNoEmailError, api/ мапит на редирект с ошибкой.

Порядок резолвинга (ADR-007 §3):
  1. (provider, external_id) есть → вход существующего юзера.
  2. Иначе по email: активный юзер → ЛИНК (создать OAuthAccount, email_verified=true).
  3. Иначе новый: User (провизорные дефолты) + UserSettings + OAuthAccount.
"""

from __future__ import annotations

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import OAuthNoEmailError
from app.core.oauth import OAuthUserInfo
from app.models.user import OAuthAccount, User, UserSettings

logger = structlog.get_logger(__name__)


def _raw_payload(info: OAuthUserInfo) -> dict:
    """Снапшот userinfo для oauth_accounts.raw_payload (НЕ токен, ADR-007 §5)."""
    return {
        "external_id": info.external_id,
        "email": info.email,
        "name": info.name,
        "locale": info.locale,
    }


async def resolve_oauth_login(
    session: AsyncSession,
    provider: str,
    info: OAuthUserInfo,
) -> tuple[User, bool]:
    """Резолвит OAuth-логин в нашего User. Возвращает (user, is_new).

    Raises:
        OAuthNoEmailError: провайдер не отдал email (нужен для нового/линка).
    """
    # ── 1. Существующий OAuth-аккаунт по (provider, external_id) ──────
    stmt = (
        select(OAuthAccount)
        .where(
            OAuthAccount.provider == provider,
            OAuthAccount.external_id == info.external_id,
        )
        .limit(1)
    )
    account = (await session.execute(stmt)).scalar_one_or_none()
    if account is not None:
        user = await session.get(User, account.user_id)
        assert user is not None  # FK cascade гарантирует существование
        logger.info(
            "oauth.login.existing", provider=provider, user_id=str(user.id)
        )
        return user, False

    # Дальше нужен email (создание/линк). Провайдер обязан был его отдать.
    if not info.email:
        logger.info("oauth.login.no_email", provider=provider, external_id=info.external_id)
        raise OAuthNoEmailError()

    # ── 2. Линк к активному юзеру с тем же email ──────────────────────
    user_stmt = (
        select(User)
        .where(User.email == info.email, User.deleted_at.is_(None))
        .limit(1)
    )
    existing = (await session.execute(user_stmt)).scalar_one_or_none()
    if existing is not None:
        session.add(
            OAuthAccount(
                user_id=existing.id,
                provider=provider,
                external_id=info.external_id,
                raw_payload=_raw_payload(info),
            )
        )
        # Провайдер подтвердил владение email → верифицируем (ADR-007 §3).
        existing.email_verified = True
        await session.commit()
        logger.info(
            "oauth.login.linked", provider=provider, user_id=str(existing.id)
        )
        return existing, False

    # ── 3. Новый юзер с провизорными дефолтами (ADR-007 §4) ───────────
    name = info.name or info.email.split("@", 1)[0]
    user = User(
        email=info.email,
        password_hash=None,          # OAuth-only, без пароля
        name=name[:80],
        audience="adult",            # провизорный дефолт, донастроит в onboarding
        character="maxim",
        language=info.locale if info.locale in ("ru", "en") else "ru",
        email_verified=True,         # провайдер подтвердил email
        is_anonymous=False,
    )
    user.settings = UserSettings()   # cascade — персистится вместе с user
    user.oauth_accounts.append(
        OAuthAccount(
            provider=provider,
            external_id=info.external_id,
            raw_payload=_raw_payload(info),
        )
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    logger.info("oauth.login.created", provider=provider, user_id=str(user.id))
    return user, True
