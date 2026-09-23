TESLA_ID = "78431d11-4691-408d-aa42-18fb93d6073f"


def test_entity_event_history(client, test_user):
    response = client.get(
        f"/entities/{TESLA_ID}/events",
        headers=test_user["headers"],
    )

    assert response.status_code == 200

    data = response.json()

    assert data["page"] == 1
    assert data["limit"] == 20
    assert data["total"] >= 1
    assert isinstance(data["items"], list)

    event = data["items"][0]

    assert "id" in event
    assert "event_type" in event
    assert "entity" in event
    assert "evidence" in event
def test_entity_event_filtering(client, test_user):
    response = client.get(
        f"/entities/{TESLA_ID}/events",
        params={"event_type": "product_announcement"},
        headers=test_user["headers"],
    )

    assert response.status_code == 200

    data = response.json()

    for event in data["items"]:
        assert event["event_type"] == "product_announcement"


def test_entity_event_pagination(client, test_user):
    response = client.get(
        f"/entities/{TESLA_ID}/events",
        params={"page": 1, "limit": 1},
        headers=test_user["headers"],
    )

    assert response.status_code == 200

    data = response.json()

    assert data["page"] == 1
    assert data["limit"] == 1
    assert len(data["items"]) <= 1
    assert data["total"] >= 1