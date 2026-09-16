from sqlalchemy import select

from app.database import SessionLocal
from app.models.document import Document


def store_documents(documents):
    db = SessionLocal()

    inserted = 0
    skipped = 0

    try:
        for document_data in documents:
            existing = db.scalar(
                select(Document).where(
                    Document.content_hash == document_data["content_hash"]
                )
            )

            if existing:
                skipped += 1
                continue

            document = Document(**document_data)

            db.add(document)
            inserted += 1

        db.commit()

        return inserted, skipped

    finally:
        db.close()