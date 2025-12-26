"""Meal model for weekly meal planning."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from database import Base


class Meal(Base):
    """Meal model representing a planned meal for a specific day and meal type."""

    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id"), nullable=False)
    meal_type = Column(
        String, nullable=False, index=True
    )  # breakfast, lunch, dinner, snack
    day_of_week = Column(Integer, nullable=False, index=True)  # 0=Monday, 6=Sunday
    week_start_date = Column(Date, nullable=False, index=True)  # Monday of the week
    name = Column(String, nullable=False)
    ingredients = Column(Text, nullable=True)  # Comma-separated or newline-separated
    notes = Column(Text, nullable=True)
    meal_category = Column(
        String, nullable=True, default="normal"
    )  # normal, quick_meal, eat_out
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    household = relationship("Household", backref="meals")

    def __repr__(self):
        """String representation of Meal."""
        return (
            f"<Meal(id={self.id}, name='{self.name}', "
            f"meal_type='{self.meal_type}', day={self.day_of_week})>"
        )
