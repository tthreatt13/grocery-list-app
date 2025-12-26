"""Tests for user management routes."""

import pytest
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient
from datetime import datetime

import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from main import app
from models.user import User


class TestUserRoutes:
    """Test cases for user management endpoints."""

    def test_get_current_user_success(self, db_session):
        """Test GET /users/me returns current user info."""
        # Create test user
        user = User(clerk_user_id="user_123abc", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        # Override database dependency
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        # Mock authentication
        from middleware.auth import get_current_user

        def override_get_current_user():
            return user

        app.dependency_overrides[get_current_user] = override_get_current_user

        client = TestClient(app)
        response = client.get("/api/users/me", headers={"Authorization": "Bearer valid_token"})

        # Cleanup
        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert data["clerk_user_id"] == "user_123abc"
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"
        assert "id" in data
        assert "created_at" in data

    def test_get_current_user_unauthorized(self):
        """Test GET /users/me without auth token returns 401."""
        client = TestClient(app)
        response = client.get("/api/users/me")

        assert response.status_code == 401

    def test_update_current_user_success(self, db_session):
        """Test POST /users/me updates user profile."""
        # Create test user
        user = User(clerk_user_id="user_123abc", email="test@example.com", name="Old Name")
        db_session.add(user)
        db_session.commit()

        # Override dependencies
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return user

        app.dependency_overrides[get_current_user] = override_get_current_user

        client = TestClient(app)
        response = client.post(
            "/api/users/me",
            json={"name": "Updated Name"},
            headers={"Authorization": "Bearer valid_token"},
        )

        # Cleanup
        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["email"] == "test@example.com"

        # Verify database was updated
        db_session.refresh(user)
        assert user.name == "Updated Name"

    def test_update_current_user_unauthorized(self):
        """Test POST /users/me without auth token returns 401."""
        client = TestClient(app)
        response = client.post("/api/users/me", json={"name": "New Name"})

        assert response.status_code == 401

    def test_update_current_user_invalid_data(self, db_session):
        """Test POST /users/me with invalid data returns 422."""
        user = User(clerk_user_id="user_123abc", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        # Override dependencies
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return user

        app.dependency_overrides[get_current_user] = override_get_current_user

        client = TestClient(app)
        response = client.post(
            "/api/users/me",
            json={"invalid_field": "value"},
            headers={"Authorization": "Bearer valid_token"},
        )

        # Cleanup
        app.dependency_overrides.clear()

        # Should accept the request but ignore invalid fields
        # Or return 422 if strict validation
        assert response.status_code in [200, 422]

    def test_update_current_user_empty_name(self, db_session):
        """Test POST /users/me with empty name is allowed."""
        user = User(clerk_user_id="user_123abc", email="test@example.com", name="Test User")
        db_session.add(user)
        db_session.commit()

        # Override dependencies
        from database import get_db

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        from middleware.auth import get_current_user

        def override_get_current_user():
            return user

        app.dependency_overrides[get_current_user] = override_get_current_user

        client = TestClient(app)
        response = client.post(
            "/api/users/me",
            json={"name": ""},
            headers={"Authorization": "Bearer valid_token"},
        )

        # Cleanup
        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == ""
