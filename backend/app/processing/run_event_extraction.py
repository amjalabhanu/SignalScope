from sqlalchemy import exists, select

from app.database import SessionLocal
from app.models.document import Document
from app.models.document_entity import DocumentEntity
from app.models.event_evidence import EventEvidence
from app.models.entity import Entity

from app.services.extract_event import extract_event
from app.services.match_or_create_event import match_or_create_event


BATCH_SIZE = 5


def run():
    db = SessionLocal()

    documents_checked = 0
    launches_detected = 0
    new_events = 0
    existing_events = 0
    evidence_links_created = 0
    documents_skipped = 0
    documents_failed = 0
    documents_deferred = 0

    try:
        # Select documents that were successfully processed by the
        # previous entity-extraction sprint.
        #
        # A document that already has event evidence is excluded.
        # This gives us idempotency without adding another status column.
        
        evidence_exists = exists(
            select(EventEvidence.id).where(EventEvidence.document_id == Document.id)
        )

        product_entity_exists = exists(
            select(Entity.id)
            .join(DocumentEntity, DocumentEntity.entity_id == Entity.id)
            .where(
                DocumentEntity.document_id == Document.id,
                Entity.type == "product",
            )
        )

        statement = (
            select(Document)
            .where(
                Document.processing_status == "processed",
                ~evidence_exists,
                product_entity_exists,
            )
            .order_by(Document.fetched_at.asc())
            .limit(BATCH_SIZE)
        )

        documents = db.scalars(statement).all()

        print(f"Documents selected: {len(documents)}")

        for document in documents:
            documents_checked += 1

            print(f"Processing: {document.raw_title}")

            try:
                # Load the entities already resolved for this document.
                entity_statement = (
                    select(Entity)
                    .join(
                        DocumentEntity,
                        DocumentEntity.entity_id == Entity.id,
                    )
                    .where(
                        DocumentEntity.document_id == document.id
                    )
                )

                linked_entities = db.scalars(entity_statement).all()

                # Convert SQLAlchemy objects into the small amount
                # of information the event extractor needs.
                entity_context = [
                    {
                        "name": entity.name,
                        "type": entity.type,
                    }
                    for entity in linked_entities
                ]

                document_text = (
                    f"Title: {document.raw_title}\n\n"
                    f"Content: {document.raw_content}"
                )

                result = extract_event(
                    document_text,
                    entity_context,
                )

                # No usable product launch was detected.
                if result is None or not result.get("is_product_launch"):
                    documents_skipped += 1
                    print("Skipped: not a usable product launch.")
                    continue

                launches_detected += 1

                product_name = result["product_entity_name"]

                # Find the actual resolved product entity.
                product_entity = next(
                    (
                        entity
                        for entity in linked_entities
                        if entity.type == "product"
                        and entity.name == product_name
                    ),
                    None,
                )

                # This should normally be impossible because
                # extract_event() already validates the product name.
                # We still check here because this is the orchestrator's
                # responsibility before calling event matching.
                if product_entity is None:
                    documents_skipped += 1
                    print("Skipped: product entity could not be resolved.")
                    continue

                event, created = match_or_create_event(
                    db_session=db,
                    product_entity_id=product_entity.id,
                    event_type="product_launch",
                    summary=result["summary"],
                )

                if created:
                    new_events += 1
                else:
                    existing_events += 1

                # Ensure the event has an ID before creating the
                # evidence relationship.
                db.flush()

                # Check for an existing document/event relationship.
                existing_evidence = db.scalar(
                    select(EventEvidence).where(
                        EventEvidence.event_id == event.id,
                        EventEvidence.document_id == document.id,
                    )
                )

                if existing_evidence:
                    continue

                evidence = EventEvidence(
                    event_id=event.id,
                    document_id=document.id,
                )

                db.add(evidence)
                db.commit()

                evidence_links_created += 1

                print(
                    f"Event {'created' if created else 'matched'}: "
                    f"{product_entity.name}"
                )

            except Exception as error:
                db.rollback()

                error_message = str(error)

                # A Gemini quota/rate-limit error means the document
                # itself is not necessarily bad. Leave it eligible
                # for processing during a later run.
                if (
                    "429" in error_message
                    or "RESOURCE_EXHAUSTED" in error_message
                ):
                    documents_deferred += 1
                    print(
                        "Deferred: Gemini quota/rate limit reached."
                    )
                else:
                    documents_failed += 1
                    print(f"Failed: {error}")

        print("\nEvent extraction summary")
        print(f"Documents checked: {documents_checked}")
        print(f"Launches detected: {launches_detected}")
        print(f"New events created: {new_events}")
        print(f"Existing events matched: {existing_events}")
        print(f"Evidence links created: {evidence_links_created}")
        print(f"Documents skipped: {documents_skipped}")
        print(f"Documents failed: {documents_failed}")
        print(f"Documents deferred: {documents_deferred}")

    finally:
        db.close()


if __name__ == "__main__":
    run()