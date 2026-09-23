import uuid
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models.document import Document
from app.services.storage import store_documents


def make_document(content_hash=None):
    return {
        "source_type": "test",
        "source_name": "Storage Test",
        "raw_title": "Test document",
        "raw_content": "Test document content",
        "source_url": f"https://example.com/{uuid.uuid4()}",
        "content_hash": content_hash or str(uuid.uuid4()),
        "published_at": datetime.now(timezone.utc),
    }


def test_store_documents_inserts_new_document():
    document_data = make_document()

    inserted, skipped = store_documents([document_data])

    assert inserted == 1
    assert skipped == 0

    db = SessionLocal()
    try:
        document = db.query(Document).filter_by(
            content_hash=document_data["content_hash"]
        ).one()

        assert document.raw_title == "Test document"
        db.delete(document)
        db.commit()
    finally:
        db.close()


def test_store_documents_skips_existing_hash():
    content_hash = str(uuid.uuid4())
    first_document = make_document(content_hash)

    store_documents([first_document])

    second_document = make_document(content_hash)

    inserted, skipped = store_documents([second_document])

    assert inserted == 0
    assert skipped == 1

    db = SessionLocal()
    try:
        document = db.query(Document).filter_by(
            content_hash=content_hash
        ).one()

        db.delete(document)
        db.commit()
    finally:
        db.close()
def test_store_documents_handles_duplicate_hashes_in_same_batch():
    content_hash = str(uuid.uuid4())

    documents = [
        make_document(content_hash),
        make_document(content_hash),
    ]

    inserted, skipped = store_documents(documents)

    assert inserted == 1
    assert skipped == 1

    db = SessionLocal()
    try:
        document = db.query(Document).filter_by(
            content_hash=content_hash
        ).one()

        db.delete(document)
        db.commit()
    finally:
        db.close()