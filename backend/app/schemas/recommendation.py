from uuid import UUID

from pydantic import BaseModel


class RecommendationEntity(BaseModel):
    id: UUID
    name: str
    type: str
    ticker_symbol: str | None = None


class RecommendationItem(BaseModel):
    entity: RecommendationEntity
    reason: str


class RecommendationResponse(BaseModel):
    items: list[RecommendationItem]
    page: int
    limit: int
    total: int
    has_more: bool
