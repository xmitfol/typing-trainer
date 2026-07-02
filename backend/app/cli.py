"""Admin CLI — операции вне HTTP (admin-panel TSD §2.4).

Бутстрап первого superadmin (курица-яйцо: первую роль нельзя выдать через
саму админку). Работает через async-сессию напрямую в БД.

Запуск (внутри backend-контейнера или venv с настроенным .env):

    python -m app.cli grant-role <email> <role>

где <role> ∈ {user, analyst, support, superadmin}. Пример:

    python -m app.cli grant-role admin@typing-trainer.ru superadmin

Возвращает exit-code 0 при успехе, 1 при ошибке (нет юзера / плохая роль).
"""

import asyncio
import sys

from sqlalchemy import select

from app.core.db import dispose_engine, get_sessionmaker
from app.deps import ROLE_RANK
from app.models.user import User

VALID_ROLES = tuple(ROLE_RANK.keys())


async def grant_role(email: str, role: str) -> int:
    """Выдать роль активному юзеру по email. Возвращает exit-code."""
    if role not in VALID_ROLES:
        print(f"ERROR: недопустимая роль '{role}'. Доступно: {', '.join(VALID_ROLES)}")
        return 1

    factory = get_sessionmaker()
    async with factory() as session:
        user = (
            await session.execute(
                select(User).where(User.email == email, User.deleted_at.is_(None))
            )
        ).scalar_one_or_none()
        if user is None:
            print(f"ERROR: активный юзер с email '{email}' не найден")
            return 1
        old_role = user.role
        user.role = role
        await session.commit()
        print(f"OK: {email} role '{old_role}' -> '{role}' (id={user.id})")
    return 0


def _usage() -> int:
    print("usage: python -m app.cli grant-role <email> <role>")
    print(f"  role ∈ {{{', '.join(VALID_ROLES)}}}")
    return 2


def main(argv: list[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    if len(argv) != 3 or argv[0] != "grant-role":
        return _usage()

    _, email, role = argv
    try:
        code = asyncio.run(_run(email, role))
    finally:
        pass
    return code


async def _run(email: str, role: str) -> int:
    try:
        return await grant_role(email, role)
    finally:
        await dispose_engine()


if __name__ == "__main__":
    raise SystemExit(main())
