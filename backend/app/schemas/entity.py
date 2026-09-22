from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class EntityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    type: str
    aliases: list
    ticker_symbol: str | None = None
    created_at: datetime
    is_subscribed: bool = False


class EntitySearchResponse(BaseModel):
    results: list[EntityResponse]
    page: int
    limit: int
    total: int