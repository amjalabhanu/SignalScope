from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, aliased

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.document_entity import DocumentEntity
from app.models.entity import Entity
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.recommendation import RecommendationResponse


router = APIRouter(
    prefix="/recommendations",
    tags=["recommendations"],
)


@router.get("", response_model=RecommendationResponse)
def get_recommendations(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    followed_entity_ids = select(Subscription.entity_id).where(
        Subscription.user_id == current_user.id,
    )

    followed_document_entities = aliased(DocumentEntity)
    candidate_document_entities = aliased(DocumentEntity)

    candidate_filter = [
        followed_document_entities.entity_id.in_(followed_entity_ids),
        candidate_document_entities.document_id
        == followed_document_entities.document_id,
        candidate_document_entities.entity_id
        != followed_document_entities.entity_id,
        ~candidate_document_entities.entity_id.in_(followed_entity_ids),
    ]

    total_statement = (
        select(func.count(func.distinct(candidate_document_entities.entity_id)))
        .select_from(followed_document_entities)
        .join(
            candidate_document_entities,
            candidate_document_entities.document_id
            == followed_document_entities.document_id,
        )
        .where(*candidate_filter)
    )

    total = db.scalar(total_statement) or 0

    recommendation_statement = (
        select(Entity)
        .join(
            candidate_document_entities,
            candidate_document_entities.entity_id == Entity.id,
        )
        .join(
            followed_document_entities,
            candidate_document_entities.document_id
            == followed_document_entities.document_id,
        )
        .where(*candidate_filter)
        .distinct()
        .order_by(Entity.name.asc())
        .offset((page - 1) * limit)
        .limit(limit)
    )

    entities = db.scalars(recommendation_statement).all()

    items = [
        {
            "entity": {
                "id": entity.id,
                "name": entity.name,
                "type": entity.type,
                "ticker_symbol": entity.ticker_symbol,
            },
            "reason": "Shares documents with entities you follow",
        }
        for entity in entities
    ]

    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total,
        "has_more": (page - 1) * limit + len(items) < total,
    }
