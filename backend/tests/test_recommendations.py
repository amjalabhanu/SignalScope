TESLA_ID = "78431d11-4691-408d-aa42-18fb93d6073f"
ROBLOX_ID = "e445b810-7a36-47a2-860c-b057736ad1c9"


def test_recommendations_from_shared_document(client, test_user):
    subscribe_response = client.post(
        f"/subscriptions/{TESLA_ID}",
        headers=test_user["headers"],
    )

    assert subscribe_response.status_code in (200, 201)

    response = client.get(
        "/recommendations",
        headers=test_user["headers"],
    )

    assert response.status_code == 200

    data = response.json()

    assert data["page"] == 1
    assert data["limit"] == 20
    assert data["total"] >= 1

    recommended_ids = [
        item["entity"]["id"]
        for item in data["items"]
    ]

    assert ROBLOX_ID in recommended_ids

    roblox_recommendation = next(
        item
        for item in data["items"]
        if item["entity"]["id"] == ROBLOX_ID
    )

    assert (
        roblox_recommendation["reason"]
        == "Shares documents with entities you follow"
    )