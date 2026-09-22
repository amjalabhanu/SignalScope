import hashlib
from datetime import datetime, timezone

from sqlalchemy import select

from app.database import SessionLocal
from app.models.entity import Entity
from app.models.event import Event
from app.models.document import Document
from app.models.event_evidence import EventEvidence


DEMO_ENTITIES = [
    {"name": "Tesla", "type": "company"},
    {"name": "Instacart", "type": "company"},
    {"name": "Roblox", "type": "company"},
    {"name": "Roadster", "type": "product"},
]


DEMO_EVENTS = [
    {
        "entity": "Tesla",
        "event_type": "product_announcement",
        "summary": "Tesla announced a major update to its vehicle lineup.",
        "title": "Tesla announces vehicle lineup update",
        "source": "SignalScope Demo",
        "url": "https://www.tesla.com/",
        "content": (
            "Demo document: Tesla announced a major update "
            "to its vehicle lineup."
        ),
    },
    {
        "entity": "Instacart",
        "event_type": "partnership",
        "summary": "Instacart announced a new strategic partnership.",
        "title": "Instacart announces strategic partnership",
        "source": "SignalScope Demo",
        "url": "https://www.instacart.com/",
        "content": (
            "Demo document: Instacart announced "
            "a new strategic partnership."
        ),
    },
    {
        "entity": "Roblox",
        "event_type": "platform_update",
        "summary": "Roblox introduced improvements to its platform.",
        "title": "Roblox announces platform improvements",
        "source": "SignalScope Demo",
        "url": "https://www.roblox.com/",
        "content": (
            "Demo document: Roblox introduced "
            "improvements to its platform."
        ),
    },
    {
        "entity": "Roadster",
        "event_type": "product_launch",
        "summary": "Tesla announced an update regarding the Roadster.",
        "title": "Roadster product announcement",
        "source": "SignalScope Demo",
        "url": "https://www.tesla.com/roadster",
        "content": (
            "Demo document: Tesla announced "
            "an update regarding the Roadster."
        ),
    },
]

def get_or_create_entity(db, name, entity_type):
    statement = select(Entity).where(
        Entity.name == name,
        Entity.type == entity_type,
    )

    entity = db.scalar(statement)

    if entity:
        print(f"Entity exists: {name}")
        return entity

    entity = Entity(
        name=name,
        type=entity_type,
        aliases=[],
    )

    db.add(entity)
    db.flush()

    print(f"Created entity: {name}")

    return entity


def seed_demo_event(db, event_data, entity):
    content_hash = hashlib.sha256(
        event_data["content"].encode("utf-8")
    ).hexdigest()

    document = db.scalar(
        select(Document).where(
            Document.content_hash == content_hash
        )
    )

    if document is None:
        document = Document(
            source_type="demo",
            source_name=event_data["source"],
            raw_title=event_data["title"],
            raw_content=event_data["content"],
            source_url=event_data["url"],
            content_hash=content_hash,
            processing_status="completed",
            published_at=datetime.now(timezone.utc),
        )
        db.add(document)
        db.flush()
        print(f"Created document: {event_data['title']}")
    else:
        print(f"Document exists: {event_data['title']}")

    event = db.scalar(
        select(Event).where(
            Event.primary_entity_id == entity.id,
            Event.event_type == event_data["event_type"],
            Event.ai_summary == event_data["summary"],
        )
    )

    if event is None:
        event = Event(
            event_type=event_data["event_type"],
            primary_entity_id=entity.id,
            ai_summary=event_data["summary"],
        )
        db.add(event)
        db.flush()
        print(f"Created event: {event_data['title']}")
    else:
        print(f"Event exists: {event_data['title']}")

    evidence = db.scalar(
        select(EventEvidence).where(
            EventEvidence.event_id == event.id,
            EventEvidence.document_id == document.id,
        )
    )

    if evidence is None:
        db.add(
            EventEvidence(
                event_id=event.id,
                document_id=document.id,
            )
        )
        print(f"Linked evidence: {event_data['title']}")
def seed_demo():
    db = SessionLocal()

    try:
        entities = {}

        for entity_data in DEMO_ENTITIES:
            entity = get_or_create_entity(
                db,
                entity_data["name"],
                entity_data["type"],
            )
            entities[entity_data["name"]] = entity

        for event_data in DEMO_EVENTS:
            entity = entities[event_data["entity"]]
            seed_demo_event(db, event_data, entity)

        db.commit()
        print("Demo seed completed successfully.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_demo()