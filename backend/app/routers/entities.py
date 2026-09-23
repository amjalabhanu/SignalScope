from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.entity import Entity
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.entity import EntityResponse, EntitySearchResponse
from app.models.document import Document
from app.models.document_entity import DocumentEntity
from app.schemas.related import RelatedEntityResponse
from app.schemas.intelligence import (
    EntityEventsResponse,
    EntityIntelligenceResponse,
)
from app.services.entity_intelligence import (
    get_entity_events,
    get_related_entities as get_related_entities_service,
)


router = APIRouter(prefix="/entities", tags=["entities"])


def build_entity_response(
    entity: Entity,
    is_subscribed: bool = False,
) -> dict:
    return {
        "id": entity.id,
        "name": entity.name,
        "type": entity.type,
        "aliases": entity.aliases,
        "ticker_symbol": entity.ticker_symbol,
        "created_at": entity.created_at,
        "is_subscribed": is_subscribed,
    }


@router.get("", response_model=list[EntityResponse])
def get_entities(
    db: Session = Depends(get_db),
):
    statement = select(Entity).order_by(Entity.name.asc())

    entities = db.scalars(statement).all()

    return [
        build_entity_response(entity)
        for entity in entities
    ]


@router.get("/search", response_model=EntitySearchResponse)
def search_entities(
    q: str = Query(..., min_length=1),
    type: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    search_term = f"%{q.strip()}%"

    search_conditions = [
        Entity.name.ilike(search_term),
        Entity.ticker_symbol.ilike(search_term),
        cast(Entity.aliases, String).ilike(search_term),
    ]

    filters = [
        or_(*search_conditions),
    ]

    if type:
        filters.append(Entity.type.ilike(type))

    total_statement = (
        select(func.count())
        .select_from(Entity)
        .where(*filters)
    )

    total = db.scalar(total_statement) or 0

    statement = (
        select(Entity)
        .where(*filters)
        .order_by(Entity.name.asc())
        .offset((page - 1) * limit)
        .limit(limit)
    )

    entities = db.scalars(statement).all()

    entity_ids = [entity.id for entity in entities]

    subscribed_entity_ids = set()

    if entity_ids:
        subscription_statement = select(Subscription.entity_id).where(
            Subscription.user_id == current_user.id,
            Subscription.entity_id.in_(entity_ids),
        )

        subscribed_entity_ids = set(
            db.scalars(subscription_statement).all()
        )

    results = [
        build_entity_response(
            entity,
            entity.id in subscribed_entity_ids,
        )
        for entity in entities
    ]

    return {
        "results": results,
        "page": page,
        "limit": limit,
        "total": total,
    }

@router.get(
    "/{entity_id}/events",
    response_model=EntityEventsResponse,
)
def get_entity_event_history(
    entity_id: UUID,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    event_type: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entity = db.get(Entity, entity_id)

    if entity is None:
        raise HTTPException(
            status_code=404,
            detail="Entity not found",
        )

    return get_entity_events(
        db=db,
        entity_id=entity_id,
        page=page,
        limit=limit,
        event_type=event_type,
    )

@router.get(
    "/{entity_id}/intelligence",
    response_model=EntityIntelligenceResponse,
)
def get_entity_intelligence(
    entity_id: UUID,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    event_type: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entity = db.get(Entity, entity_id)

    if entity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entity not found",
        )

    subscription_statement = select(Subscription.id).where(
        Subscription.user_id == current_user.id,
        Subscription.entity_id == entity_id,
    )

    is_subscribed = (
        db.scalar(subscription_statement) is not None
    )

    entity_response = build_entity_response(
        entity,
        is_subscribed=is_subscribed,
    )

    events = get_entity_events(
        db=db,
        entity_id=entity_id,
        page=page,
        limit=limit,
        event_type=event_type,
    )

    related_entities = get_related_entities_service(
        db=db,
        entity_id=entity_id,
    )

    return {
        "entity": entity_response,
        "events": events,
        "related_entities": related_entities,
    }

@router.get(
    "/{entity_id}/related",
    response_model=RelatedEntityResponse,
)
def get_related_entities(
    entity_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entity = db.get(Entity, entity_id)

    if entity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entity not found",
        )

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
                    DocumentEntity.entity_id == entity_id,
                )
            ),
            Entity.id != entity_id,
        )
        .distinct()
        .order_by(Entity.name.asc())
    )

    related_entities = db.scalars(related_statement).all()

    return {
        "items": [
            {
                "id": related_entity.id,
                "name": related_entity.name,
                "type": related_entity.type,
                "ticker_symbol": related_entity.ticker_symbol,
                "reason": "Shares documents with this entity",
            }
            for related_entity in related_entities
        ]
    }

@router.get("/{entity_id}", response_model=EntityResponse)
def get_entity(
    entity_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entity = db.get(Entity, entity_id)

    if entity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entity not found",
        )

    subscription_statement = select(Subscription.id).where(
        Subscription.user_id == current_user.id,
        Subscription.entity_id == entity_id,
    )

    is_subscribed = (
        db.scalar(subscription_statement) is not None
    )

    return build_entity_response(
        entity,
        is_subscribed=is_subscribed,
    )