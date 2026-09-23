from sqlalchemy import select

from app.models.event_evidence import EventEvidence


def attach_event_evidence(
    db_session,
    event_id,
    document_id,
) -> bool:
    existing_evidence = db_session.scalar(
        select(EventEvidence).where(
            EventEvidence.event_id == event_id,
            EventEvidence.document_id == document_id,
        )
    )

    if existing_evidence:
        return False

    evidence = EventEvidence(
        event_id=event_id,
        document_id=document_id,
    )

    db_session.add(evidence)
    db_session.flush()

    return True