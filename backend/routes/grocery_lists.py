"""Grocery list API endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from database import get_db
from middleware.auth import get_current_user
from middleware.permissions import require_household_member
from models.grocery_list import GroceryList
from models.grocery_item import GroceryItem
from models.household import Household
from models.user import User
from schemas.grocery import (
    GroceryListCreate,
    GroceryListUpdate,
    GroceryListResponse,
    GroceryListWithItems,
    GroceryItemCreate,
    GroceryItemUpdate,
    GroceryItemResponse,
)

router = APIRouter(prefix="/api/grocery-lists", tags=["grocery-lists"])


@router.get("")
def get_grocery_lists(
    include_items: bool = Query(False, description="Include items in response"),
    db: Session = Depends(get_db)
):
    """
    Get all grocery lists for user's households.
    
    Args:
        include_items: If True, include items in the response
    
    Returns:
        List of grocery lists (with or without items)
    
    TODO: Add authentication and filter by user's households.
    For now, returns all grocery lists.
    """
    if include_items:
        # Eager load items to avoid N+1 queries
        lists = db.query(GroceryList).options(joinedload(GroceryList.items)).all()
        return lists
    else:
        # Return without items by converting to GroceryListResponse
        lists = db.query(GroceryList).all()
        return [
            GroceryListResponse(
                id=lst.id,
                household_id=lst.household_id,
                name=lst.name,
                created_by=lst.created_by,
                created_at=lst.created_at,
                updated_at=lst.updated_at
            )
            for lst in lists
        ]


@router.get("/{list_id}", response_model=GroceryListWithItems)
def get_grocery_list(
    list_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a single grocery list with all its items.
    
    Args:
        list_id: ID of the grocery list
        
    Returns:
        Grocery list with items
        
    Raises:
        404: If grocery list not found
    """
    grocery_list = db.query(GroceryList).filter(GroceryList.id == list_id).first()
    
    if not grocery_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Grocery list with id {list_id} not found"
        )
    
    return grocery_list


@router.post("", response_model=GroceryListResponse, status_code=status.HTTP_201_CREATED)
def create_grocery_list(
    list_data: GroceryListCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new grocery list.
    
    Args:
        list_data: Grocery list data
        
    Returns:
        Created grocery list
        
    Raises:
        404: If household not found
    """
    # Verify household exists
    household = db.query(Household).filter(Household.id == list_data.household_id).first()
    if not household:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Household with id {list_data.household_id} not found"
        )
    
    # TODO: Get current user from authentication
    # For now, use the household creator as the list creator
    created_by = household.created_by
    
    grocery_list = GroceryList(
        name=list_data.name,
        household_id=list_data.household_id,
        created_by=created_by
    )
    
    db.add(grocery_list)
    db.commit()
    db.refresh(grocery_list)
    
    return grocery_list


@router.put("/{list_id}", response_model=GroceryListResponse)
def update_grocery_list(
    list_id: int,
    list_data: GroceryListUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a grocery list.
    
    Args:
        list_id: ID of the grocery list
        list_data: Updated grocery list data
        
    Returns:
        Updated grocery list
        
    Raises:
        404: If grocery list not found
    """
    grocery_list = db.query(GroceryList).filter(GroceryList.id == list_id).first()
    
    if not grocery_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Grocery list with id {list_id} not found"
        )
    
    # Update fields
    if list_data.name is not None:
        grocery_list.name = list_data.name
    
    db.commit()
    db.refresh(grocery_list)
    
    return grocery_list


