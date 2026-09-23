import uuid
from datetime import datetime, timezone

from app.models.document import Document
from app.models.entity import Entity
from app.models.event import Event
from app.models.event_evidence import EventEvidence
from app.services.attach_event_evidence import attach_event_evidence


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
        ai_summary="Test event summary",
    )
    db_session.add(event)

    document = Document(
        source_type="test",
        source_name="pytest",
        raw_title="Test document",
        raw_content="Test content",
        source_url=f"https://example.com/{uuid.uuid4()}",
        content_hash=str(uuid.uuid4()),
        processing_status="processed",
        published_at=datetime.now(timezone.utc),
    )
    db_session.add(document)
    db_session.flush()

    return event, document


def test_attach_event_evidence_creates_new_link(db_session):
    event, document = create_test_records(db_session)

    result = attach_event_evidence(
        db_session=db_session,
        event_id=event.id,
        document_id=document.id,
    )

    assert result is True

    evidence = db_session.query(EventEvidence).filter(
        EventEvidence.event_id == event.id,
        EventEvidence.document_id == document.id,
    ).one()

    assert evidence.event_id == event.id
    assert evidence.document_id == document.id


def test_attach_event_evidence_avoids_duplicate_link(db_session):
    event, document = create_test_records(db_session)

    existing = EventEvidence(
        event_id=event.id,
        document_id=document.id,
    )

    db_session.add(existing)
    db_session.flush()

    result = attach_event_evidence(
        db_session=db_session,
        event_id=event.id,
        document_id=document.id,
    )

    assert result is False

    evidence_rows = db_session.query(EventEvidence).filter(
        EventEvidence.event_id == event.id,
        EventEvidence.document_id == document.id,
    ).all()

    assert len(evidence_rows) == 1