"""Household management routes."""

from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from middleware.auth import get_current_user
from middleware.permissions import (
    require_household_member,
    require_household_admin,
    can_remove_member,
    validate_household_exists,
)
from models.user import User
from models.household import Household
from models.household_member import HouseholdMember
from models.grocery_list import GroceryList
from models.grocery_item import GroceryItem
from models.household_user_preferences import HouseholdUserPreferences
from schemas.household import (
    HouseholdCreate,
    HouseholdUpdate,
    HouseholdResponse,
    HouseholdWithMembersResponse,
    MemberInvite,
    MemberResponse,
    MemberRoleUpdate,
    SharedListsResponse,
    SharedListItem,
    HouseholdPreferencesUpdate,
    HouseholdPreferencesResponse,
)

router = APIRouter(prefix="/households", tags=["households"])


@router.get("", response_model=List[HouseholdResponse])
def get_user_households(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> List[Household]:
    """
    Get all households for the current user.

    Args:
        current_user: Current authenticated user
        db: Database session

    Returns:
        List of households user is a member of
    """
    # Get all household memberships for user
    memberships = db.query(HouseholdMember).filter(HouseholdMember.user_id == current_user.id).all()

    # Get all households from memberships
    household_ids = [m.household_id for m in memberships]
    households = db.query(Household).filter(Household.id.in_(household_ids)).all()

    return households


@router.get("/{household_id}", response_model=HouseholdWithMembersResponse)
def get_household(
    household_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Household:
    """
    Get a specific household with member details.

    Args:
        household_id: Household ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        Household with member list

    Raises:
        HTTPException: If household not found or user not a member
    """
    # Validate household exists
    household = validate_household_exists(db, household_id)

    # Check user is a member
    require_household_member(db, household_id, current_user)

    # Get all members with user details
    members = db.query(HouseholdMember).filter(HouseholdMember.household_id == household_id).all()

    # Create response with member details
    member_responses = []
    for member in members:
        user = db.query(User).filter(User.id == member.user_id).first()
        member_response = MemberResponse(
            id=member.id,
            household_id=member.household_id,
            user_id=member.user_id,
            role=member.role,
            joined_at=member.joined_at,
            user_email=user.email if user else None,
            user_name=user.name if user else None,
        )
        member_responses.append(member_response)

    # Build response
    response = HouseholdWithMembersResponse(
        id=household.id,
        name=household.name,
        created_by=household.created_by,
        created_at=household.created_at,
        members=member_responses,
    )

    return response


@router.post("", response_model=HouseholdResponse, status_code=status.HTTP_201_CREATED)
def create_household(
    household_data: HouseholdCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Household:
    """
    Create a new household.
    Creator is automatically added as admin member.

    Args:
        household_data: Household creation data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Created household
    """
    # Create household
    household = Household(name=household_data.name, created_by=current_user.id)
    db.add(household)
    db.commit()
    db.refresh(household)

    # Add creator as admin member
    member = HouseholdMember(household_id=household.id, user_id=current_user.id, role="admin")
    db.add(member)
    db.commit()

    return household


@router.put("/{household_id}", response_model=HouseholdResponse)
def update_household(
    household_id: int,
    household_data: HouseholdUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Household:
    """
    Update household information.
    Only admins can update household.

    Args:
        household_id: Household ID
        household_data: Household update data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated household

    Raises:
        HTTPException: If household not found or user not admin
    """
    # Validate household exists
    household = validate_household_exists(db, household_id)

    # Check user is admin
    require_household_admin(db, household_id, current_user)

    # Update fields
    if household_data.name is not None:
        household.name = household_data.name

    db.commit()
    db.refresh(household)

    return household


@router.delete("/{household_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_household(
    household_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """
    Delete a household.
    Only admins can delete household.

    Args:
        household_id: Household ID
        current_user: Current authenticated user
        db: Database session

    Raises:
        HTTPException: If household not found or user not admin
    """
    # Validate household exists
    household = validate_household_exists(db, household_id)

    # Check user is admin
    require_household_admin(db, household_id, current_user)

    # Delete all members first (due to foreign key constraints)
    db.query(HouseholdMember).filter(HouseholdMember.household_id == household_id).delete()

    # Delete household
    db.delete(household)
    db.commit()


@router.post(
    "/{household_id}/members",
    response_model=MemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def invite_member(
    household_id: int,
    invite_data: MemberInvite,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MemberResponse:
    """
    Invite a member to the household by email.
    Only admins can invite members.

    Args:
        household_id: Household ID
        invite_data: Member invite data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Created member record

    Raises:
        HTTPException: If household not found, user not found, user not admin,
            or user already member
    """
    # Validate household exists
    validate_household_exists(db, household_id)

    # Check user is admin
    require_household_admin(db, household_id, current_user)

    # Find user by email
    invited_user = db.query(User).filter(User.email == invite_data.email).first()
    if not invited_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email {invite_data.email} not found",
        )

    # Check if already a member
    existing_member = (
        db.query(HouseholdMember)
        .filter(
            HouseholdMember.household_id == household_id,
            HouseholdMember.user_id == invited_user.id,
        )
        .first()
    )

    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this household",
        )

    # Create member record
    member = HouseholdMember(
        household_id=household_id, user_id=invited_user.id, role=invite_data.role
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    # Build response
    response = MemberResponse(
        id=member.id,
        household_id=member.household_id,
        user_id=member.user_id,
        role=member.role,
        joined_at=member.joined_at,
        user_email=invited_user.email,
        user_name=invited_user.name,
    )

    return response


@router.put("/{household_id}/members/{user_id}", response_model=MemberResponse)
def update_member_role(
    household_id: int,
    user_id: int,
    role_data: MemberRoleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MemberResponse:
    """
    Update a member's role in the household.
    Only admins can update member roles.

    Args:
        household_id: Household ID
        user_id: User ID to update
        role_data: Role update data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated member record

    Raises:
        HTTPException: If household not found, member not found, or user not admin
    """
    # Validate household exists
    validate_household_exists(db, household_id)

    # Check user is admin
    require_household_admin(db, household_id, current_user)

    # Find member record
    member = (
        db.query(HouseholdMember)
        .filter(
            HouseholdMember.household_id == household_id,
            HouseholdMember.user_id == user_id,
        )
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this household",
        )

    # Update role
    member.role = role_data.role
    db.commit()
    db.refresh(member)

    # Get user details
    user = db.query(User).filter(User.id == user_id).first()

    # Build response
    response = MemberResponse(
        id=member.id,
        household_id=member.household_id,
        user_id=member.user_id,
        role=member.role,
        joined_at=member.joined_at,
        user_email=user.email if user else None,
        user_name=user.name if user else None,
    )

    return response


@router.delete("/{household_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    household_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """
    Remove a member from the household.
    Admins can remove any member. Members can remove themselves.

    Args:
        household_id: Household ID
        user_id: User ID to remove
        current_user: Current authenticated user
        db: Database session

    Raises:
        HTTPException: If household not found, member not found, or insufficient permissions
    """
    # Validate household exists
    validate_household_exists(db, household_id)

    # Check permissions (admin or removing self)
    if not can_remove_member(db, household_id, current_user, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to remove this member",
        )

    # Find member record
    member = (
        db.query(HouseholdMember)
        .filter(
            HouseholdMember.household_id == household_id,
            HouseholdMember.user_id == user_id,
        )
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this household",
        )

    # Delete member record
    db.delete(member)
    db.commit()


@router.get("/{household_id}/shared-lists", response_model=SharedListsResponse)
def get_shared_lists(
    household_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SharedListsResponse:
    """
    Get all grocery lists shared in the household.

    Args:
        household_id: Household ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        Shared lists response with household and list details

    Raises:
        HTTPException: If household not found or user not a member
    """
    # Validate household exists
    household = validate_household_exists(db, household_id)

    # Check user is a member
    require_household_member(db, household_id, current_user)

    # Get all grocery lists for this household, sorted by created_at descending (newest first)
    grocery_lists = (
        db.query(GroceryList)
        .filter(GroceryList.household_id == household_id)
        .order_by(GroceryList.created_at.desc())
        .all()
    )

    # Build list items with item counts
    list_items = []
    for grocery_list in grocery_lists:
        # Count items in the list
        item_count = (
            db.query(func.count(GroceryItem.id))
            .filter(GroceryItem.list_id == grocery_list.id)
            .scalar()
        )

        list_item = SharedListItem(
            id=grocery_list.id,
            name=grocery_list.name,
            created_by=grocery_list.created_by,
            created_at=grocery_list.created_at,
            updated_at=grocery_list.updated_at,
            item_count=item_count or 0,
        )
        list_items.append(list_item)

    # Build response
    response = SharedListsResponse(
        household_id=household.id, household_name=household.name, lists=list_items
    )

    return response


@router.get("/{household_id}/preferences/me", response_model=HouseholdPreferencesResponse)
def get_my_preferences(
    household_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HouseholdPreferencesResponse:
    """
    Get current user's preferences for a household.

    Args:
        household_id: Household ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        User's preferences for the household, or default empty preferences if not found

    Raises:
        HTTPException: If household not found or user not a member
    """
    # Validate household exists
    validate_household_exists(db, household_id)

    # Check user is a member
    require_household_member(db, household_id, current_user)

    # Get or create preferences
    preferences = (
        db.query(HouseholdUserPreferences)
        .filter(
            HouseholdUserPreferences.household_id == household_id,
            HouseholdUserPreferences.user_id == current_user.id,
        )
        .first()
    )

    if not preferences:
        # Return default empty preferences
        return HouseholdPreferencesResponse(
            household_id=household_id,
            user_id=current_user.id,
            diet_types=None,
            cooking_apparatus=None,
            previous_meals=None,
            zip_code=None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

    return preferences


@router.put("/{household_id}/preferences/me", response_model=HouseholdPreferencesResponse)
def update_my_preferences(
    household_id: int,
    preferences_data: HouseholdPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HouseholdPreferencesResponse:
    """
    Create or update current user's preferences for a household.

    Args:
        household_id: Household ID
        preferences_data: Preferences data to update
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated preferences

    Raises:
        HTTPException: If household not found or user not a member
    """
    # Validate household exists
    validate_household_exists(db, household_id)

    # Check user is a member
    require_household_member(db, household_id, current_user)

    # Get existing preferences or create new
    preferences = (
        db.query(HouseholdUserPreferences)
        .filter(
            HouseholdUserPreferences.household_id == household_id,
            HouseholdUserPreferences.user_id == current_user.id,
        )
        .first()
    )

    if not preferences:
        # Create new preferences
        preferences = HouseholdUserPreferences(
            household_id=household_id,
            user_id=current_user.id,
            diet_types=preferences_data.diet_types,
            cooking_apparatus=preferences_data.cooking_apparatus,
            previous_meals=preferences_data.previous_meals,
            zip_code=preferences_data.zip_code,
        )
        db.add(preferences)
    else:
        # Update existing preferences
        if preferences_data.diet_types is not None:
            preferences.diet_types = preferences_data.diet_types
        if preferences_data.cooking_apparatus is not None:
            preferences.cooking_apparatus = preferences_data.cooking_apparatus
        if preferences_data.previous_meals is not None:
            preferences.previous_meals = preferences_data.previous_meals
        if preferences_data.zip_code is not None:
            preferences.zip_code = preferences_data.zip_code

    db.commit()
    db.refresh(preferences)

    return preferences
