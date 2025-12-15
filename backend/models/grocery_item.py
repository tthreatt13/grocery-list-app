"""GroceryItem model for individual items in a grocery list."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class GroceryItem(Base):
    """GroceryItem model representing an individual item in a grocery list."""

    __tablename__ = "grocery_items"

    id = Column(Integer, primary_key=True, index=True)
    list_id = Column(Integer, ForeignKey("grocery_lists.id"), nullable=False)
    name = Column(String, nullable=False)
    quantity = Column(String, nullable=True)
    category = Column(String, nullable=True, index=True)
    meal_type = Column(String, nullable=True, index=True)
    notes = Column(String, nullable=True)
    checked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    grocery_list = relationship("GroceryList", backref="items")

    def __repr__(self):
        """String representation of GroceryItem."""
        return (
            f"<GroceryItem(id={self.id}, name='{self.name}', checked={self.checked})>"
        )
