from sqlalchemy import select

from app.models.entity_attribute_history import EntityAttributeHistory


def detect_price_change(
    db_session,
    entity_id,
    new_price,
    source_document_id,
) -> dict | None:
    """
    Compare a new price against the most recent recorded price.

    Returns a change description when the price changed.
    Returns None when this is the first observation or when
    the price has not changed.
    """

    # Find the most recent price observation for this entity.
    statement = (
        select(EntityAttributeHistory)
        .where(
            EntityAttributeHistory.entity_id == entity_id,
            EntityAttributeHistory.attribute_name == "price",
        )
        .order_by(
            EntityAttributeHistory.observed_at.desc(),
            EntityAttributeHistory.id.desc(),
        )
        .limit(1)
    )

    previous_observation = db_session.scalar(statement)

    # First observation:
    # There is no previous value to compare against, so we only
    # record the current value and do not create an event.
    if previous_observation is None:
        history = EntityAttributeHistory(
            entity_id=entity_id,
            attribute_name="price",
            attribute_value=str(new_price),
            source_document_id=source_document_id,
        )

        db_session.add(history)

        return None

    old_price = float(previous_observation.attribute_value)

    # Same price:
    # Nothing changed, so there is no new history row and no event.
    if old_price == float(new_price):
        return None

    # Changed price:
    # Record the new observation first so the history remains complete.
    history = EntityAttributeHistory(
        entity_id=entity_id,
        attribute_name="price",
        attribute_value=str(new_price),
        source_document_id=source_document_id,
    )

    db_session.add(history)

    # Return the information needed by the caller to create
    # a SignalScope event.
    return {
        "old_price": old_price,
        "new_price": float(new_price),
        "entity_id": entity_id,
    }