"""initial schema

Revision ID: 90f091a98d1c
Revises:
Create Date: 2025-11-11 14:19:38.270955

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "90f091a98d1c"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("clerk_user_id", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_clerk_user_id"), "users", ["clerk_user_id"], unique=True)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    # Create households table
    op.create_table(
        "households",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_households_id"), "households", ["id"], unique=False)

    # Create household_members table
    op.create_table(
        "household_members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("household_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("joined_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["household_id"],
            ["households.id"],
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("household_id", "user_id", name="unique_household_user"),
    )
    op.create_index(op.f("ix_household_members_id"), "household_members", ["id"], unique=False)

    # Create grocery_lists table
    op.create_table(
        "grocery_lists",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("household_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["household_id"],
            ["households.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_grocery_lists_id"), "grocery_lists", ["id"], unique=False)

    # Create grocery_items table
    op.create_table(
        "grocery_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("list_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("quantity", sa.String(), nullable=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
        sa.Column("checked", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["list_id"],
            ["grocery_lists.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_grocery_items_id"), "grocery_items", ["id"], unique=False)
    op.create_index(op.f("ix_grocery_items_category"), "grocery_items", ["category"], unique=False)

    # Create pantry_items table
    op.create_table(
        "pantry_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("household_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("quantity", sa.String(), nullable=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("expiration_date", sa.DateTime(), nullable=True),
        sa.Column("low_stock_threshold", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["household_id"],
            ["households.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_pantry_items_id"), "pantry_items", ["id"], unique=False)
    op.create_index(op.f("ix_pantry_items_category"), "pantry_items", ["category"], unique=False)
    op.create_index(
        op.f("ix_pantry_items_expiration_date"),
        "pantry_items",
        ["expiration_date"],
        unique=False,
    )

    # Create meals table
    op.create_table(
        "meals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("household_id", sa.Integer(), nullable=False),
        sa.Column("meal_type", sa.String(), nullable=False),
        sa.Column("day_of_week", sa.Integer(), nullable=False),
        sa.Column("week_start_date", sa.Date(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("ingredients", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["household_id"],
            ["households.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_meals_id"), "meals", ["id"], unique=False)
    op.create_index(op.f("ix_meals_meal_type"), "meals", ["meal_type"], unique=False)
    op.create_index(op.f("ix_meals_day_of_week"), "meals", ["day_of_week"], unique=False)
    op.create_index(op.f("ix_meals_week_start_date"), "meals", ["week_start_date"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop tables in reverse order
    op.drop_index(op.f("ix_meals_week_start_date"), table_name="meals")
    op.drop_index(op.f("ix_meals_day_of_week"), table_name="meals")
    op.drop_index(op.f("ix_meals_meal_type"), table_name="meals")
    op.drop_index(op.f("ix_meals_id"), table_name="meals")
    op.drop_table("meals")

    op.drop_index(op.f("ix_pantry_items_expiration_date"), table_name="pantry_items")
    op.drop_index(op.f("ix_pantry_items_category"), table_name="pantry_items")
    op.drop_index(op.f("ix_pantry_items_id"), table_name="pantry_items")
    op.drop_table("pantry_items")

    op.drop_index(op.f("ix_grocery_items_category"), table_name="grocery_items")
    op.drop_index(op.f("ix_grocery_items_id"), table_name="grocery_items")
    op.drop_table("grocery_items")

    op.drop_index(op.f("ix_grocery_lists_id"), table_name="grocery_lists")
    op.drop_table("grocery_lists")

    op.drop_index(op.f("ix_household_members_id"), table_name="household_members")
    op.drop_table("household_members")

    op.drop_index(op.f("ix_households_id"), table_name="households")
    op.drop_table("households")

    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_clerk_user_id"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
