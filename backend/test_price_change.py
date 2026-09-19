from sqlalchemy import select

from app.database import SessionLocal
from app.models.entity import Entity
from app.models.document import Document
from app.models.event import Event
from app.models.event_evidence import EventEvidence
from app.services.detect_price_change import detect_price_change


db = SessionLocal()

try:
    entity = db.scalar(
        select(Entity).where(
            Entity.name == "Instacart",
            Entity.ticker_symbol == "CART",
        )
    )

    document = Document(
        source_type="api",
        source_name="Finnhub Test",
        raw_title="CART price update test",
        raw_content="CART current price: 47.81",
        source_url="https://finnhub.io/quote/CART",
        content_hash="signalscope-price-change-test-47-81",
        published_at=entity.created_at,
    )

    db.add(document)
    db.flush()

    change = detect_price_change(
        db_session=db,
        entity_id=entity.id,
        new_price=47.81,
        source_document_id=document.id,
    )

    print("Detected change:", change)

    if change:
        event = Event(
            event_type="price_change",
            primary_entity_id=entity.id,
            ai_summary=(
                f"{entity.name} price changed from "
                f"{change['old_price']} to "
                f"{change['new_price']}."
            ),
        )

        db.add(event)
        db.flush()

        evidence = EventEvidence(
            event_id=event.id,
            document_id=document.id,
        )

        db.add(evidence)

    db.commit()

    print("Test completed successfully.")

finally:
    db.close()
