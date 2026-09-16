from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.document import Document

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("")
def get_documents(db: Session = Depends(get_db)):
    statement = (
        select(Document)
        .order_by(Document.published_at.desc())
    )

    documents = db.scalars(statement).all()

    return [
        {
            "id": document.id,
            "title": document.raw_title,
            "source": document.source_name,
            "url": document.source_url,
            "published_at": document.published_at,
            "fetched_at": document.fetched_at,
            "processing_status": document.processing_status,
        }
        for document in documents
    ]