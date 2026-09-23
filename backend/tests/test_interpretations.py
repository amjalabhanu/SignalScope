from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_interpretation_requires_authentication():
    event_id = uuid4()

    response = client.post(
        f"/events/{event_id}/interpretation"
    )

    assert response.status_code == 401