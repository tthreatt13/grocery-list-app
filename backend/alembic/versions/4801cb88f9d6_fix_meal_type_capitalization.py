"""fix_meal_type_capitalization

Revision ID: 4801cb88f9d6
Revises: b1f2c3d4e5f6
Create Date: 2025-11-12 21:50:35.806105

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4801cb88f9d6'
down_revision: Union[str, Sequence[str], None] = 'b1f2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Normalize meal type values to lowercase in grocery_items table."""
    # The backend expects lowercase meal types, but some items were created with capitalized values
    # This migration normalizes all meal types to lowercase for consistency
    
    # Get connection to execute raw SQL
    connection = op.get_bind()
    
    # Normalize capitalized meal types to lowercase
    meal_type_mappings = [
        ('Breakfast', 'breakfast'),
        ('Lunch', 'lunch'),
        ('Dinner', 'dinner'),
        ('Snack', 'snack'),
    ]
    
    print("Normalizing meal type values to lowercase...")
    
    for old_value, new_value in meal_type_mappings:
        result = connection.execute(
            sa.text("UPDATE grocery_items SET meal_type = :new_value WHERE meal_type = :old_value"),
            {"old_value": old_value, "new_value": new_value}
        )
        if result.rowcount > 0:
            print(f"  Updated {result.rowcount} items: '{old_value}' -> '{new_value}'")
    
    print("Migration completed!")


def downgrade() -> None:
    """Downgrade schema."""
    # This migration is data-only and doesn't need a downgrade
    # The original data state cannot be reliably restored
    pass
