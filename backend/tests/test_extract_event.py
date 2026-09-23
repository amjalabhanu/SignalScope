import json

import pytest

from app.services import extract_event as extract_event_module


def test_extract_event_returns_false_for_non_launch(monkeypatch):
    class FakeResponse:
        text = json.dumps({"is_product_launch": False})

    def fake_generate_content(*args, **kwargs):
        return FakeResponse()

    monkeypatch.setattr(
        extract_event_module.client.models,
        "generate_content",
        fake_generate_content,
    )

    result = extract_event_module.extract_event(
        document_text="A general technology article.",
        linked_entities=[
            {"name": "Product A", "type": "product"},
        ],
    )

    assert result == {"is_product_launch": False}


def test_extract_event_rejects_unknown_product(monkeypatch):
    class FakeResponse:
        text = json.dumps(
            {
                "is_product_launch": True,
                "product_entity_name": "Unknown Product",
                "summary": "A new product was launched.",
            }
        )

    def fake_generate_content(*args, **kwargs):
        return FakeResponse()

    monkeypatch.setattr(
        extract_event_module.client.models,
        "generate_content",
        fake_generate_content,
    )

    result = extract_event_module.extract_event(
        document_text="A product launch article.",
        linked_entities=[
            {"name": "Product A", "type": "product"},
        ],
    )

    assert result is None


def test_extract_event_rejects_invalid_summary(monkeypatch):
    class FakeResponse:
        text = json.dumps(
            {
                "is_product_launch": True,
                "product_entity_name": "Product A",
                "summary": "   ",
            }
        )

    def fake_generate_content(*args, **kwargs):
        return FakeResponse()

    monkeypatch.setattr(
        extract_event_module.client.models,
        "generate_content",
        fake_generate_content,
    )

    result = extract_event_module.extract_event(
        document_text="A product launch article.",
        linked_entities=[
            {"name": "Product A", "type": "product"},
        ],
    )

    assert result is None
def test_extract_event_rejects_malformed_json(monkeypatch):
    class FakeResponse:
        text = "not valid json"

    def fake_generate_content(*args, **kwargs):
        return FakeResponse()

    monkeypatch.setattr(
        extract_event_module.client.models,
        "generate_content",
        fake_generate_content,
    )

    with pytest.raises(json.JSONDecodeError):
        extract_event_module.extract_event(
            document_text="An article.",
            linked_entities=[
                {"name": "Product A", "type": "product"},
            ],
        )