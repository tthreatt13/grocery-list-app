#!/usr/bin/env python3
"""Script to generate a test JWT token for API testing.

This script creates a test user (if needed) and generates a JWT token
that can be used to authenticate API requests during development/testing.

Usage:
    python scripts/generate_test_token.py
    python scripts/generate_test_token.py --email test@example.com
    python scripts/generate_test_token.py --clerk-id test_user_123
"""

import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

import jwt
import argparse
import time
from sqlalchemy.orm import Session

from database import SessionLocal
from models.user import User


def create_test_user(db: Session, clerk_user_id: str, email: str, name: str) -> User:
    """Create a test user if it doesn't exist."""
    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()

    if not user:
        user = User(clerk_user_id=clerk_user_id, email=email, name=name)
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"✓ Created new user: {user.email} (ID: {user.id})")
    else:
        print(f"✓ Using existing user: {user.email} (ID: {user.id})")

    return user


def generate_token(clerk_user_id: str, email: str) -> str:
    """Generate a JWT token for testing."""
    # Create token payload matching what Clerk would send
    current_time = int(time.time())
    token_payload = {
        "sub": clerk_user_id,  # Subject (user ID)
        "email": email,
        # Add other standard JWT claims
        "iat": current_time,  # Issued at
        "exp": current_time + (365 * 24 * 60 * 60),  # Expires in 1 year
    }

    # Generate token (signature verification is disabled in auth middleware for testing)
    # Using HS256 algorithm for simplicity
    token = jwt.encode(token_payload, "secret", algorithm="HS256")

    return token


def main():
    parser = argparse.ArgumentParser(
        description="Generate a test JWT token for API testing"
    )
    parser.add_argument(
        "--email",
        type=str,
        default="test@example.com",
        help="Email address for the test user (default: test@example.com)",
    )
    parser.add_argument(
        "--clerk-id",
        type=str,
        default="test_clerk_user_123",
        help="Clerk user ID for the test user (default: test_clerk_user_123)",
    )
    parser.add_argument(
        "--name",
        type=str,
        default="Test User",
        help="Name for the test user (default: Test User)",
    )

    args = parser.parse_args()

    # Create database session
    db: Session = SessionLocal()

    try:
        # Create or get test user
        user = create_test_user(db, args.clerk_id, args.email, args.name)

        # Generate token
        token = generate_token(user.clerk_user_id, user.email)

        # Print results
        print("\n" + "=" * 60)
        print("Test Token Generated Successfully!")
        print("=" * 60)
        print(f"\nUser ID: {user.id}")
        print(f"Email: {user.email}")
        print(f"Clerk User ID: {user.clerk_user_id}")
        print("\n" + "-" * 60)
        print("TOKEN (use this in Authorization header):")
        print("-" * 60)
        print(token)
        print("\n" + "-" * 60)
        print("Example cURL command:")
        print("-" * 60)
        print(f'curl -X GET "http://localhost:8000/api/weather/forecast/80202" \\')
        print(f'  -H "Authorization: Bearer {token}"')
        print("\n" + "-" * 60)
        print("Example Python requests:")
        print("-" * 60)
        print(f'headers = {{"Authorization": "Bearer {token}"}}')
        print(
            'response = requests.get("http://localhost:8000/api/weather/forecast/80202", headers=headers)'
        )
        print("\n" + "=" * 60)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
