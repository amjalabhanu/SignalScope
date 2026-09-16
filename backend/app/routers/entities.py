from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.entity import Entity

router = APIRouter(prefix="/entities", tags=["entities"])


@router.get("")
def get_entities(db: Session = Depends(get_db)):
    statement = (
        select(Entity)
        .order_by(Entity.name.asc())
    )

    entities = db.scalars(statement).all()

    return [
        {
            "id": entity.id,
            "name": entity.name,
            "type": entity.type,
            "aliases": entity.aliases,
            "created_at": entity.created_at,
        }
        for entity in entities
    ]