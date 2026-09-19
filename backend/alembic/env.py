import sys
sys.path.append("/app")

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.config import settings
from app.database import Base
from app.models.document import Document
from app.models.entity import Entity
from app.models.document_entity import DocumentEntity
from app.models.event import Event
from app.models.event_evidence import EventEvidence
from app.models.entity_attribute_history import EntityAttributeHistory

target_metadata=Base.metadata

def run_migrations_online():
    configuration = {
        "sqlalchemy.url":settings.DATABASE_URL
    }
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()

run_migrations_online()
