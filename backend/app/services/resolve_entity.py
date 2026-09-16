from sqlalchemy import func, select

from app.models.entity import Entity


def resolve_entity(db_session, candidate):
    # Extract the candidate information returned by the LLM.
    name = candidate["name"]
    entity_type = candidate["type"]

    # First look for an entity whose canonical name matches
    # the candidate name, ignoring differences in letter case.
    statement = select(Entity).where(
        func.lower(Entity.name) == func.lower(name),
        Entity.type == entity_type,
    )

    entity = db_session.scalar(statement)

    if entity:
        # An existing canonical entity was found.
        # We return it without changing anything.
        return entity

    # If the canonical name did not match, look for the candidate
    # inside the existing aliases JSONB array.
    statement = select(Entity).where(
        Entity.type == entity_type,
        Entity.aliases.contains([name]),
    )

    entity = db_session.scalar(statement)

    if entity:
        # An existing entity matched through an alias.
        # We still do not modify the aliases.
        return entity

    # No existing entity matched, so create a new one.
    entity = Entity(
        name=name,
        type=entity_type,
    )

    db_session.add(entity)

    # False means this was an existing entity.
    # True means we created a new entity.
    return entity