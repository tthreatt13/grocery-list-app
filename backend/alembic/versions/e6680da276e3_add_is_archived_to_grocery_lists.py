"""add_is_archived_to_grocery_lists

Revision ID: e6680da276e3
Revises: d1e2f3a4b5c6
Create Date: 2025-12-14 19:53:54.017352

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e6680da276e3"
down_revision: Union[str, Sequence[str], None] = "d1e2f3a4b5c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add is_archived column to grocery_lists table."""
    op.add_column(
        "grocery_lists",
        sa.Column("is_archived", sa.Boolean(), server_default="false", nullable=False),
    )


def downgrade() -> None:
    """Remove is_archived column from grocery_lists table."""
    op.drop_column("grocery_lists", "is_archived")
