import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class EntityAttributeHistory(Base):
    # Stores historical observations about an entity.
    #
    # Example:
    # Tesla -> price -> 420.50
    # Tesla -> price -> 425.10
    #
    # The table is intentionally generic so we can later store other
    # attributes without creating a new table for every attribute type.
    __tablename__ = "entity_attribute_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # The entity whose attribute we observed.
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("entities.id"),
        nullable=False,
    )

    # Examples: "price", "market_cap", etc.
    attribute_name: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    # Stored as text so this table can support different attribute types
    # without requiring a database schema change later.
    attribute_value: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    # When this attribute value was observed.
    observed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    # Every observation must point back to the document that reported it.
    # This preserves SignalScope's evidence-first design.
    source_document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id"),
        nullable=False,
    )