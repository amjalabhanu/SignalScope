from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.document_entity import DocumentEntity
from app.models.entity import Entity
from app.models.event import Event
from app.models.event_evidence import EventEvidence


def get_entity_events(
    db: Session,
    entity_id: UUID,
    page: int,
    limit: int,
    event_type: str | None = None,
):
    base_statement = select(Event).where(
        Event.primary_entity_id == entity_id
    )

    if event_type:
        base_statement = base_statement.where(
            Event.event_type == event_type
        )

    total_statement = select(func.count()).select_from(
        base_statement.subquery()
    )
    total = db.scalar(total_statement) or 0

    offset = (page - 1) * limit

    events_statement = (
        base_statement
        .order_by(Event.detected_at.desc(), Event.id.desc())
        .offset(offset)
        .limit(limit)
    )

    events = db.scalars(events_statement).all()

    if not events:
        return {
            "items": [],
            "page": page,
            "limit": limit,
            "total": total,
            "has_more": False,
        }

    event_ids = [event.id for event in events]

    evidence_statement = (
        select(EventEvidence.event_id, Document)
        .join(
            Document,
            EventEvidence.document_id == Document.id,
        )
        .where(EventEvidence.event_id.in_(event_ids))
    )

    evidence_rows = db.execute(evidence_statement).all()

    evidence_by_event = {}

    for event_id, document in evidence_rows:
        evidence_by_event.setdefault(event_id, []).append(
            {
                "title": document.raw_title,
                "source": document.source_name,
                "url": document.source_url,
                "published_at": document.published_at,
            }
        )

    entity = db.get(Entity, entity_id)

    items = [
        {
            "id": event.id,
            "event_type": event.event_type,
            "entity": {
                "id": entity.id,
                "name": entity.name,
                "type": entity.type,
            },
            "ai_summary": event.ai_summary,
            "detected_at": event.detected_at,
            "evidence": evidence_by_event.get(event.id, []),
        }
        for event in events
    ]

    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total,
        "has_more": offset + len(items) < total,
    }
def get_related_entities(
    db: Session,
    entity_id: UUID,
):
    related_statement = (
        select(Entity)
        .join(
            DocumentEntity,
            DocumentEntity.entity_id == Entity.id,
        )
        .join(
            Document,
            Document.id == DocumentEntity.document_id,
        )
        .where(
            Document.id.in_(
                select(DocumentEntity.document_id).where(
                    DocumentEntity.entity_id == entity_id
                )
            ),
            Entity.id != entity_id,
        )
        .distinct()
        .order_by(Entity.name.asc())
    )

    related_entities = db.scalars(related_statement).all()

    return [
        {
            "id": entity.id,
            "name": entity.name,
            "type": entity.type,
            "ticker_symbol": entity.ticker_symbol,
            "reason": "Shares documents with this entity",
        }
        for entity in related_entities
    ]