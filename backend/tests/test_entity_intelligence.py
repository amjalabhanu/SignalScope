TESLA_ID = "78431d11-4691-408d-aa42-18fb93d6073f"
ROBLOX_ID = "e445b810-7a36-47a2-860c-b057736ad1c9"


def test_entity_intelligence_returns_context(client, test_user):
    response = client.get(
        f"/entities/{TESLA_ID}/intelligence",
        headers=test_user["headers"],
    )

    assert response.status_code == 200

    data = response.json()

    assert data["entity"]["id"] == TESLA_ID
    assert data["entity"]["name"] == "Tesla"

    assert "events" in data
    assert "related_entities" in data

    assert data["events"]["page"] == 1
    assert data["events"]["limit"] == 20
    assert data["events"]["total"] >= 1

    related_ids = [
        entity["id"]
        for entity in data["related_entities"]
    ]

    assert ROBLOX_ID in related_ids