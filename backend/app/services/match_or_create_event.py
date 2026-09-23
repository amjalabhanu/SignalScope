from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.models.event import Event
from app.services.event_types import normalize_event_type


def match_or_create_event(
    db_session,
    primary_entity_id,
    event_type,
    summary,
):
    canonical_event_type = normalize_event_type(event_type)

    cutoff = datetime.now(timezone.utc) - timedelta(days=7)

    statement = (
        select(Event)
        .where(
            Event.event_type == canonical_event_type,
            Event.primary_entity_id == primary_entity_id,
            Event.detected_at >= cutoff,
        )
        .order_by(Event.detected_at.desc())
    )

    event = db_session.scalar(statement)

    if event:
        return event, False

    event = Event(
        event_type=canonical_event_type,
        primary_entity_id=primary_entity_id,
        ai_summary=summary,
    )

    db_session.add(event)

    return event, True