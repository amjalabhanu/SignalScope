from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.event import Event
from app.models.entity import Entity
from app.models.event_evidence import EventEvidence
from app.models.document import Document

router = APIRouter(prefix="/events", tags=["events"])


@router.get("")
def get_events(db: Session = Depends(get_db)):
    statement = (
        select(Event, Entity)
        .join(Entity, Event.primary_entity_id == Entity.id)
        .order_by(Event.detected_at.desc())
    )

    results = db.execute(statement).all()

    events = []

    for event, entity in results:
        evidence_statement = (
            select(Document)
            .join(
                EventEvidence,
                EventEvidence.document_id == Document.id,
            )
            .where(EventEvidence.event_id == event.id)
        )

        documents = db.scalars(evidence_statement).all()

        evidence = []

        for document in documents:
            evidence.append({
                "title": document.raw_title,
                "source": document.source_name,
                "url": document.source_url,
                "published_at": document.published_at,
            })

        events.append({
            "id": event.id,
            "event_type": event.event_type,
            "entity": {
                "id": entity.id,
                "name": entity.name,
                "type": entity.type,
            },
            "summary": event.ai_summary,
            "detected_at": event.detected_at,
            "evidence": evidence,
        })

    return events