from app.models.document import Document
from app.models.entity import Entity
from app.models.event import Event


def build_interpretation_context(
    event: Event,
    entity: Entity,
    documents: list[Document],
) -> str:
    """
    Build an evidence-grounded context for event interpretation.
    """

    detected_at = (
        event.detected_at.isoformat()
        if event.detected_at
        else "Unknown"
    )

    sections = [
        f"ENTITY:\n{entity.name}",
        f"ENTITY TYPE:\n{entity.type}",
        f"EVENT TYPE:\n{event.event_type}",
        f"EVENT SUMMARY:\n{event.ai_summary}",
        f"EVENT DETECTED AT:\n{detected_at}",
    ]

    evidence_sections: list[str] = []

    for index, document in enumerate(documents, start=1):
        published_at = (
            document.published_at.isoformat()
            if document.published_at
            else "Unknown"
        )

        evidence_sections.append(
            "\n".join(
                [
                    f"EVIDENCE {index}",
                    f"Source: {document.source_name}",
                    f"Title: {document.raw_title or 'Untitled'}",
                    f"URL: {document.source_url or 'Unavailable'}",
                    f"Published At: {published_at}",
                    f"Content:\n{document.raw_content or ''}",
                ]
            )
        )

    if evidence_sections:
        sections.append("\n\n".join(evidence_sections))
    else:
        sections.append(
            "No supporting evidence documents are available."
        )

    return "\n\n".join(sections)