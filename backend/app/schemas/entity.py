from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class EntityResponse(BaseModel):
    id: UUID
    name: str
    type: str
    aliases: list
    created_at: datetime