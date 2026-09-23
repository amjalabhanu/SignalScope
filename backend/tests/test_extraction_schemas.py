import pytest
from pydantic import ValidationError

from app.schemas.extraction import (
    EntityCandidate,
    EventCandidate,
    ExtractionResult,
)


def test_entity_candidate_accepts_valid_entity():
    candidate = EntityCandidate(
        name=" Nike ",
        type="company",
    )

    assert candidate.name == "Nike"
    assert candidate.type == "company"


def test_entity_candidate_rejects_unsupported_type():
    with pytest.raises(ValidationError):
        EntityCandidate(
            name="Nike",
            type="person",
        )


def test_event_candidate_normalizes_event_type():
    candidate = EventCandidate(
        event_type="Product Launch",
        primary_entity_name="Pegasus 42",
        summary="Nike launched Pegasus 42.",
    )

    assert candidate.event_type == "product_launch"


def test_event_candidate_rejects_unsupported_event_type():
    with pytest.raises(ValidationError):
        EventCandidate(
            event_type="stock_prediction",
            primary_entity_name="Nike",
            summary="Prediction generated.",
        )


def test_event_candidate_supports_attributes():
    candidate = EventCandidate(
        event_type="price_change",
        primary_entity_name="Nike",
        summary="Price changed.",
        attributes={
            "old_price": 100,
            "new_price": 120,
        },
    )

    assert candidate.attributes["old_price"] == 100
    assert candidate.attributes["new_price"] == 120


def test_extraction_result_defaults_to_empty_events():
    result = ExtractionResult()

    assert result.events == []


def test_event_candidate_rejects_empty_summary():
    with pytest.raises(ValidationError):
        EventCandidate(
            event_type="partnership",
            primary_entity_name="Nike",
            summary="   ",
        )