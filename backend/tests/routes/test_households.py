"""Tests for household management routes."""

import pytest
import jwt
from datetime import datetime
from fastapi.testclient import TestClient

from models.user import User
from models.household import Household
from models.household_member import HouseholdMember


@pytest.fixture
def auth_headers(sample_user):
    """Create authentication headers for testing."""
    # Create a mock JWT token
    token_payload = {
        "sub": sample_user.clerk_user_id,
        "email": sample_user.email,
    }
    token = jwt.encode(token_payload, "secret", algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_user_2(db_session):
    """Create a second sample user for testing."""
    user = User(
        clerk_user_id="test_clerk_user_456",
        email="user2@example.com",
        name="Test User 2"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def sample_household_with_members(db_session, sample_user, sample_user_2, sample_household):
    """Create a household with multiple members for testing."""
    # Check if members already exist before adding
    existing_member1 = db_session.query(HouseholdMember).filter(
        HouseholdMember.household_id == sample_household.id,
        HouseholdMember.user_id == sample_user.id
    ).first()
    
    if not existing_member1:
        member1 = HouseholdMember(
            household_id=sample_household.id,
            user_id=sample_user.id,
            role="admin"
        )
        db_session.add(member1)
    
    existing_member2 = db_session.query(HouseholdMember).filter(
        HouseholdMember.household_id == sample_household.id,
        HouseholdMember.user_id == sample_user_2.id
    ).first()
    
    if not existing_member2:
        member2 = HouseholdMember(
            household_id=sample_household.id,
            user_id=sample_user_2.id,
            role="member"
        )
        db_session.add(member2)
    
    db_session.commit()
    
    return sample_household


@pytest.fixture
def sample_household_2(db_session, sample_user_2):
    """Create a second household for testing."""
    household = Household(
        name="Second Household",
        created_by=sample_user_2.id
    )
    db_session.add(household)
    db_session.commit()
    db_session.refresh(household)
    
    # Add creator as admin
    member = HouseholdMember(
        household_id=household.id,
        user_id=sample_user_2.id,
        role="admin"
    )
    db_session.add(member)
    db_session.commit()
    
    return household


class TestGetHouseholds:
    """Tests for GET /api/households endpoint."""
    
    def test_get_households_success(
        self, client, db_session, sample_user, sample_household_with_members, auth_headers
    ):
        """Test retrieving all households for authenticated user."""
        response = client.get("/api/households", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["name"] == "Test Household"
        assert data[0]["id"] == sample_household_with_members.id
        assert "created_by" in data[0]
        assert "created_at" in data[0]
    
    def test_get_households_multiple(
        self, client, db_session, sample_user, sample_user_2, sample_household_with_members, auth_headers
    ):
        """Test retrieving multiple households for user."""
        # Create another household where sample_user is a member
        household2 = Household(
            name="Family Household",
            created_by=sample_user_2.id
        )
        db_session.add(household2)
        db_session.commit()
        db_session.refresh(household2)
        
        member = HouseholdMember(
            household_id=household2.id,
            user_id=sample_user.id,
            role="member"
        )
        db_session.add(member)
        db_session.commit()
        
        response = client.get("/api/households", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2
        household_names = [h["name"] for h in data]
        assert "Test Household" in household_names
        assert "Family Household" in household_names
    
    def test_get_households_empty(self, client, db_session, sample_user, auth_headers):
        """Test retrieving households when user has none."""
        response = client.get("/api/households", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_get_households_unauthorized(self, client):
        """Test retrieving households without authentication."""
        response = client.get("/api/households")
        
        assert response.status_code == 401


class TestGetHouseholdById:
    """Tests for GET /api/households/{household_id} endpoint."""
    
    def test_get_household_success(
        self, client, db_session, sample_user, sample_household_with_members, auth_headers
    ):
        """Test retrieving a specific household with members."""
        response = client.get(
            f"/api/households/{sample_household_with_members.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_household_with_members.id
        assert data["name"] == "Test Household"
        assert "members" in data
        assert len(data["members"]) == 2
        
        # Check member details
        member_roles = [m["role"] for m in data["members"]]
        assert "admin" in member_roles
        assert "member" in member_roles
    
    def test_get_household_not_found(self, client, auth_headers):
        """Test retrieving a non-existent household."""
        response = client.get("/api/households/99999", headers=auth_headers)
        
        assert response.status_code == 404
    
    def test_get_household_forbidden(
        self, client, db_session, sample_user_2, sample_household_2, auth_headers
    ):
        """Test retrieving a household user is not a member of."""
        response = client.get(
            f"/api/households/{sample_household_2.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 403
    
    def test_get_household_unauthorized(self, client, sample_household):
        """Test retrieving household without authentication."""
        response = client.get(f"/api/households/{sample_household.id}")
        
        assert response.status_code == 401


class TestCreateHousehold:
    """Tests for POST /api/households endpoint."""
    
    def test_create_household_success(self, client, sample_user, auth_headers):
        """Test creating a new household."""
        household_data = {
            "name": "My New Household"
        }
        
        response = client.post(
            "/api/households",
            json=household_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "My New Household"
        assert data["created_by"] == sample_user.id
        assert "id" in data
        assert "created_at" in data
    
    def test_create_household_with_member(
        self, client, db_session, sample_user, auth_headers
    ):
        """Test that creator is automatically added as admin member."""
        household_data = {
            "name": "Auto-Member Household"
        }
        
        response = client.post(
            "/api/households",
            json=household_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        household_id = data["id"]
        
        # Check that creator is a member with admin role
        member = db_session.query(HouseholdMember).filter(
            HouseholdMember.household_id == household_id,
            HouseholdMember.user_id == sample_user.id
        ).first()
        
        assert member is not None
        assert member.role == "admin"
    
    def test_create_household_invalid_data(self, client, auth_headers):
        """Test creating household with invalid data."""
        household_data = {}  # Missing required 'name' field
        
        response = client.post(
            "/api/households",
            json=household_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422
    
    def test_create_household_unauthorized(self, client):
        """Test creating household without authentication."""
        household_data = {"name": "Test"}
        
        response = client.post("/api/households", json=household_data)
        
        assert response.status_code == 401


class TestUpdateHousehold:
    """Tests for PUT /api/households/{household_id} endpoint."""
    
    def test_update_household_success(
        self, client, db_session, sample_user, sample_household_with_members, auth_headers
    ):
        """Test updating household name as admin."""
        update_data = {
            "name": "Updated Household Name"
        }
        
        response = client.put(
            f"/api/households/{sample_household_with_members.id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Household Name"
        assert data["id"] == sample_household_with_members.id
    
    def test_update_household_not_found(self, client, auth_headers):
        """Test updating a non-existent household."""
        update_data = {"name": "New Name"}
        
        response = client.put(
            "/api/households/99999",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    def test_update_household_forbidden_non_admin(
        self, client, db_session, sample_user, sample_user_2, sample_household_with_members, auth_headers
    ):
        """Test that non-admin members cannot update household."""
        # Change sample_user to member role (not admin)
        member = db_session.query(HouseholdMember).filter(
            HouseholdMember.household_id == sample_household_with_members.id,
            HouseholdMember.user_id == sample_user.id
        ).first()
        member.role = "member"
        db_session.commit()
        
        update_data = {"name": "New Name"}
        
        response = client.put(
            f"/api/households/{sample_household_with_members.id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 403
    
    def test_update_household_unauthorized(self, client, sample_household):
        """Test updating household without authentication."""
        update_data = {"name": "New Name"}
        
        response = client.put(
            f"/api/households/{sample_household.id}",
            json=update_data
        )
        
        assert response.status_code == 401


class TestDeleteHousehold:
    """Tests for DELETE /api/households/{household_id} endpoint."""
    
    def test_delete_household_success(
        self, client, db_session, sample_user, sample_household_with_members, auth_headers
    ):
        """Test deleting household as admin."""
        household_id = sample_household_with_members.id
        
        response = client.delete(
            f"/api/households/{household_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
        
        # Verify household is deleted
        household = db_session.query(Household).filter(
            Household.id == household_id
        ).first()
        assert household is None
    
    def test_delete_household_not_found(self, client, auth_headers):
        """Test deleting a non-existent household."""
        response = client.delete("/api/households/99999", headers=auth_headers)
        
        assert response.status_code == 404
    
    def test_delete_household_forbidden_non_admin(
        self, client, db_session, sample_user, sample_household_with_members, auth_headers
    ):
        """Test that non-admin members cannot delete household."""
        # Change sample_user to member role (not admin)
        member = db_session.query(HouseholdMember).filter(
            HouseholdMember.household_id == sample_household_with_members.id,
            HouseholdMember.user_id == sample_user.id
        ).first()
        member.role = "member"
        db_session.commit()
        
        response = client.delete(
            f"/api/households/{sample_household_with_members.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 403
    
    def test_delete_household_unauthorized(self, client, sample_household):
        """Test deleting household without authentication."""
        response = client.delete(f"/api/households/{sample_household.id}")
        
        assert response.status_code == 401


class TestInviteMember:
    """Tests for POST /api/households/{household_id}/members endpoint."""
    
    def test_invite_member_success(
        self, client, db_session, sample_user, sample_user_2, sample_household_with_members, auth_headers
    ):
        """Test inviting a member to household as admin."""
        # Create a third user to invite
        user3 = User(
            clerk_user_id="test_clerk_user_789",
            email="user3@example.com",
            name="Test User 3"
        )
        db_session.add(user3)
        db_session.commit()
        db_session.refresh(user3)
        
        invite_data = {
            "email": "user3@example.com",
            "role": "member"
        }
        
        response = client.post(
            f"/api/households/{sample_household_with_members.id}/members",
            json=invite_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["user_id"] == user3.id
        assert data["role"] == "member"
        assert data["household_id"] == sample_household_with_members.id
    
    def test_invite_member_not_found_user(
        self, client, sample_household_with_members, auth_headers
    ):
        """Test inviting a user that doesn't exist."""
        invite_data = {
            "email": "nonexistent@example.com",
            "role": "member"
        }
        
        response = client.post(
            f"/api/households/{sample_household_with_members.id}/members",
            json=invite_data,
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    def test_invite_member_already_member(
        self, client, sample_user_2, sample_household_with_members, auth_headers
    ):
        """Test inviting a user who is already a member."""
        invite_data = {
            "email": sample_user_2.email,
            "role": "member"
        }
        
        response = client.post(
            f"/api/households/{sample_household_with_members.id}/members",
            json=invite_data,
            headers=auth_headers
        )
        
        assert response.status_code == 400
    
    def test_invite_member_forbidden_non_admin(
        self, client, db_session, sample_user, sample_household_with_members, auth_headers
    ):
        """Test that non-admin members cannot invite others."""
        # Change sample_user to member role (not admin)
        member = db_session.query(HouseholdMember).filter(
            HouseholdMember.household_id == sample_household_with_members.id,
            HouseholdMember.user_id == sample_user.id
        ).first()
        member.role = "member"
        db_session.commit()
        
        invite_data = {
            "email": "newuser@example.com",
            "role": "member"
        }
        
        response = client.post(
            f"/api/households/{sample_household_with_members.id}/members",
            json=invite_data,
            headers=auth_headers
        )
        
        assert response.status_code == 403


class TestUpdateMemberRole:
    """Tests for PUT /api/households/{household_id}/members/{user_id} endpoint."""
    
    def test_update_member_role_success(
        self, client, db_session, sample_user, sample_user_2, sample_household_with_members, auth_headers
    ):
        """Test updating a member's role as admin."""
        role_update = {
            "role": "admin"
        }
        
        response = client.put(
            f"/api/households/{sample_household_with_members.id}/members/{sample_user_2.id}",
            json=role_update,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "admin"
        assert data["user_id"] == sample_user_2.id
    
    def test_update_member_role_not_found(
        self, client, sample_household_with_members, auth_headers
    ):
        """Test updating role for non-existent member."""
        role_update = {"role": "admin"}
        
        response = client.put(
            f"/api/households/{sample_household_with_members.id}/members/99999",
            json=role_update,
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    def test_update_member_role_forbidden_non_admin(
        self, client, db_session, sample_user, sample_user_2, sample_household_with_members, auth_headers
    ):
        """Test that non-admin members cannot update roles."""
        # Change sample_user to member role (not admin)
        member = db_session.query(HouseholdMember).filter(
            HouseholdMember.household_id == sample_household_with_members.id,
            HouseholdMember.user_id == sample_user.id
        ).first()
        member.role = "member"
        db_session.commit()
        
        role_update = {"role": "admin"}
        
        response = client.put(
            f"/api/households/{sample_household_with_members.id}/members/{sample_user_2.id}",
            json=role_update,
            headers=auth_headers
        )
        
        assert response.status_code == 403


class TestRemoveMember:
    """Tests for DELETE /api/households/{household_id}/members/{user_id} endpoint."""
    
    def test_remove_member_success(
        self, client, db_session, sample_user, sample_user_2, sample_household_with_members, auth_headers
    ):
        """Test removing a member from household as admin."""
        response = client.delete(
            f"/api/households/{sample_household_with_members.id}/members/{sample_user_2.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
        
        # Verify member is removed
        member = db_session.query(HouseholdMember).filter(
            HouseholdMember.household_id == sample_household_with_members.id,
            HouseholdMember.user_id == sample_user_2.id
        ).first()
        assert member is None
    
    def test_remove_member_not_found(
        self, client, sample_household_with_members, auth_headers
    ):
        """Test removing non-existent member."""
        response = client.delete(
            f"/api/households/{sample_household_with_members.id}/members/99999",
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    def test_remove_member_forbidden_non_admin(
        self, client, db_session, sample_user, sample_user_2, sample_household_with_members, auth_headers
    ):
        """Test that non-admin members cannot remove others."""
        # Change sample_user to member role (not admin)
        member = db_session.query(HouseholdMember).filter(
            HouseholdMember.household_id == sample_household_with_members.id,
            HouseholdMember.user_id == sample_user.id
        ).first()
        member.role = "member"
        db_session.commit()
        
        response = client.delete(
            f"/api/households/{sample_household_with_members.id}/members/{sample_user_2.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 403
    
    def test_remove_self_allowed(
        self, client, db_session, sample_user, sample_household_with_members, auth_headers
    ):
        """Test that members can remove themselves."""
        # Change sample_user to member role (not admin)
        member = db_session.query(HouseholdMember).filter(
            HouseholdMember.household_id == sample_household_with_members.id,
            HouseholdMember.user_id == sample_user.id
        ).first()
        member.role = "member"
        db_session.commit()
        
        response = client.delete(
            f"/api/households/{sample_household_with_members.id}/members/{sample_user.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204


class TestGetSharedLists:
    """Tests for GET /api/households/{household_id}/shared-lists endpoint."""
    
    def test_get_shared_lists_success(
        self, client, db_session, sample_user, sample_household_with_members, sample_grocery_list, auth_headers
    ):
        """Test retrieving shared grocery lists for household."""
        response = client.get(
            f"/api/households/{sample_household_with_members.id}/shared-lists",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["household_id"] == sample_household_with_members.id
        assert data["household_name"] == "Test Household"
        assert "lists" in data
        assert len(data["lists"]) == 1
        assert data["lists"][0]["name"] == "Weekly Groceries"
    
    def test_get_shared_lists_empty(
        self, client, sample_household_with_members, auth_headers
    ):
        """Test retrieving shared lists when household has no lists."""
        response = client.get(
            f"/api/households/{sample_household_with_members.id}/shared-lists",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["household_id"] == sample_household_with_members.id
        assert len(data["lists"]) == 0
    
    def test_get_shared_lists_not_found(self, client, auth_headers):
        """Test retrieving shared lists for non-existent household."""
        response = client.get(
            "/api/households/99999/shared-lists",
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    def test_get_shared_lists_forbidden(
        self, client, sample_household_2, auth_headers
    ):
        """Test retrieving shared lists for household user is not member of."""
        response = client.get(
            f"/api/households/{sample_household_2.id}/shared-lists",
            headers=auth_headers
        )
        
        assert response.status_code == 403

