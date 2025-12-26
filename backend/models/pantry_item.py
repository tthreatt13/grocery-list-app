"""PantryItem model for household pantry inventory."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship

from database import Base


class PantryItem(Base):
    """PantryItem model representing items in a household's pantry inventory."""

    __tablename__ = "pantry_items"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id"), nullable=False)
    name = Column(String, nullable=False)
    quantity = Column(String, nullable=True)
    category = Column(String, nullable=True, index=True)
    expiration_date = Column(DateTime, nullable=True, index=True)
    low_stock_threshold = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    household = relationship("Household", backref="pantry_items")

    def __repr__(self):
        """String representation of PantryItem."""
        return f"<PantryItem(id={self.id}, name='{self.name}', quantity='{self.quantity}')>"
