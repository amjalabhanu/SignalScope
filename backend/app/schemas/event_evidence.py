from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class EvidenceDocument(BaseModel):
    id: UUID
    title: str
    source: str
    url: str
    published_at: datetime


class EventEvidenceResponse(BaseModel):
    id: UUID
    event_id: UUID
    document: EvidenceDocument
    created_at: datetime