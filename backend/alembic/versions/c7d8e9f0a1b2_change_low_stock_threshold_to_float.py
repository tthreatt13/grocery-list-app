"""change low_stock_threshold to float

Revision ID: c7d8e9f0a1b2
Revises: 4801cb88f9d6
Create Date: 2025-01-15 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7d8e9f0a1b2'
down_revision: Union[str, Sequence[str], None] = '4801cb88f9d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Change low_stock_threshold column from Integer to Float."""
    # Alter the column type from Integer to Float
    op.alter_column('pantry_items', 'low_stock_threshold',
                    existing_type=sa.Integer(),
                    type_=sa.Float(),
                    existing_nullable=True)


def downgrade() -> None:
    """Change low_stock_threshold column back from Float to Integer."""
    # Note: This will truncate any decimal values to integers
    # Alter the column type from Float back to Integer
    op.alter_column('pantry_items', 'low_stock_threshold',
                    existing_type=sa.Float(),
                    type_=sa.Integer(),
                    existing_nullable=True)

