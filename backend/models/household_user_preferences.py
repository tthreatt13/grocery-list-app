"""HouseholdUserPreferences model for storing per-user, per-household preferences."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy import TypeDecorator
import json

from database import Base


class JSONType(TypeDecorator):
    """JSON type that works with both SQLite (TEXT) and PostgreSQL (JSON)."""
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(JSON())
        else:
            return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None and value != '':
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                # If it's not valid JSON, return as-is (shouldn't happen, but handle gracefully)
                return value
        return None


class HouseholdUserPreferences(Base):
    """Preferences model for a user within a specific household."""
    
    __tablename__ = "household_user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Preferences fields
    diet_types = Column(JSONType, nullable=True)  # Array of strings: ["paleo", "mediterranean", etc.]
    weekly_weather = Column(String, nullable=True)  # e.g., "cold", "hot", "mixed", "rainy"
    cooking_apparatus = Column(JSONType, nullable=True)  # Array of strings: ["oven", "slow_cooker", "instant_pot", etc.]
    previous_meals = Column(JSONType, nullable=True)  # Array of strings: meal names made this week
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    household = relationship("Household", backref="user_preferences")
    user = relationship("User", backref="household_preferences")
    
    # Unique constraint: one preference record per user per household
    __table_args__ = (
        UniqueConstraint('household_id', 'user_id', name='unique_household_user_preferences'),
    )
    
    def __repr__(self):
        """String representation of HouseholdUserPreferences."""
        return f"<HouseholdUserPreferences(household_id={self.household_id}, user_id={self.user_id})>"
