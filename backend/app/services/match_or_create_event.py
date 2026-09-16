from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.models.event import Event


def match_or_create_event(
    db_session,
    product_entity_id,
    event_type,
    summary,
):
    # Only look for events of the requested type
    # belonging to the same product entity.
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)

    statement = (
        select(Event)
        .where(
            Event.event_type == event_type,
            Event.primary_entity_id == product_entity_id,
            Event.detected_at >= cutoff,
        )
        .order_by(Event.detected_at.desc())
    )

    event = db_session.scalar(statement)

    if event:
        # An event for this product already exists
        # within the 7-day matching window.
        #
        # We deliberately keep its original AI summary.
        # The first summary wins for this sprint.
        return event, False

    # No matching recent event exists.
    # Create a new event using the supplied product
    # and AI-generated summary.
    event = Event(
        event_type=event_type,
        primary_entity_id=product_entity_id,
        ai_summary=summary,
    )

    db_session.add(event)

    return event, True