import pytest
from pydantic import ValidationError

from app.schemas.interpretation import (
    EventInterpretationResult,
    ImpactArea,
)


def test_valid_interpretation_result():
    result = EventInterpretationResult(
        status="generated",
        significance="The event indicates a product-related change.",
        why_it_matters="It may affect how customers use the product.",
        impact_areas=[
            ImpactArea(
                area="product",
                explanation="The product behavior may change.",
                basis="The event describes a product update.",
            )
        ],
        known_facts=["A product update was announced."],
        qualified_implications=["Users may need to adapt to the change."],
        uncertainties=["The rollout timeline is not specified."],
    )

    assert result.status == "generated"
    assert result.impact_areas[0].area == "product"


def test_invalid_impact_area_is_rejected():
    with pytest.raises(ValidationError):
        ImpactArea(
            area="politics",
            explanation="Unsupported area.",
            basis="No valid basis.",
        )


def test_insufficient_evidence_result():
    result = EventInterpretationResult(
        status="insufficient_evidence",
        uncertainties=["The supplied evidence lacks enough detail."],
    )

    assert result.status == "insufficient_evidence"
    assert result.significance is None
    assert result.why_it_matters is None


def test_text_is_normalized():
    result = EventInterpretationResult(
        status="generated",
        significance="  Important event.  ",
        known_facts=[" Fact one ", "", "   "],
    )

    assert result.significance == "Important event."
    assert result.known_facts == ["Fact one"]