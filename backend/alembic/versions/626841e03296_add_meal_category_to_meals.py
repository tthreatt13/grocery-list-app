"""add_meal_category_to_meals

Revision ID: 626841e03296
Revises: f7a8b9c0d1e2
Create Date: 2025-12-26 14:36:58.821452

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '626841e03296'
down_revision: Union[str, Sequence[str], None] = 'f7a8b9c0d1e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add meal_category column to meals table."""
    # Add meal_category column with default value 'normal'
    op.add_column(
        "meals",
        sa.Column("meal_category", sa.String(), nullable=True, server_default="normal"),
    )


def downgrade() -> None:
    """Remove meal_category column from meals table."""
    op.drop_column("meals", "meal_category")
