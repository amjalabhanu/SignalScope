import uuid
from datetime import datetime, timezone
from unittest.mock import patch

from app.models.document import Document
from app.models.entity import Entity
from app.models.event import Event
from app.models.event_evidence import EventEvidence
from app.models.event_interpretation import EventInterpretation
from app.schemas.interpretation import EventInterpretationResult
from app.services.event_interpretation import (
    generate_event_interpretation,
)


def create_test_records(db_session):
    entity = Entity(
        name=f"Test Entity {uuid.uuid4()}",
        type="company",
    )
    db_session.add(entity)
    db_session.flush()

    event = Event(
        event_type="platform_update",
        primary_entity_id=entity.id,
        ai_summary="Test platform update",
    )
    db_session.add(event)
    db_session.flush()

    document = Document(
        source_type="test",
        source_name="pytest",
        raw_title="Test document",
        raw_content="The company launched a new platform feature.",
        source_url=f"https://example.com/{uuid.uuid4()}",
        content_hash=str(uuid.uuid4()),
        processing_status="processed",
        published_at=datetime.now(timezone.utc),
    )
    db_session.add(document)
    db_session.flush()

    evidence = EventEvidence(
        event_id=event.id,
        document_id=document.id,
    )
    db_session.add(evidence)
    db_session.flush()

    return event, entity, document


@patch("app.services.event_interpretation.interpret_event")
def test_generate_event_interpretation_creates_record(
    mock_interpret_event,
    db_session,
):
    event, entity, document = create_test_records(db_session)

    mock_interpret_event.return_value = EventInterpretationResult(
        status="generated",
        significance="The update indicates a product capability change.",
        why_it_matters="Users may gain access to additional functionality.",
        impact_areas=[
            {
                "area": "product",
                "explanation": "The event concerns a platform feature.",
                "basis": "The supplied event and document describe a new feature.",
            }
        ],
        known_facts=[
            "The company launched a new platform feature."
        ],
        qualified_implications=[
            "The update may affect user functionality."
        ],
        uncertainties=[
            "The scale of user adoption is unknown."
        ],
    )

    result = generate_event_interpretation(
        db=db_session,
        event_id=event.id,
    )

    assert result.event_id == event.id
    assert result.status == "generated"
    assert result.significance is not None
    assert result.why_it_matters is not None
    assert result.prompt_version == "v1"
    assert result.model_version == "gemini-2.5-flash"

    stored = db_session.query(EventInterpretation).filter(
        EventInterpretation.event_id == event.id
    ).one()

    assert stored.id == result.id
    assert stored.status == "generated"
    assert len(stored.impact_areas) == 1

    mock_interpret_event.assert_called_once()
@patch("app.services.event_interpretation.interpret_event")
def test_generate_event_interpretation_reuses_existing_record(
    mock_interpret_event,
    db_session,
):
    event, entity, document = create_test_records(db_session)

    mock_interpret_event.return_value = EventInterpretationResult(
        status="generated",
        significance="Existing interpretation",
        why_it_matters="Existing interpretation matters.",
        known_facts=["A documented fact"],
        qualified_implications=["A qualified implication"],
        uncertainties=["An uncertainty"],
    )

    first_result = generate_event_interpretation(
        db=db_session,
        event_id=event.id,
    )

    mock_interpret_event.reset_mock()

    second_result = generate_event_interpretation(
        db=db_session,
        event_id=event.id,
    )

    assert second_result.id == first_result.id
    assert second_result.event_id == first_result.event_id
    assert second_result.significance == first_result.significance

    mock_interpret_event.assert_not_called()
@patch("app.services.event_interpretation.interpret_event")
def test_generate_event_interpretation_force_regenerates(
    mock_interpret_event,
    db_session,
):
    event, entity, document = create_test_records(db_session)

    mock_interpret_event.side_effect = [
        EventInterpretationResult(
            status="generated",
            significance="First interpretation",
            why_it_matters="First explanation",
            known_facts=["First fact"],
            qualified_implications=[],
            uncertainties=[],
        ),
        EventInterpretationResult(
            status="generated",
            significance="Regenerated interpretation",
            why_it_matters="Updated explanation",
            known_facts=["Updated fact"],
            qualified_implications=[],
            uncertainties=[],
        ),
    ]

    first_result = generate_event_interpretation(
        db=db_session,
        event_id=event.id,
    )

    second_result = generate_event_interpretation(
        db=db_session,
        event_id=event.id,
        force_regenerate=True,
    )

    assert second_result.id == first_result.id
    assert second_result.significance == "Regenerated interpretation"
    assert second_result.why_it_matters == "Updated explanation"
    assert second_result.known_facts == ["Updated fact"]

    assert mock_interpret_event.call_count == 2
@patch("app.services.event_interpretation.interpret_event")
def test_generate_event_interpretation_handles_insufficient_evidence(
    mock_interpret_event,
    db_session,
):
    event, entity, document = create_test_records(db_session)

    mock_interpret_event.return_value = EventInterpretationResult(
        status="insufficient_evidence",
        significance=None,
        why_it_matters=None,
        impact_areas=[],
        known_facts=[],
        qualified_implications=[],
        uncertainties=[
            "The available evidence does not establish broader implications."
        ],
    )

    result = generate_event_interpretation(
        db=db_session,
        event_id=event.id,
    )

    assert result.status == "insufficient_evidence"
    assert result.significance is None
    assert result.why_it_matters is None
    assert result.impact_areas == []
    assert result.qualified_implications == []
    assert len(result.uncertainties) == 1