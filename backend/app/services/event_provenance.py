from collections.abc import Iterable

from app.models.document import Document
from app.services.source_identity import normalize_source_identity


def build_event_provenance(
    documents: Iterable[Document],
) -> dict:
    evidence = []
    source_ids = set()

    for document in documents:
        source_id = normalize_source_identity(
            source_name=document.source_name,
            source_type=document.source_type,
            source_url=document.source_url,
        )

        source_ids.add(source_id)

        evidence.append(
            {
                "title": document.raw_title,
                "source": document.source_name,
                "url": document.source_url,
                "published_at": document.published_at,
                "source_id": source_id,
                "source_type": document.source_type,
                "source_name": document.source_name,
            }
        )

    evidence_count = len(evidence)
    source_count = len(source_ids)

    return {
        "evidence": evidence,
        "evidence_count": evidence_count,
        "source_count": source_count,
        "status": (
            "corroborated"
            if source_count >= 2
            else "detected"
        ),
    }
