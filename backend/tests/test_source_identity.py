from datetime import datetime, timezone

from app.models.document import Document
from app.services.event_provenance import build_event_provenance
from app.services.source_identity import normalize_source_identity


def test_normalizes_hostname():
    assert (
        normalize_source_identity(
            "Example News",
            "rss",
            "https://www.Example.com/article/123",
        )
        == "example.com"
    )


def test_falls_back_to_name_and_type():
    assert (
        normalize_source_identity(
            "Reuters",
            "rss",
            None,
        )
        == "reuters:rss"
    )


def test_returns_unknown_when_metadata_missing():
    assert normalize_source_identity(None, None, None) == "unknown"


def make_document(
    source_name: str,
    source_type: str = "rss",
    source_url: str | None = None,
) -> Document:
    return Document(
        source_name=source_name,
        source_type=source_type,
        source_url=source_url or f"https://{source_name.lower()}.com/article",
        raw_title="Test article",
        raw_content="Test content",
        content_hash=f"{source_name}-{source_type}-{source_url}",
        published_at=datetime.now(timezone.utc),
    )


def test_provenance_counts_evidence():
    documents = [
        make_document("Reuters"),
        make_document("BBC"),
    ]

    result = build_event_provenance(documents)

    assert result["evidence_count"] == 2
    assert result["source_count"] == 2
    assert result["status"] == "corroborated"


def test_provenance_deduplicates_same_source():
    documents = [
        make_document(
            "Reuters",
            source_url="https://www.reuters.com/article/1",
        ),
        make_document(
            "Reuters",
            source_url="https://www.reuters.com/article/2",
        ),
    ]

    result = build_event_provenance(documents)

    assert result["evidence_count"] == 2
    assert result["source_count"] == 1
    assert result["status"] == "detected"


def test_single_source_is_detected():
    documents = [make_document("Reuters")]

    result = build_event_provenance(documents)

    assert result["evidence_count"] == 1
    assert result["source_count"] == 1
    assert result["status"] == "detected"


def test_empty_evidence_is_detected():
    result = build_event_provenance([])

    assert result["evidence"] == []
    assert result["evidence_count"] == 0
    assert result["source_count"] == 0
    assert result["status"] == "detected"