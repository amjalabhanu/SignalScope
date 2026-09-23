from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.document import Document
from app.models.entity import Entity
from app.models.event import Event
from app.models.event_evidence import EventEvidence
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.feed import FeedResponse


router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("", response_model=FeedResponse)
def get_personalized_feed(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * limit

    # Base query: events belonging to entities followed by this user.
    base_filter = (
        Subscription.user_id == current_user.id
    )

    total_statement = (
        select(func.count(Event.id))
        .join(
            Subscription,
            Subscription.entity_id == Event.primary_entity_id,
        )
        .where(base_filter)
    )

    total = db.scalar(total_statement) or 0

    event_statement = (
        select(Event, Entity)
        .join(
            Subscription,
            Subscription.entity_id == Event.primary_entity_id,
        )
        .join(
            Entity,
            Entity.id == Event.primary_entity_id,
        )
        .where(base_filter)
        .order_by(
            Event.detected_at.desc(),
            Event.id.desc(),
        )
        .offset(offset)
        .limit(limit)
    )

    event_rows = db.execute(event_statement).all()

    items = []

    for event, entity in event_rows:
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

        evidence = [
            {
                "title": document.raw_title,
                "source": document.source_name,
                "url": document.source_url,
                "published_at": document.published_at,
            }
            for document in documents
        ]

        items.append(
            {
                "id": event.id,
                "event_type": event.event_type,
                "entity": {
                    "id": entity.id,
                    "name": entity.name,
                    "type": entity.type,
                    "ticker_symbol": entity.ticker_symbol,
                },
                "ai_summary": event.ai_summary,
                "detected_at": event.detected_at,
                "evidence": evidence,
            }
        )

    has_more = offset + len(items) < total

    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total,
        "has_more": has_more,
    }