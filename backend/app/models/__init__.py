"""SQLAlchemy 2.0 declarative models.

Все модели импортируются здесь чтобы alembic autogenerate видел их
через `Base.metadata`. Порядок импорта не важен — relationships
резолвятся лениво.
"""

from app.models.admin import AdminAuditLog
from app.models.admin_2fa import Admin2FA
from app.models.base import Base
from app.models.event import Event
from app.models.progress import Attempt, Progress
from app.models.subscription import Subscription, SubscriptionCharge
from app.models.user import OAuthAccount, User, UserSettings

__all__ = [
    "Admin2FA",
    "AdminAuditLog",
    "Attempt",
    "Base",
    "Event",
    "OAuthAccount",
    "Progress",
    "Subscription",
    "SubscriptionCharge",
    "User",
    "UserSettings",
]
