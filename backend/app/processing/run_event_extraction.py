from sqlalchemy import exists, select

from app.database import SessionLocal
from app.models.document import Document
from app.models.document_entity import DocumentEntity
from app.models.entity import Entity
from app.models.event_evidence import EventEvidence

from app.services.ai_extraction import extract_document_information
from app.services.attach_event_evidence import attach_event_evidence
from app.services.extraction_errors import (
    ExtractionRateLimitError,
    ExtractionTemporaryError,
    ExtractionValidationError,
)
from app.services.match_or_create_event import match_or_create_event
from app.services.resolve_entity import resolve_entity


BATCH_SIZE = 5


def run():
    db = SessionLocal()

    documents_checked = 0
    events_detected = 0
    new_events = 0
    existing_events = 0
    evidence_links_created = 0
    documents_skipped = 0
    documents_failed = 0
    documents_deferred = 0
    entities_resolved = 0
    entity_links_created = 0

    try:
        evidence_exists = exists(
            select(EventEvidence.id).where(
                EventEvidence.document_id == Document.id
            )
        )

        statement = (
            select(Document)
            .where(
                Document.processing_status == "processed",
                ~evidence_exists,
            )
            .order_by(Document.fetched_at.asc())
            .limit(BATCH_SIZE)
        )

        documents = db.scalars(statement).all()

        print(f"Documents selected: {len(documents)}")

        for document in documents:
            documents_checked += 1
            print(f"\nProcessing: {document.raw_title}")

            try:
                document_text = (
                    f"Title: {document.raw_title}\n\n"
                    f"Content: {document.raw_content}"
                )

                extraction = extract_document_information(
                    document_text
                )

                if not extraction.entities and not extraction.events:
                    document.processing_status = "processed"
                    documents_skipped += 1
                    db.commit()
                    print("Skipped: no usable information extracted.")
                    continue

                resolved_entities = {}

                # Resolve AI-discovered entities and link them
                # to the source document.
                for candidate in extraction.entities:
                    candidate_data = candidate.model_dump()

                    entity = resolve_entity(
                        db_session=db,
                        candidate=candidate_data,
                    )

                    db.flush()

                    entities_resolved += 1
                    resolved_entities[
                        (entity.name.lower(), entity.type)
                    ] = entity

                    existing_link = db.scalar(
                        select(DocumentEntity).where(
                            DocumentEntity.document_id == document.id,
                            DocumentEntity.entity_id == entity.id,
                        )
                    )

                    if existing_link:
                        continue

                    db.add(
                        DocumentEntity(
                            document_id=document.id,
                            entity_id=entity.id,
                        )
                    )

                    entity_links_created += 1

                # Also load entities previously linked to this document.
                linked_entities = db.scalars(
                    select(Entity)
                    .join(
                        DocumentEntity,
                        DocumentEntity.entity_id == Entity.id,
                    )
                    .where(
                        DocumentEntity.document_id == document.id
                    )
                ).all()

                for entity in linked_entities:
                    resolved_entities[
                        (entity.name.lower(), entity.type)
                    ] = entity

                for event_candidate in extraction.events:
                    primary_name = (
                        event_candidate.primary_entity_name.strip().lower()
                    )

                    primary_entity = next(
                        (
                            entity
                            for (name, _entity_type), entity
                            in resolved_entities.items()
                            if name == primary_name
                        ),
                        None,
                    )

                    if primary_entity is None:
                        print(
                            "Skipped event: primary entity could not "
                            f"be resolved ({event_candidate.primary_entity_name})."
                        )
                        continue

                    event, created = match_or_create_event(
                        db_session=db,
                        primary_entity_id=primary_entity.id,
                        event_type=event_candidate.event_type,
                        summary=event_candidate.summary,
                    )

                    db.flush()

                    events_detected += 1

                    if created:
                        new_events += 1
                    else:
                        existing_events += 1

                    if attach_event_evidence(
                        db_session=db,
                        event_id=event.id,
                        document_id=document.id,
                    ):
                        evidence_links_created += 1

                document.processing_status = "processed"
                db.commit()

                print(
                    f"Events detected: {len(extraction.events)}"
                )

            except ExtractionRateLimitError as error:
                db.rollback()
                document.processing_status = "pending"
                db.commit()
                documents_deferred += 1
                print(f"Deferred: {error}")

            except ExtractionTemporaryError as error:
                db.rollback()
                document.processing_status = "pending"
                db.commit()
                documents_deferred += 1
                print(f"Deferred: {error}")

            except ExtractionValidationError as error:
                db.rollback()
                document.processing_status = "failed"
                db.commit()
                documents_failed += 1
                print(f"Failed validation: {error}")

            except Exception as error:
                db.rollback()
                document.processing_status = "failed"
                db.commit()
                documents_failed += 1
                print(f"Failed: {error}")

        print("\nGeneralized event extraction summary")
        print(f"Documents checked: {documents_checked}")
        print(f"Entities resolved: {entities_resolved}")
        print(f"Entity links created: {entity_links_created}")
        print(f"Events detected: {events_detected}")
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