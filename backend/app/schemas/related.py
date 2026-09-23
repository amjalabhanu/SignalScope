from uuid import UUID

from pydantic import BaseModel


class RelatedEntity(BaseModel):
    id: UUID
    name: str
    type: str
    ticker_symbol: str | None = None
    reason: str


class RelatedEntityResponse(BaseModel):
    items: list[RelatedEntity]
