"""remove_weekly_weather_from_household_user_preferences

Revision ID: f7a8b9c0d1e2
Revises: e4a05e381069
Create Date: 2025-12-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f7a8b9c0d1e2'
down_revision: Union[str, Sequence[str], None] = 'e4a05e381069'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove weekly_weather column from household_user_preferences table."""
    op.drop_column("household_user_preferences", "weekly_weather")


def downgrade() -> None:
    """Add weekly_weather column back to household_user_preferences table."""
    op.add_column(
        "household_user_preferences",
        sa.Column("weekly_weather", sa.String(), nullable=True),
    )

