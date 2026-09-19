from sqlalchemy import select

from app.database import SessionLocal
from app.models.document import Document
from app.models.entity import Entity
from app.models.event_evidence import EventEvidence

from app.services.storage import store_documents
from app.ingestion.finnhub_connector import fetch_quote
from app.services.normalize_stock_quote import normalize_stock_quote
from app.services.detect_price_change import detect_price_change
from app.services.match_or_create_event import match_or_create_event


def run():
    db = SessionLocal()

    try:
        # Only entities with a ticker_symbol are actively tracked
        # by the stock-price pipeline.
        statement = (
            select(Entity)
            .where(Entity.ticker_symbol.is_not(None))
            .order_by(Entity.name)
        )

        entities = db.scalars(statement).all()

        print(f"Entities selected: {len(entities)}")

        for entity in entities:
            ticker = entity.ticker_symbol

            print(f"\nTracking: {entity.name} ({ticker})")

            # Fetch the latest quote from Finnhub.
            quote_data = fetch_quote(ticker)

            if quote_data is None:
                print("Skipped: quote could not be fetched.")
                continue

            # Convert the raw quote into the shape expected
            # by the existing documents table.
            document_data = normalize_stock_quote(
                ticker,
                quote_data,
            )

            # Reuse the existing document storage service.
            # This keeps document deduplication in one place.
            inserted, skipped = store_documents([document_data])

            # If the same ticker + price was already stored,
            # there is nothing new to process.
            if skipped:
                print("Skipped: unchanged quote already stored.")
                continue

            # store_documents() returns counts rather than the
            # created Document, so retrieve the newly stored document
            # using its unique content_hash.
            document = db.scalar(
                select(Document).where(
                    Document.content_hash == document_data["content_hash"]
                )
            )

            if document is None:
                raise RuntimeError(
                    "Document was stored but could not be retrieved."
                )

            new_price = quote_data["c"]

            # Compare this observation against the most recent
            # recorded price.
            change = detect_price_change(
                db_session=db,
                entity_id=entity.id,
                new_price=new_price,
                source_document_id=document.id,
            )

            # First observation:
            # history is recorded, but there is no event yet.
            if change is None:
                db.commit()
                print("No price change event.")
                continue

            summary = (
                f"{entity.name} price changed from "
                f"{change['old_price']} to "
                f"{change['new_price']}."
            )

            # Reuse the existing event matching logic.
            # This gives price-change events the same 7-day
            # deduplication behavior as product-launch events.
            event, created = match_or_create_event(
                db_session=db,
                product_entity_id=entity.id,
                event_type="price_change",
                summary=summary,
            )

            # Ensure the event has an ID before creating
            # the evidence relationship.
            db.flush()

            # Check whether this document is already evidence
            # for this event.
            existing_evidence = db.scalar(
                select(EventEvidence).where(
                    EventEvidence.event_id == event.id,
                    EventEvidence.document_id == document.id,
                )
            )

            if existing_evidence:
                db.commit()
                print("Evidence already linked.")
                continue

            evidence = EventEvidence(
                event_id=event.id,
                document_id=document.id,
            )

            db.add(evidence)
            db.commit()

            print(
                f"Price change detected: "
                f"{change['old_price']} -> {change['new_price']}"
            )

            print(
                f"Event {'created' if created else 'matched'}: "
                f"{entity.name}"
            )

    except Exception as error:
        db.rollback()
        print(f"Price tracking failed: {error}")

    finally:
        db.close()


if __name__ == "__main__":
    run()