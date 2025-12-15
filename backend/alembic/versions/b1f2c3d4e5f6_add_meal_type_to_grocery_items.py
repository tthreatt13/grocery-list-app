"""add meal_type to grocery_items

Revision ID: b1f2c3d4e5f6
Revises: 90f091a98d1c
Create Date: 2025-11-13 10:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b1f2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "90f091a98d1c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add meal_type column to grocery_items table."""
    # Add meal_type column to grocery_items table
    op.add_column("grocery_items", sa.Column("meal_type", sa.String(), nullable=True))

    # Add index for meal_type column for better query performance
    op.create_index(
        op.f("ix_grocery_items_meal_type"), "grocery_items", ["meal_type"], unique=False
    )


def downgrade() -> None:
    """Remove meal_type column from grocery_items table."""
    # Drop the index first
    op.drop_index(op.f("ix_grocery_items_meal_type"), table_name="grocery_items")

    # Drop the meal_type column
    op.drop_column("grocery_items", "meal_type")
