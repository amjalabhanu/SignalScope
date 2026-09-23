from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.entity import Entity
from app.models.event import Event
from app.models.event_evidence import EventEvidence
from app.models.event_interpretation import EventInterpretation
from app.services.ai_interpretation import interpret_event
from app.services.interpretation_context import (
    build_interpretation_context,
)
from app.services.interpretation_prompts import (
    INTERPRETATION_PROMPT_VERSION,
)


def generate_event_interpretation(
    db: Session,
    event_id,
    force_regenerate: bool = False,
) -> EventInterpretation:
    event = db.scalar(
        select(Event).where(Event.id == event_id)
    )

    if event is None:
        raise ValueError("Event not found")

    existing = db.scalar(
        select(EventInterpretation).where(
            EventInterpretation.event_id == event.id
        )
    )

    if existing and not force_regenerate:
        return existing

    entity = db.scalar(
        select(Entity).where(
            Entity.id == event.primary_entity_id
        )
    )

    if entity is None:
        raise ValueError("Primary entity not found")

    evidence_statement = (
        select(Document)
        .join(
            EventEvidence,
            EventEvidence.document_id == Document.id,
        )
        .where(EventEvidence.event_id == event.id)
        .order_by(
            Document.published_at.desc().nullslast(),
            Document.id.desc(),
        )
    )

    documents = db.scalars(evidence_statement).all()

    context = build_interpretation_context(
        event=event,
        entity=entity,
        documents=documents,
    )

    result = interpret_event(context)

    now = datetime.now(timezone.utc)

    if existing is None:
        existing = EventInterpretation(
            event_id=event.id,
            created_at=now,
        )
        db.add(existing)

    existing.status = result.status
    existing.significance = result.significance
    existing.why_it_matters = result.why_it_matters
    existing.impact_areas = [
        area.model_dump()
        for area in result.impact_areas
    ]
    existing.known_facts = result.known_facts
    existing.qualified_implications = (
        result.qualified_implications
    )
    existing.uncertainties = result.uncertainties
    existing.generated_at = now
    existing.prompt_version = INTERPRETATION_PROMPT_VERSION
    existing.model_version = "gemini-2.5-flash"
    existing.updated_at = now

    db.flush()

    return existing