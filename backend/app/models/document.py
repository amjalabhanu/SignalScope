import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

class Document(Base):
    __tablename__="documents"

    id:Mapped[uuid.UUID]=mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    source_type: Mapped[str]=mapped_column(String)
    source_name: Mapped[str]=mapped_column(String)
    raw_title: Mapped[str]=mapped_column(String)
    raw_content: Mapped[str]=mapped_column(Text)
    source_url: Mapped[str]=mapped_column(String)
    content_hash: Mapped[str]=mapped_column(
        String,
        unique=True,
        index=True,
    )
    processing_status: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="pending",
    )
    published_at: Mapped[datetime]=mapped_column(DateTime(timezone=True))
    fetched_at: Mapped[datetime]=mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
