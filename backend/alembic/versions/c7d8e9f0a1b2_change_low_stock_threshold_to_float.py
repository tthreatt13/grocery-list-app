"""change low_stock_threshold to float

Revision ID: c7d8e9f0a1b2
Revises: 4801cb88f9d6
Create Date: 2025-01-15 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c7d8e9f0a1b2"
down_revision: Union[str, Sequence[str], None] = "4801cb88f9d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Change low_stock_threshold column from Integer to Float."""
    bind = op.get_bind()

    # Check if using SQLite
    if bind.dialect.name == "sqlite":
        # SQLite doesn't support ALTER COLUMN, so we need to recreate the table
        # Create new table with Float type
        op.create_table(
            "pantry_items_new",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("household_id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("quantity", sa.String(), nullable=True),
            sa.Column("category", sa.String(), nullable=True),
            sa.Column("expiration_date", sa.DateTime(), nullable=True),
            sa.Column(
                "low_stock_threshold", sa.Float(), nullable=True
            ),  # Changed to Float
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["household_id"], ["households.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

        # Copy data from old table to new table
        op.execute(
            """
            INSERT INTO pantry_items_new 
            (id, household_id, name, quantity, category, expiration_date, 
             low_stock_threshold, created_at, updated_at)
            SELECT 
                id, household_id, name, quantity, category, expiration_date,
                CAST(low_stock_threshold AS REAL) as low_stock_threshold,
                created_at, updated_at
            FROM pantry_items
        """
        )

        # Drop old table
        op.drop_table("pantry_items")

        # Rename new table
        op.rename_table("pantry_items_new", "pantry_items")

        # Recreate indexes
        op.create_index(
            op.f("ix_pantry_items_id"), "pantry_items", ["id"], unique=False
        )
        op.create_index(
            op.f("ix_pantry_items_category"), "pantry_items", ["category"], unique=False
        )
        op.create_index(
            op.f("ix_pantry_items_expiration_date"),
            "pantry_items",
            ["expiration_date"],
            unique=False,
        )
    else:
        # For PostgreSQL and other databases, use ALTER COLUMN
        op.alter_column(
            "pantry_items",
            "low_stock_threshold",
            existing_type=sa.Integer(),
            type_=sa.Float(),
            existing_nullable=True,
        )


def downgrade() -> None:
    """Change low_stock_threshold column back from Float to Integer."""
    bind = op.get_bind()

    if bind.dialect.name == "sqlite":
        # Recreate table with Integer type
        op.create_table(
            "pantry_items_new",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("household_id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("quantity", sa.String(), nullable=True),
            sa.Column("category", sa.String(), nullable=True),
            sa.Column("expiration_date", sa.DateTime(), nullable=True),
            sa.Column(
                "low_stock_threshold", sa.Integer(), nullable=True
            ),  # Back to Integer
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["household_id"], ["households.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

        # Copy data (truncating float values to integers)
        op.execute(
            """
            INSERT INTO pantry_items_new 
            (id, household_id, name, quantity, category, expiration_date,
             low_stock_threshold, created_at, updated_at)
            SELECT 
                id, household_id, name, quantity, category, expiration_date,
                CAST(low_stock_threshold AS INTEGER) as low_stock_threshold,
                created_at, updated_at
            FROM pantry_items
        """
        )

        op.drop_table("pantry_items")
        op.rename_table("pantry_items_new", "pantry_items")

        # Recreate indexes
        op.create_index(
            op.f("ix_pantry_items_id"), "pantry_items", ["id"], unique=False
        )
        op.create_index(
            op.f("ix_pantry_items_category"), "pantry_items", ["category"], unique=False
        )
        op.create_index(
            op.f("ix_pantry_items_expiration_date"),
            "pantry_items",
            ["expiration_date"],
            unique=False,
        )
    else:
        # For PostgreSQL, use ALTER COLUMN
        op.alter_column(
            "pantry_items",
            "low_stock_threshold",
            existing_type=sa.Float(),
            type_=sa.Integer(),
            existing_nullable=True,
        )
