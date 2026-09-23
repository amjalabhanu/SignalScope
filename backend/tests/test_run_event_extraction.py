from unittest.mock import patch
from datetime import datetime, timezone
import uuid

from app.database import SessionLocal
from app.models.document import Document
from app.models.entity import Entity
from app.models.event import Event
from app.models.event_evidence import EventEvidence
from app.schemas.extraction import (
    EntityCandidate,
    EventCandidate,
    ExtractionResult,
)
from app.processing.run_event_extraction import run
from app.models.document_entity import DocumentEntity


def test_run_event_extraction_creates_event_and_evidence():
    db = SessionLocal()

    document = Document(
        source_type="test",
        source_name="pytest",
        raw_title=f"Test document {uuid.uuid4()}",
        raw_content="A company announced a platform update.",
        source_url=f"https://example.com/{uuid.uuid4()}",
        content_hash=str(uuid.uuid4()),
        processing_status="processed",
        published_at=datetime.now(timezone.utc),
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    extraction_result = ExtractionResult(
        entities=[
            EntityCandidate(
                name=f"Test Company {uuid.uuid4()}",
                type="company",
            )
        ],
        events=[],
    )

    company_name = extraction_result.entities[0].name

    extraction_result.events.append(
        EventCandidate(
            event_type="platform_update",
            primary_entity_name=company_name,
            summary="The company announced a platform update.",
        )
    )

    try:
        with patch(
            "app.processing.run_event_extraction.extract_document_information",
            return_value=extraction_result,
        ):
            run()

        entity = (
            db.query(Entity)
            .filter(Entity.name == company_name)
            .one()
        )

        event = (
            db.query(Event)
            .filter(
                Event.primary_entity_id == entity.id,
                Event.event_type == "platform_update",
            )
            .one()
        )

        evidence = (
            db.query(EventEvidence)
            .filter(
                EventEvidence.event_id == event.id,
                EventEvidence.document_id == document.id,
            )
            .one()
        )

        assert evidence.event_id == event.id
        assert evidence.document_id == document.id

    finally:
        db.query(EventEvidence).filter(
            EventEvidence.document_id == document.id
        ).delete(synchronize_session=False)

        db.query(Event).filter(
            Event.primary_entity_id == entity.id
        ).delete(synchronize_session=False)
        db.query(DocumentEntity).filter(
            DocumentEntity.document_id == document.id,
            DocumentEntity.entity_id == entity.id,
        ).delete(synchronize_session=False)

        db.query(Entity).filter(
            Entity.id == entity.id
        ).delete(synchronize_session=False)

        db.query(Document).filter(
            Document.id == document.id
        ).delete(synchronize_session=False)

        db.commit()
        db.close()