import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def test_user(client):
    email = f"test-{uuid.uuid4()}@example.com"
    password = "TestPassword123!"

    response = client.post(
        "/auth/register",
        json={
            "name": "Recommendation Test User",
            "email": email,
            "password": password,
        },
    )

    assert response.status_code == 201

    login_response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    return {
        "email": email,
        "password": password,
        "headers": {
            "Authorization": f"Bearer {token}",
        },
    }
@pytest.fixture
def db_session():
    session = SessionLocal()

    try:
        yield session
    finally:
        session.rollback()
        session.close()