"""HouseholdMember association model for many-to-many relationship."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from database import Base


class HouseholdMember(Base):
    """Association model for household membership with roles."""

    __tablename__ = "household_members"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)  # admin, member, viewer
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    household = relationship("Household", backref="members")
    user = relationship("User", backref="household_memberships")

    # Unique constraint: user can only be in a household once
    __table_args__ = (
        UniqueConstraint("household_id", "user_id", name="unique_household_user"),
    )

    def __repr__(self):
        """String representation of HouseholdMember."""
        return (
            f"<HouseholdMember(household_id={self.household_id}, "
            f"user_id={self.user_id}, role='{self.role}')>"
        )
