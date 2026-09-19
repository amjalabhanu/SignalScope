from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: UUID
    title: str
    source: str
    url: str
    published_at: datetime
    fetched_at: datetime
    processing_status: str