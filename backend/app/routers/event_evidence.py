from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.event_evidence import EventEvidence
from app.models.document import Document

router = APIRouter(
    prefix="/event-evidence",
    tags=["event-evidence"],
)


@router.get("")
def get_event_evidence(db: Session = Depends(get_db)):
    statement = (
        select(EventEvidence, Document)
        .join(
            Document,
            EventEvidence.document_id == Document.id,
        )
        .order_by(EventEvidence.created_at.desc())
    )

    results = db.execute(statement).all()

    return [
        {
            "id": evidence.id,
            "event_id": evidence.event_id,
            "document": {
                "id": document.id,
                "title": document.raw_title,
                "source": document.source_name,
                "url": document.source_url,
                "published_at": document.published_at,
            },
            "created_at": evidence.created_at,
        }
        for evidence, document in results
    ]