@router.delete("/{list_id}")
def delete_grocery_list(
    list_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a grocery list and all its associated items.
    
    Args:
        list_id: ID of the grocery list
        
    Returns:
        Success message
        
    Raises:
        404: If grocery list not found
    """
    grocery_list = db.query(GroceryList).filter(GroceryList.id == list_id).first()
    
    if not grocery_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Grocery list with id {list_id} not found"
        )
    
    # First, delete all associated grocery items
    db.query(GroceryItem).filter(GroceryItem.list_id == list_id).delete()
    
    # Then delete the grocery list
    db.delete(grocery_list)
    db.commit()
    
    return {"message": f"Grocery list {list_id} deleted successfully"}


@router.post("/{list_id}/items", response_model=GroceryItemResponse, status_code=status.HTTP_201_CREATED)
def create_grocery_item(
    list_id: int,
    item_data: GroceryItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add an item to a grocery list.
    
    Args:
        list_id: ID of the grocery list
        item_data: Grocery item data
        
    Returns:
        Created grocery item
        
    Raises:
        404: If grocery list not found
    """
    # Verify grocery list exists
    grocery_list = db.query(GroceryList).filter(GroceryList.id == list_id).first()
    if not grocery_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Grocery list with id {list_id} not found"
        )
    
    # Check permission: user must be a household member
    require_household_member(db, grocery_list.household_id, current_user)
    
    grocery_item = GroceryItem(
        list_id=list_id,
        name=item_data.name,
        quantity=item_data.quantity,
        category=item_data.category,
        meal_type=item_data.meal_type,
        notes=item_data.notes,
        checked=item_data.checked
    )
    
    db.add(grocery_item)
    db.commit()
    db.refresh(grocery_item)
    
    return grocery_item


@router.put("/{list_id}/items/{item_id}", response_model=GroceryItemResponse)
def update_grocery_item(
    list_id: int,
    item_id: int,
    item_data: GroceryItemUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a grocery item.
    
    Args:
        list_id: ID of the grocery list
        item_id: ID of the grocery item
        item_data: Updated grocery item data
        
    Returns:
        Updated grocery item
        
    Raises:
        404: If grocery list or item not found
    """
    # Verify grocery list exists
    grocery_list = db.query(GroceryList).filter(GroceryList.id == list_id).first()
    if not grocery_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Grocery list with id {list_id} not found"
        )
    
    # Get item and verify it belongs to the list
    grocery_item = db.query(GroceryItem).filter(
        GroceryItem.id == item_id,
        GroceryItem.list_id == list_id
    ).first()
    
    if not grocery_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Grocery item with id {item_id} not found in list {list_id}"
        )
    
    # Update fields
    if item_data.name is not None:
        grocery_item.name = item_data.name
    if item_data.quantity is not None:
        grocery_item.quantity = item_data.quantity
    if item_data.category is not None:
        grocery_item.category = item_data.category
    if item_data.meal_type is not None:
        grocery_item.meal_type = item_data.meal_type
    if item_data.notes is not None:
        grocery_item.notes = item_data.notes
    if item_data.checked is not None:
        grocery_item.checked = item_data.checked
    
    db.commit()
    db.refresh(grocery_item)
    
    return grocery_item


@router.delete("/{list_id}/items/{item_id}")
def delete_grocery_item(
    list_id: int,
    item_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a grocery item.
    
    Args:
        list_id: ID of the grocery list
        item_id: ID of the grocery item
        
    Returns:
        Success message
        
    Raises:
        404: If grocery list or item not found
    """
    # Verify grocery list exists
    grocery_list = db.query(GroceryList).filter(GroceryList.id == list_id).first()
    if not grocery_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Grocery list with id {list_id} not found"
        )
    
    # Get item and verify it belongs to the list
    grocery_item = db.query(GroceryItem).filter(
        GroceryItem.id == item_id,
        GroceryItem.list_id == list_id
    ).first()
    
    if not grocery_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Grocery item with id {item_id} not found in list {list_id}"
        )
    
    db.delete(grocery_item)
    db.commit()
    
    return {"message": f"Grocery item {item_id} deleted successfully"}


@router.get("/{list_id}/items", response_model=List[GroceryItemResponse])
def get_grocery_items(
    list_id: int,
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db)
):
    """
    Get all items in a grocery list, optionally filtered by category.
    
    Args:
        list_id: ID of the grocery list
        category: Optional category filter
        
    Returns:
        List of grocery items
        
    Raises:
        404: If grocery list not found
    """
    # Verify grocery list exists
    grocery_list = db.query(GroceryList).filter(GroceryList.id == list_id).first()
    if not grocery_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Grocery list with id {list_id} not found"
        )
    
    # Build query
    query = db.query(GroceryItem).filter(GroceryItem.list_id == list_id)
    
    # Apply category filter if provided
    if category:
        query = query.filter(GroceryItem.category == category)
    
    items = query.all()
    return items

