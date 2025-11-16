"""Test cases for main FastAPI application."""

import pytest
from fastapi.testclient import TestClient


def test_health_check():
    """Test that the health check endpoint returns 200 OK."""
    from main import app
    
    client = TestClient(app)
    response = client.get("/health")
    
    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "grocery-app-api"
    }


def test_root_endpoint():
    """Test that the root endpoint returns welcome message."""
    from main import app
    
    client = TestClient(app)
    response = client.get("/")
    
    assert response.status_code == 200
    assert "message" in response.json()
    assert "Grocery App API" in response.json()["message"]

