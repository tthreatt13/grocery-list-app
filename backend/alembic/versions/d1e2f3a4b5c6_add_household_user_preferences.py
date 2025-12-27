"""add household_user_preferences table

Revision ID: d1e2f3a4b5c6
Revises: c7d8e9f0a1b2
Create Date: 2025-12-14 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, Sequence[str], None] = "c7d8e9f0a1b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create household_user_preferences table."""
    bind = op.get_bind()

    # Check if using SQLite
    if bind.dialect.name == "sqlite":
        # SQLite uses TEXT for JSON columns
        op.create_table(
            "household_user_preferences",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("household_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column(
                "diet_types", sa.Text(), nullable=True
            ),  # JSON stored as TEXT in SQLite
            sa.Column("weekly_weather", sa.String(), nullable=True),
            sa.Column(
                "cooking_apparatus", sa.Text(), nullable=True
            ),  # JSON stored as TEXT in SQLite
            sa.Column(
                "previous_meals", sa.Text(), nullable=True
            ),  # JSON stored as TEXT in SQLite
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["household_id"], ["households.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint(
                "household_id", "user_id", name="unique_household_user_preferences"
            ),
        )
    else:
        # PostgreSQL and other databases support JSON natively
        op.create_table(
            "household_user_preferences",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("household_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("diet_types", sa.JSON(), nullable=True),
            sa.Column("weekly_weather", sa.String(), nullable=True),
            sa.Column("cooking_apparatus", sa.JSON(), nullable=True),
            sa.Column("previous_meals", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["household_id"], ["households.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint(
                "household_id", "user_id", name="unique_household_user_preferences"
            ),
        )

    op.create_index(
        op.f("ix_household_user_preferences_id"),
        "household_user_preferences",
        ["id"],
        unique=False,
    )


def downgrade() -> None:
    """Drop household_user_preferences table."""
    op.drop_index(
        op.f("ix_household_user_preferences_id"),
        table_name="household_user_preferences",
    )
    op.drop_table("household_user_preferences")
