"""add_zip_code_to_household_user_preferences

Revision ID: e4a05e381069
Revises: e6680da276e3
Create Date: 2025-12-26 10:37:28.049006

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e4a05e381069'
down_revision: Union[str, Sequence[str], None] = 'e6680da276e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add zip_code column to household_user_preferences table."""
    op.add_column(
        "household_user_preferences",
        sa.Column("zip_code", sa.String(), nullable=True),
    )


def downgrade() -> None:
    """Remove zip_code column from household_user_preferences table."""
    op.drop_column("household_user_preferences", "zip_code")
