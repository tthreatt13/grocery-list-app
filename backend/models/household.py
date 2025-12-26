"""Household model for family/shared group management."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class Household(Base):
    """Household model representing a family or shared group."""

    __tablename__ = "households"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    creator = relationship("User", foreign_keys=[created_by], backref="created_households")
    # members - many-to-many through household_members (will be added later)
    # grocery_lists - one-to-many (will be added later)
    # pantry_items - one-to-many (will be added later)
    # meals - one-to-many (will be added later)

    def __repr__(self):
        """String representation of Household."""
        return f"<Household(id={self.id}, name='{self.name}')>"
