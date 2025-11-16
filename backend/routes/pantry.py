"""API routes for pantry inventory management."""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import get_db
from middleware.auth import get_current_user
from models.user import User
from models.household_member import HouseholdMember
from models.pantry_item import PantryItem
from schemas.pantry import PantryItemCreate, PantryItemUpdate, PantryItemResponse


router = APIRouter(prefix="/api/pantry", tags=["pantry"])


def check_household_membership(
    household_id: int,
    user: User,
    db: Session
) -> HouseholdMember:
    """
    Verify that user is a member of the household.
    
    Args:
        household_id: The household ID to check
        user: The current user
        db: Database session
    
    Returns:
        HouseholdMember: The membership record
    
    Raises:
        HTTPException: If user is not a member (403)
    """
    membership = db.query(HouseholdMember).filter(
        HouseholdMember.household_id == household_id,
        HouseholdMember.user_id == user.id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this household"
        )
    
    return membership


def check_item_access(
    item_id: int,
    user: User,
    db: Session
) -> PantryItem:
    """
    Verify that user has access to the pantry item.
    
    Args:
        item_id: The pantry item ID
        user: The current user
        db: Database session
    
    Returns:
        PantryItem: The pantry item
    
    Raises:
        HTTPException: If item not found (404) or no access (403)
    """
    item = db.query(PantryItem).filter(PantryItem.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pantry item not found"
        )
    
    # Check if user is member of the household
    check_household_membership(item.household_id, user, db)
    
    return item


@router.get("", response_model=List[PantryItemResponse])
def list_pantry_items(
    household_id: int = Query(..., description="Household ID to get pantry items for"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by item name"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all pantry items for a household with optional filters.
    
    - **household_id**: Required household ID
    - **category**: Optional category filter
    - **search**: Optional name search (case-insensitive)
    """
    # Check permission
    check_household_membership(household_id, current_user, db)
    
    # Build query
    query = db.query(PantryItem).filter(PantryItem.household_id == household_id)
    
    # Apply filters
    if category:
        query = query.filter(PantryItem.category == category)
    
    if search:
        query = query.filter(PantryItem.name.ilike(f"%{search}%"))
    
    items = query.order_by(PantryItem.name).all()
    
    return items


@router.get("/expiring", response_model=List[PantryItemResponse])
def get_expiring_items(
    household_id: int = Query(..., description="Household ID"),
    days: int = Query(7, ge=1, le=365, description="Number of days to look ahead"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get pantry items expiring within the specified number of days.
    
    - **household_id**: Required household ID
    - **days**: Number of days to look ahead (default: 7)
    """
    # Check permission
    check_household_membership(household_id, current_user, db)
    
    # Calculate expiration threshold
    expiration_threshold = datetime.utcnow() + timedelta(days=days)
    
    # Query items expiring soon
    items = db.query(PantryItem).filter(
        PantryItem.household_id == household_id,
        PantryItem.expiration_date.isnot(None),
        PantryItem.expiration_date <= expiration_threshold
    ).order_by(PantryItem.expiration_date).all()
    
    return items


@router.get("/low-stock", response_model=List[PantryItemResponse])
def get_low_stock_items(
    household_id: int = Query(..., description="Household ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get pantry items that are marked as low stock.
    
    This returns items where a low_stock_threshold is defined.
    The frontend/user can determine if current quantity is below threshold.
    
    - **household_id**: Required household ID
    """
    # Check permission
    check_household_membership(household_id, current_user, db)
    
    # Query items with low stock threshold defined
    # In a real implementation, you might want to parse quantity as a number
    # and compare it with low_stock_threshold
    items = db.query(PantryItem).filter(
        PantryItem.household_id == household_id,
        PantryItem.low_stock_threshold.isnot(None)
    ).order_by(PantryItem.name).all()
    
    return items


@router.get("/{item_id}", response_model=PantryItemResponse)
def get_pantry_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific pantry item by ID.
    
    - **item_id**: The pantry item ID
    """
    item = check_item_access(item_id, current_user, db)
    return item


@router.post("", response_model=PantryItemResponse, status_code=status.HTTP_201_CREATED)
def create_pantry_item(
    item_data: PantryItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new pantry item.
    
    - **household_id**: Required household ID
    - **name**: Required item name
    - **quantity**: Optional quantity string (e.g., "2 lbs", "1 gallon")
    - **category**: Optional category
    - **expiration_date**: Optional expiration date
    - **low_stock_threshold**: Optional low stock threshold
    """
    # Check permission
    check_household_membership(item_data.household_id, current_user, db)
    
    # Create new item
    new_item = PantryItem(
        household_id=item_data.household_id,
        name=item_data.name,
        quantity=item_data.quantity,
        category=item_data.category,
        expiration_date=item_data.expiration_date,
        low_stock_threshold=item_data.low_stock_threshold
    )
    
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    return new_item


@router.put("/{item_id}", response_model=PantryItemResponse)
def update_pantry_item(
    item_id: int,
    item_data: PantryItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a pantry item.
    
    All fields are optional. Only provided fields will be updated.
    
    - **item_id**: The pantry item ID to update
    """
    # Check access
    item = check_item_access(item_id, current_user, db)
    
    # Update fields
    update_data = item_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    
    db.commit()
    db.refresh(item)
    
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pantry_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a pantry item.
    
    - **item_id**: The pantry item ID to delete
    """
    # Check access
    item = check_item_access(item_id, current_user, db)
    
    # Delete item
    db.delete(item)
    db.commit()
    
    return None

