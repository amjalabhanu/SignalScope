from datetime import datetime, timezone
from unittest.mock import patch
from uuid import uuid4

from app.models.event_interpretation import EventInterpretation


EVENT_ID = "f5dba36f-916d-467e-88ee-50d52451bb64"


@patch("app.routers.interpretations.generate_event_interpretation")
@patch("sqlalchemy.orm.Session.refresh")
def test_create_event_interpretation_endpoint(
    mock_refresh,
    mock_generate,
    client,
    test_user,
):
    interpretation = EventInterpretation(
        id=uuid4(),
        event_id=EVENT_ID,
        status="generated",
        significance="The event indicates a product development.",
        why_it_matters="It may affect users.",
        impact_areas=[],
        known_facts=["A documented event occurred."],
        qualified_implications=[],
        uncertainties=["Long-term effects are unknown."],
        generated_at=datetime.now(timezone.utc),
        prompt_version="v1",
        model_version="gemini-2.5-flash",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    mock_generate.return_value = interpretation

    response = client.post(
        f"/events/{EVENT_ID}/interpretation",
        headers=test_user["headers"],
    )

    assert response.status_code == 200

    data = response.json()

    assert data["event_id"] == EVENT_ID
    assert data["status"] == "generated"
    assert data["significance"] is not None

    mock_generate.assert_called_once()
    mock_refresh.assert_called_once()