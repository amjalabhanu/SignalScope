from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.interpretation import EventInterpretationResponse
from app.services.event_interpretation import (
    generate_event_interpretation,
)

router = APIRouter(
    prefix="/events",
    tags=["interpretations"],
)


@router.post(
    "/{event_id}/interpretation",
    response_model=EventInterpretationResponse,
)
def create_event_interpretation(
    event_id: UUID,
    force_regenerate: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    try:
        interpretation = generate_event_interpretation(
            db=db,
            event_id=event_id,
            force_regenerate=force_regenerate,
        )

        db.commit()
        db.refresh(interpretation)

        return interpretation

    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to generate event interpretation",
        )