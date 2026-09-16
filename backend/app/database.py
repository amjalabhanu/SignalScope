from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


# Every SQLAlchemy model in SignalScope will inherit from this Base.
# Keeping one shared Base means all models are registered in the same
# SQLAlchemy metadata registry.
class Base(DeclarativeBase):
    pass


# The engine manages the connection between our application
# and PostgreSQL.
engine = create_engine(settings.DATABASE_URL)

# SessionLocal creates database sessions.
# A session represents a unit of interaction with the database.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    # Create a new database session for the current request.
    db = SessionLocal()

    try:
        # Give the session to the FastAPI endpoint.
        yield db
    finally:
        # Always close the session when the request is finished.
        db.close()