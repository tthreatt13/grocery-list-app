"""User model for storing Clerk-authenticated users."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    """User model representing a Clerk-authenticated user."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    clerk_user_id = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationships (will be added as other models are created)
    # households - many-to-many through household_members
    # grocery_lists - one-to-many (lists created by this user)
    # meals - one-to-many (meals created by this user)
    
    def __repr__(self):
        """String representation of User."""
        return f"<User(id={self.id}, email='{self.email}', name='{self.name}')>"

