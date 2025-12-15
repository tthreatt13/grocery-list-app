"""Permission checking middleware and helper functions."""

from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.user import User
from models.household import Household
from models.household_member import HouseholdMember


class PermissionDeniedError(HTTPException):
    """Exception raised when user doesn't have required permissions."""

    def __init__(
        self, detail: str = "You don't have permission to perform this action"
    ):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def get_household_member(
    db: Session, household_id: int, user_id: int
) -> Optional[HouseholdMember]:
    """
    Get household member record for a user.

    Args:
        db: Database session
        household_id: Household ID
        user_id: User ID

    Returns:
        HouseholdMember or None if not a member
    """
    return (
        db.query(HouseholdMember)
        .filter(
            HouseholdMember.household_id == household_id,
            HouseholdMember.user_id == user_id,
        )
        .first()
    )


def is_household_member(db: Session, household_id: int, user: User) -> bool:
    """
    Check if user is a member of the household.

    Args:
        db: Database session
        household_id: Household ID
        user: User object

    Returns:
        True if user is a member, False otherwise
    """
    member = get_household_member(db, household_id, user.id)
    return member is not None


def is_household_admin(db: Session, household_id: int, user: User) -> bool:
    """
    Check if user is an admin of the household.

    Args:
        db: Database session
        household_id: Household ID
        user: User object

    Returns:
        True if user is an admin, False otherwise
    """
    member = get_household_member(db, household_id, user.id)
    return member is not None and member.role == "admin"


def require_household_member(
    db: Session, household_id: int, user: User
) -> HouseholdMember:
    """
    Require that user is a member of the household.
    Raises PermissionDeniedError if not.

    Args:
        db: Database session
        household_id: Household ID
        user: User object

    Returns:
        HouseholdMember object

    Raises:
        PermissionDeniedError: If user is not a member
    """
    member = get_household_member(db, household_id, user.id)
    if not member:
        raise PermissionDeniedError(
            detail="You must be a household member to access this resource"
        )
    return member


def require_household_admin(
    db: Session, household_id: int, user: User
) -> HouseholdMember:
    """
    Require that user is an admin of the household.
    Raises PermissionDeniedError if not.

    Args:
        db: Database session
        household_id: Household ID
        user: User object

    Returns:
        HouseholdMember object

    Raises:
        PermissionDeniedError: If user is not an admin
    """
    member = get_household_member(db, household_id, user.id)
    if not member:
        raise PermissionDeniedError(
            detail="You must be a household member to access this resource"
        )
    if member.role != "admin":
        raise PermissionDeniedError(
            detail="You must be a household admin to perform this action"
        )
    return member


def can_modify_household(db: Session, household_id: int, user: User) -> bool:
    """
    Check if user can modify household (must be admin).

    Args:
        db: Database session
        household_id: Household ID
        user: User object

    Returns:
        True if user can modify, False otherwise
    """
    return is_household_admin(db, household_id, user)


def can_invite_members(db: Session, household_id: int, user: User) -> bool:
    """
    Check if user can invite members to household (must be admin).

    Args:
        db: Database session
        household_id: Household ID
        user: User object

    Returns:
        True if user can invite, False otherwise
    """
    return is_household_admin(db, household_id, user)


def can_remove_member(
    db: Session, household_id: int, user: User, target_user_id: int
) -> bool:
    """
    Check if user can remove a member from household.
    Admins can remove any member. Members can remove themselves.

    Args:
        db: Database session
        household_id: Household ID
        user: User object (the one performing the action)
        target_user_id: ID of user being removed

    Returns:
        True if user can remove member, False otherwise
    """
    # Users can always remove themselves
    if user.id == target_user_id:
        return is_household_member(db, household_id, user)

    # Otherwise, must be admin
    return is_household_admin(db, household_id, user)


def validate_household_exists(db: Session, household_id: int) -> Household:
    """
    Validate that a household exists.

    Args:
        db: Database session
        household_id: Household ID

    Returns:
        Household object

    Raises:
        HTTPException: If household not found
    """
    household = db.query(Household).filter(Household.id == household_id).first()
    if not household:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Household with id {household_id} not found",
        )
    return household
