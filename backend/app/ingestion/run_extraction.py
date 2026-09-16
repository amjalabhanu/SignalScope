from sqlalchemy import select

from app.database import SessionLocal
from app.models.document import Document
from app.models.document_entity import DocumentEntity

from app.services.extract_entities import extract_entities
from app.services.resolve_entity import resolve_entity


BATCH_SIZE = 5


def run():
    db = SessionLocal()

    documents_processed = 0
    documents_failed = 0
    documents_deferred = 0
    new_entities = 0
    existing_matches = 0
    links_created = 0

    try:
        # Select the oldest documents that still need processing.
        statement = (
            select(Document)
            .where(Document.processing_status != "processed")
            .order_by(Document.fetched_at.asc())
            .limit(BATCH_SIZE)
        )

        documents = db.scalars(statement).all()

        print(f"Documents selected: {len(documents)}")

        for document in documents:
            print(f"Processing: {document.raw_title}")

            document.processing_status = "processing"
            db.commit()

            try:
                # The extraction service only receives text.
                document_text = (
                    f"Title: {document.raw_title}\n\n"
                    f"Content: {document.raw_content}"
                )

                candidates = extract_entities(document_text)

                print(f"Entities extracted: {len(candidates)}")

                for candidate in candidates:
                    entity = resolve_entity(db, candidate)

                    # If the entity was just created, SQLAlchemy
                    # keeps it in the session's "new" collection.
                    if entity in db.new:
                        new_entities += 1
                    else:
                        existing_matches += 1

                    # Make sure the new entity has an ID.
                    db.flush()

                    # Don't create the same document/entity
                    # relationship twice.
                    existing_link = db.scalar(
                        select(DocumentEntity).where(
                            DocumentEntity.document_id == document.id,
                            DocumentEntity.entity_id == entity.id,
                        )
                    )

                    if existing_link:
                        continue

                    link = DocumentEntity(
                        document_id=document.id,
                        entity_id=entity.id,
                    )

                    db.add(link)
                    links_created += 1

                document.processing_status = "processed"
                db.commit()

                documents_processed += 1

            except Exception as error:
                db.rollback()

                error_message = str(error)

                # Gemini quota/rate-limit errors should be retried later.
                if "429" in error_message or "RESOURCE_EXHAUSTED" in error_message:
                    document.processing_status = "pending"
                    documents_deferred += 1
                    print("Deferred: Gemini quota/rate limit reached.")
                else:
                    document.processing_status = "failed"
                    documents_failed += 1
                    print(f"Failed: {error}")

                db.commit()

        print("\nExtraction summary")
        print(f"Documents processed: {documents_processed}")
        print(f"Documents failed: {documents_failed}")
        print(f"Documents deferred: {documents_deferred}")
        print(f"New entities: {new_entities}")
        print(f"Existing matches: {existing_matches}")
        print(f"Links created: {links_created}")

    finally:
        db.close()


if __name__ == "__main__":
    run()