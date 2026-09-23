import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Event(Base):
    __tablename__ = "events"
    __table_args__ = (
        Index(
            "ix_events_entity_type_detected_at",
            "primary_entity_id",
            "event_type",
            "detected_at",
        ),
    )

    # Unique identifier for this event.
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # We keep this as a string rather than an enum so that
    # additional event types can be introduced later
    # without changing the database schema.
    event_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    # The product entity that this event is primarily about.
    # An event cannot exist without a resolved product.
    primary_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("entities.id"),
        nullable=False,
    )

    # AI-generated interpretation of what happened.
    # This is kept separate from deterministic event fields.
    ai_summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # When SignalScope detected this event.
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )