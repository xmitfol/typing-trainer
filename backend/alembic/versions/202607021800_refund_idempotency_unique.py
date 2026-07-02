"""F2-SEC: partial UNIQUE на refund-charge idempotency_key.

Находка Сергея (F2-SEC): subscription_charges.idempotency_key — обычный
Index, НЕ unique. Под гонкой два параллельных admin-refund с одним
idempotency_key (=refund:{payment_id}) создадут ДВА refund-charge → двойной
возврат в аудите/логике.

РЕШЕНИЕ — partial UNIQUE index на idempotency_key WHERE status='refunded'.
Почему partial, а не full-unique:
  - webhook-charges (billing_service.apply_webhook) и recurring-charges тоже
    делят idempotency_key-неймспейс (webhook:{pid}:{kind}), но там путь —
    SELECT-then-insert БЕЗ IntegrityError-handling. Full-unique заставил бы
    добавить try/except и туда (риск сломать вебхук-путь).
  - failed/pending charges легитимно повторяются (retry) с одним ключом —
    full-unique их бы отверг.
  - Возврат — единственный контур, где дубль = реальный денежный риск, и он
    всегда status='refunded'. Partial точечно закрывает только его.

Аддитивно поверх 202607021600. Существующие данные не ломает (в норме на
каждый refund:{pid} максимум одна refunded-строка; если бы были дубли —
CREATE INDEX упал бы, что и есть сигнал).

Revision ID: 202607021800
Revises: 202607021600
Create Date: 2026-07-02 18:00:00
"""
from typing import Sequence, Union

from alembic import op


revision: str = "202607021800"
down_revision: Union[str, None] = "202607021600"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_INDEX = "uq_sub_charges_refund_idem"


def upgrade() -> None:
    op.execute(
        f"CREATE UNIQUE INDEX {_INDEX} "
        "ON subscription_charges (idempotency_key) "
        "WHERE status = 'refunded'"
    )


def downgrade() -> None:
    op.execute(f"DROP INDEX IF EXISTS {_INDEX}")
