import uuid
from unittest.mock import patch
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models.document import Document
from app.services.extraction_errors import (
    ExtractionRateLimitError,
    ExtractionTemporaryError,
    ExtractionValidationError,
)
from app.schemas.extraction import ExtractionResult
from app.processing.run_event_extraction import run


def create_test_document(db):
    document = Document(
        id=uuid.uuid4(),
        source_type="test",
        source_name="Status Test",
        raw_title="Status handling test",
        raw_content="Test content",
        source_url=f"https://example.com/{uuid.uuid4()}",
        content_hash=str(uuid.uuid4()),
        processing_status="processed",
        published_at=datetime.now(timezone.utc),
    )
    db.add(document)
    db.commit()
    return document


def test_rate_limit_sets_document_to_pending():
    db = SessionLocal()
    document = create_test_document(db)

    try:
        with patch(
            "app.processing.run_event_extraction.extract_document_information",
            side_effect=ExtractionRateLimitError("rate limited"),
        ):
            run()

        db.expire_all()
        refreshed = db.get(Document, document.id)

        assert refreshed.processing_status == "pending"

    finally:
        db.delete(document)
        db.commit()
        db.close()


def test_temporary_error_sets_document_to_pending():
    db = SessionLocal()
    document = create_test_document(db)

    try:
        with patch(
            "app.processing.run_event_extraction.extract_document_information",
            side_effect=ExtractionTemporaryError("temporary failure"),
        ):
            run()

        db.expire_all()
        refreshed = db.get(Document, document.id)

        assert refreshed.processing_status == "pending"

    finally:
        db.delete(document)
        db.commit()
        db.close()


def test_validation_error_sets_document_to_failed():
    db = SessionLocal()
    document = create_test_document(db)

    try:
        with patch(
            "app.processing.run_event_extraction.extract_document_information",
            side_effect=ExtractionValidationError("invalid response"),
        ):
            run()

        db.expire_all()
        refreshed = db.get(Document, document.id)

        assert refreshed.processing_status == "failed"

    finally:
        db.delete(document)
        db.commit()
        db.close()


def test_successful_empty_extraction_remains_processed():
    db = SessionLocal()
    document = create_test_document(db)

    try:
        with patch(
            "app.processing.run_event_extraction.extract_document_information",
            return_value=ExtractionResult(entities=[], events=[]),
        ):
            run()

        db.expire_all()
        refreshed = db.get(Document, document.id)

        assert refreshed.processing_status == "processed"

    finally:
        db.delete(document)
        db.commit()
        db.close()