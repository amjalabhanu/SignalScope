from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.document import Document
from app.models.entity import Entity
from app.models.event import Event
from app.models.event_evidence import EventEvidence
from app.schemas.event import EventResponse
from app.services.event_provenance import build_event_provenance


router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventResponse])
def get_events(
    db: Session = Depends(get_db),
):
    statement = (
        select(Event, Entity)
        .join(
            Entity,
            Event.primary_entity_id == Entity.id,
        )
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
            .where(
                EventEvidence.event_id == event.id,
            )
            .order_by(
                Document.published_at.desc().nullslast(),
                Document.id.desc(),
            )
        )

        documents = db.scalars(evidence_statement).all()

        provenance = build_event_provenance(documents)

        events.append(
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
                **provenance,
            }
        )

    return events