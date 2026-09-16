import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Entity(Base):
    # This table stores the canonical entities that SignalScope discovers.
    # Examples: Nike (company), Pegasus 42 (product).
    __tablename__ = "entities"

    # UUID gives every entity its own unique database identifier.
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Canonical name of the entity.
    name: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    # Entity category, such as "company" or "product".
    type: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    # Alternate names that can later be used during entity resolution.
    # A new entity starts with an empty list of aliases.
    aliases: Mapped[list] = mapped_column(
        JSONB,
        default=list,
        server_default="[]",
        nullable=False,
    )

    # Time when this entity was first created.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )