from uuid import UUID

from pydantic import BaseModel

from app.schemas.event import EventResponse
from app.schemas.entity import EntityResponse
from app.schemas.related import RelatedEntity


class EntityEventsResponse(BaseModel):
    items: list[EventResponse]
    page: int
    limit: int
    total: int
    has_more: bool


class EntityIntelligenceResponse(BaseModel):
    entity: EntityResponse
    events: EntityEventsResponse
    related_entities: list[RelatedEntity]