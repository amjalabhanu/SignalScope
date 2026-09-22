from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.entity import Entity
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.subscription import (
    MySubscriptionResponse,
    SubscriptionResponse,
)


router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

@router.get("/me", response_model=list[MySubscriptionResponse])
def get_my_subscriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.execute(
        select(Subscription, Entity)
        .join(Entity, Subscription.entity_id == Entity.id)
        .where(Subscription.user_id == current_user.id)
        .order_by(Subscription.created_at.desc())
    ).all()

    return [
        {
            "id": subscription.id,
            "entity_id": subscription.entity_id,
            "created_at": subscription.created_at,
            "entity": {
                "id": entity.id,
                "name": entity.name,
                "type": entity.type,
                "ticker_symbol": entity.ticker_symbol,
            },
        }
        for subscription, entity in rows
    ]

@router.post(
    "/{entity_id}",
    response_model=SubscriptionResponse,
    status_code=status.HTTP_201_CREATED,
)
def follow_entity(
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

    existing_subscription = db.scalar(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.entity_id == entity_id,
        )
    )

    if existing_subscription:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already following this entity",
        )

    subscription = Subscription(
        user_id=current_user.id,
        entity_id=entity_id,
    )

    db.add(subscription)
    db.commit()
    db.refresh(subscription)

    return subscription


@router.delete("/{entity_id}", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_entity(
    entity_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subscription = db.scalar(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.entity_id == entity_id,
        )
    )

    if subscription is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found",
        )

    db.delete(subscription)
    db.commit()


