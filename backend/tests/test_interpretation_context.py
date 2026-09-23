from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

from app.services.interpretation_context import (
    build_interpretation_context,
)


def test_build_interpretation_context_with_evidence():
    event = SimpleNamespace(
        event_type="product_launch",
        ai_summary="A new product was announced.",
        detected_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
    )

    entity = SimpleNamespace(
        name="Example Company",
        type="company",
    )

    document = SimpleNamespace(
        source_name="Example News",
        raw_title="Example Product Launch",
        source_url="https://example.com/news",
        published_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        raw_content="The company announced a new product.",
    )

    context = build_interpretation_context(
        event=event,
        entity=entity,
        documents=[document],
    )

    assert "Example Company" in context
    assert "product_launch" in context
    assert "Example Product Launch" in context
    assert "The company announced a new product." in context
    assert "EVIDENCE 1" in context


def test_build_interpretation_context_without_evidence():
    event = SimpleNamespace(
        event_type="partnership",
        ai_summary="A partnership was announced.",
        detected_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
    )

    entity = SimpleNamespace(
        name="Example Company",
        type="company",
    )

    context = build_interpretation_context(
        event=event,
        entity=entity,
        documents=[],
    )

    assert "Example Company" in context
    assert "No supporting evidence documents are available." in context


def test_context_handles_missing_optional_fields():
    event = SimpleNamespace(
        event_type="platform_update",
        ai_summary="A platform update was announced.",
        detected_at=None,
    )

    entity = SimpleNamespace(
        name="Example Company",
        type="company",
    )

    document = SimpleNamespace(
        source_name="Example Source",
        raw_title=None,
        source_url=None,
        published_at=None,
        raw_content=None,
    )

    context = build_interpretation_context(
        event=event,
        entity=entity,
        documents=[document],
    )

    assert "EVENT DETECTED AT:\nUnknown" in context
    assert "Title: Untitled" in context
    assert "URL: Unavailable" in context
    assert "Published At: Unknown" in context