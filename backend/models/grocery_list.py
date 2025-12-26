"""GroceryList model for managing shopping lists."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from database import Base


class GroceryList(Base):
    """GroceryList model representing a shopping list."""

    __tablename__ = "grocery_lists"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id"), nullable=False)
    name = Column(String, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    is_archived = Column(Boolean, default=False, nullable=False)

    # Relationships
    household = relationship("Household", backref="grocery_lists")
    creator = relationship("User", foreign_keys=[created_by], backref="grocery_lists")
    # items - one-to-many (will be added when GroceryItem is created)

    def __repr__(self):
        """String representation of GroceryList."""
        return f"<GroceryList(id={self.id}, name='{self.name}')>"
