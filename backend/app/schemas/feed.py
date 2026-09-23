from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class FeedEntity(BaseModel):
    id: UUID
    name: str
    type: str
    ticker_symbol: str | None = None


class FeedEvidence(BaseModel):
    title: str
    source: str
    url: str
    published_at: datetime | None = None


class FeedItem(BaseModel):
    id: UUID
    event_type: str
    entity: FeedEntity
    ai_summary: str
    detected_at: datetime
    evidence: list[FeedEvidence]


class FeedResponse(BaseModel):
    items: list[FeedItem]
    page: int
    limit: int
    total: int
    has_more: bool