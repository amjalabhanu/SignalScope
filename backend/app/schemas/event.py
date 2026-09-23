from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class EventEntity(BaseModel):
    id: UUID
    name: str
    type: str


class EventEvidence(BaseModel):
    title: str
    source: str
    url: str
    published_at: datetime | None = None
    source_id: str
    source_type: str | None = None
    source_name: str


class EventResponse(BaseModel):
    id: UUID
    event_type: str
    entity: EventEntity
    ai_summary: str
    detected_at: datetime
    evidence: list[EventEvidence]
    evidence_count: int
    source_count: int
    status: str
