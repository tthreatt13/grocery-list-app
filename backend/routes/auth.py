"""Authentication routes for Clerk webhook integration."""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Dict, Any

from database import get_db
from models.user import User
from schemas.user import ClerkWebhookEvent

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/webhook")
async def clerk_webhook(
    request: Request,
    event: ClerkWebhookEvent,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Webhook endpoint for Clerk user events.
    
    Handles user.created, user.updated, and user.deleted events from Clerk.
    
    Args:
        request: FastAPI request object
        event: Clerk webhook event payload
        db: Database session
    
    Returns:
        dict: Success response
    
    Raises:
        HTTPException: If webhook processing fails
    """
    # Note: In production, you should verify the webhook signature
    # using the svix library to ensure the webhook is from Clerk
    # See: https://clerk.com/docs/integrations/webhooks/overview
    
    event_type = event.type
    event_data = event.data
    
    try:
        if event_type == "user.created":
            # Create new user in database
            clerk_user_id = event_data.get("id")
            email_addresses = event_data.get("email_addresses", [])
            email = email_addresses[0].get("email_address") if email_addresses else None
            
            if not email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email address is required"
                )
            
            # Get user's name
            first_name = event_data.get("first_name", "")
            last_name = event_data.get("last_name", "")
            name = f"{first_name} {last_name}".strip() or None
            
            # Check if user already exists
            existing_user = db.query(User).filter(
                User.clerk_user_id == clerk_user_id
            ).first()
            
            if existing_user:
                return {"message": "User already exists", "user_id": existing_user.id}
            
            # Create new user
            new_user = User(
                clerk_user_id=clerk_user_id,
                email=email,
                name=name
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            
            return {
                "message": "User created successfully",
                "user_id": new_user.id
            }
        
        elif event_type == "user.updated":
            # Update existing user
            clerk_user_id = event_data.get("id")
            
            user = db.query(User).filter(
                User.clerk_user_id == clerk_user_id
            ).first()
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User not found: {clerk_user_id}"
                )
            
            # Update email if changed
            email_addresses = event_data.get("email_addresses", [])
            if email_addresses:
                email = email_addresses[0].get("email_address")
                if email:
                    user.email = email
            
            # Update name if changed
            first_name = event_data.get("first_name", "")
            last_name = event_data.get("last_name", "")
            name = f"{first_name} {last_name}".strip() or None
            if name:
                user.name = name
            
            db.commit()
            db.refresh(user)
            
            return {
                "message": "User updated successfully",
                "user_id": user.id
            }
        
        elif event_type == "user.deleted":
            # Delete user from database
            clerk_user_id = event_data.get("id")
            
            user = db.query(User).filter(
                User.clerk_user_id == clerk_user_id
            ).first()
            
            if user:
                db.delete(user)
                db.commit()
                return {
                    "message": "User deleted successfully",
                    "user_id": user.id
                }
            else:
                return {
                    "message": "User not found (already deleted or never existed)"
                }
        
        else:
            # Unsupported event type - log and return success
            # (We don't want to fail webhooks for events we don't handle)
            return {
                "message": f"Event type '{event_type}' not handled",
                "status": "ignored"
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process webhook: {str(e)}"
        )





