from app.schemas.extraction import EntityCandidate, EventCandidate, ExtractionResult
from app.services.extraction_result import has_usable_extraction


def test_empty_extraction_is_not_usable():
    result = ExtractionResult()

    assert has_usable_extraction(result) is False


def test_entity_extraction_is_usable():
    result = ExtractionResult(
        entities=[
            EntityCandidate(name="Acme", type="company"),
        ]
    )

    assert has_usable_extraction(result) is True


def test_event_extraction_is_usable():
    result = ExtractionResult(
        events=[
            EventCandidate(
                event_type="product_launch",
                primary_entity_name="Acme Phone",
                summary="Acme launched Acme Phone.",
            )
        ]
    )

    assert has_usable_extraction(result) is True


def test_entity_and_event_extraction_is_usable():
    result = ExtractionResult(
        entities=[
            EntityCandidate(name="Acme", type="company"),
        ],
        events=[
            EventCandidate(
                event_type="partnership",
                primary_entity_name="Acme",
                summary="Acme announced a partnership.",
            )
        ],
    )

    assert has_usable_extraction(result) is True