"""make_meal_name_nullable

Revision ID: 1406e9442b77
Revises: 626841e03296
Create Date: 2025-12-26 14:44:32.534893

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "1406e9442b77"
down_revision: Union[str, Sequence[str], None] = "626841e03296"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Make meals.name column nullable."""
    bind = op.get_bind()

    # Check if using SQLite
    if bind.dialect.name == "sqlite":
        # SQLite doesn't support ALTER COLUMN, so we need to recreate the table
        # Create new table with name as nullable
        op.create_table(
            "meals_new",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("household_id", sa.Integer(), nullable=False),
            sa.Column("meal_type", sa.String(), nullable=False),
            sa.Column("day_of_week", sa.Integer(), nullable=False),
            sa.Column("week_start_date", sa.Date(), nullable=False),
            sa.Column("name", sa.String(), nullable=True),  # Changed to nullable
            sa.Column("ingredients", sa.Text(), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("meal_category", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["household_id"], ["households.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

        # Copy data from old table to new table
        op.execute(
            """
            INSERT INTO meals_new 
            (id, household_id, meal_type, day_of_week, week_start_date, name, 
             ingredients, notes, meal_category, created_at)
            SELECT 
                id, household_id, meal_type, day_of_week, week_start_date, name,
                ingredients, notes, meal_category, created_at
            FROM meals
        """
        )

        # Drop old table
        op.drop_table("meals")

        # Rename new table
        op.rename_table("meals_new", "meals")

        # Recreate indexes
        op.create_index(op.f("ix_meals_id"), "meals", ["id"], unique=False)
        op.create_index(
            op.f("ix_meals_meal_type"), "meals", ["meal_type"], unique=False
        )
        op.create_index(
            op.f("ix_meals_day_of_week"), "meals", ["day_of_week"], unique=False
        )
        op.create_index(
            op.f("ix_meals_week_start_date"), "meals", ["week_start_date"], unique=False
        )
    else:
        # For PostgreSQL and other databases, use ALTER COLUMN
        op.alter_column(
            "meals",
            "name",
            existing_type=sa.String(),
            nullable=True,
        )


def downgrade() -> None:
    """Make meals.name column non-nullable."""
    bind = op.get_bind()

    if bind.dialect.name == "sqlite":
        # Recreate table with name as non-nullable
        # Note: This will fail if there are any NULL values in the name column
        op.create_table(
            "meals_new",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("household_id", sa.Integer(), nullable=False),
            sa.Column("meal_type", sa.String(), nullable=False),
            sa.Column("day_of_week", sa.Integer(), nullable=False),
            sa.Column("week_start_date", sa.Date(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),  # Back to non-nullable
            sa.Column("ingredients", sa.Text(), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("meal_category", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["household_id"], ["households.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

        # Copy data (filtering out NULL names)
        op.execute(
            """
            INSERT INTO meals_new 
            (id, household_id, meal_type, day_of_week, week_start_date, name,
             ingredients, notes, meal_category, created_at)
            SELECT 
                id, household_id, meal_type, day_of_week, week_start_date, name,
                ingredients, notes, meal_category, created_at
            FROM meals
            WHERE name IS NOT NULL
        """
        )

        op.drop_table("meals")
        op.rename_table("meals_new", "meals")

        # Recreate indexes
        op.create_index(op.f("ix_meals_id"), "meals", ["id"], unique=False)
        op.create_index(
            op.f("ix_meals_meal_type"), "meals", ["meal_type"], unique=False
        )
        op.create_index(
            op.f("ix_meals_day_of_week"), "meals", ["day_of_week"], unique=False
        )
        op.create_index(
            op.f("ix_meals_week_start_date"), "meals", ["week_start_date"], unique=False
        )
    else:
        # For PostgreSQL and other databases, use ALTER COLUMN
        # Note: This will fail if there are any NULL values in the name column
        op.alter_column(
            "meals",
            "name",
            existing_type=sa.String(),
            nullable=False,
        )
