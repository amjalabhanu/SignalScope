from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class EntitySummary(BaseModel):
    id: UUID
    name: str
    type: str
    ticker_symbol: str | None = None


class SubscriptionResponse(BaseModel):
    id: UUID
    entity_id: UUID
    created_at: datetime


class MySubscriptionResponse(BaseModel):
    id: UUID
    entity_id: UUID
    created_at: datetime
    entity: EntitySummary