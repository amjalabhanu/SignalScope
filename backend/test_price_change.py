# from sqlalchemy import select

# from app.database import SessionLocal
# from app.models.entity import Entity
# from app.models.document import Document
# from app.models.event import Event
# from app.models.event_evidence import EventEvidence
# from app.services.detect_price_change import detect_price_change


# db = SessionLocal()

# try:
#     entity = db.scalar(
#         select(Entity).where(
#             Entity.name == "Instacart",
#             Entity.ticker_symbol == "CART",
#         )
#     )

#     document = Document(
#         source_type="api",
#         source_name="Finnhub Test",
#         raw_title="CART price update test",
#         raw_content="CART current price: 47.81",
#         source_url="https://finnhub.io/quote/CART",
#         content_hash="signalscope-price-change-test-47-81",
#         published_at=entity.created_at,
#     )

#     db.add(document)
#     db.flush()

#     change = detect_price_change(
#         db_session=db,
#         entity_id=entity.id,
#         new_price=47.81,
#         source_document_id=document.id,
#     )

#     print("Detected change:", change)

#     if change:
#         event = Event(
#             event_type="price_change",
#             primary_entity_id=entity.id,
#             ai_summary=(
#                 f"{entity.name} price changed from "
#                 f"{change['old_price']} to "
#                 f"{change['new_price']}."
#             ),
#         )

#         db.add(event)
#         db.flush()

#         evidence = EventEvidence(
#             event_id=event.id,
#             document_id=document.id,
#         )

#         db.add(evidence)

#     db.commit()

#     print("Test completed successfully.")

# finally:
#     db.close()
import uuid

from datetime import datetime, timezone

from sqlalchemy import select

from app.database import SessionLocal
from app.models.document import Document
from app.models.entity import Entity
from app.models.entity_attribute_history import EntityAttributeHistory
from app.services.detect_price_change import detect_price_change


def test_detect_price_change():
    db = SessionLocal()

    try:
        entity = Entity(
            name=f"Price Test Entity {uuid.uuid4()}",
            type="company",
            aliases=[],
            ticker_symbol=None,
        )

        db.add(entity)
        db.flush()

        document = Document(
            source_type="test",
            source_name="pytest",
            raw_title="Price change test",
            raw_content="Test price observation",
            source_url="https://example.com/test-price-change",
            content_hash="pytest-price-change-test",
            published_at=datetime.now(timezone.utc),
        )

        db.add(document)
        db.flush()

        # First observation: no change should be detected.
        first_change = detect_price_change(
            db_session=db,
            entity_id=entity.id,
            new_price=100.00,
            source_document_id=document.id,
        )

        assert first_change is None

        db.flush()

        # Same price: no change should be detected.
        same_change = detect_price_change(
            db_session=db,
            entity_id=entity.id,
            new_price=100.00,
            source_document_id=document.id,
        )

        assert same_change is None

        # Changed price: old and new values should be returned.
        changed_change = detect_price_change(
            db_session=db,
            entity_id=entity.id,
            new_price=105.00,
            source_document_id=document.id,
        )

        assert changed_change is not None
        assert changed_change["old_price"] == 100.00
        assert changed_change["new_price"] == 105.00
        assert changed_change["entity_id"] == entity.id

        db.flush()

        history_rows = db.scalars(
            select(EntityAttributeHistory).where(
                EntityAttributeHistory.entity_id == entity.id,
                EntityAttributeHistory.source_document_id == document.id,
            )
        ).all()

        assert len(history_rows) == 2

    finally:
        db.rollback()
        db.close()