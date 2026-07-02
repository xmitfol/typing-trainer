"""AdminAuditLog model — аудит всех мутирующих действий админ-панели.

DDL: admin-panel TSD §3.2. Каждая мутация в админке (block/restore/
reset-password/verify-email/role/refund/impersonate/…) пишет запись сюда
через admin_service.audit(). 152-ФЗ: IP — только SHA256-хеш (как в events).
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import BigInteger, ForeignKey, Index, String, text
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class AdminAuditLog(Base):
    """Неизменяемая запись действия сотрудника над сущностью.

    actor_user_id — кто (SET NULL при удалении сотрудника, чтобы история
    не терялась). action — 'user.block'/'user.restore'/'role.set'/… .
    target_type/target_id — над кем/чем. payload — детали (до/после и т.п.).
    """

    __tablename__ = "admin_audit_log"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    actor_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    action: Mapped[str] = mapped_column(String(48), nullable=False)
    target_type: Mapped[str] = mapped_column(String(24), nullable=False)
    target_id: Mapped[str] = mapped_column(String(64), nullable=False)
    payload: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )
    # SHA256(IP) — 64 hex chars. NULL для действий без HTTP-контекста (CLI).
    ip_hash: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    __table_args__ = (
        Index(
            "ix_admin_audit_actor_time",
            "actor_user_id",
            "created_at",
            postgresql_ops={"created_at": "DESC"},
        ),
        Index(
            "ix_admin_audit_target_time",
            "target_type",
            "target_id",
            "created_at",
            postgresql_ops={"created_at": "DESC"},
        ),
    )
