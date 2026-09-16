import json
import logging

from google import genai

from app.config import settings


logger = logging.getLogger(__name__)

client = genai.Client(api_key=settings.GEMINI_API_KEY)


def extract_event(document_text, linked_entities):
    # Only product entities can be the primary entity
    # of a product launch event.
    product_entities = [
        entity
        for entity in linked_entities
        if entity["type"] == "product"
    ]

    # If the document has no resolved product entity,
    # there is nothing that can become a product-launch event.
    if not product_entities:
        return None

    entity_context = "\n".join(
        f"- {entity['name']} ({entity['type']})"
        for entity in linked_entities
    )

    product_names = {
        entity["name"]
        for entity in product_entities
    }

    prompt = f"""
Determine whether the following document describes a PRODUCT LAUNCH.

Only consider entities that have already been resolved for this document.

Resolved entities:
{entity_context}

If the document describes a product launch, return ONLY this JSON:

{{
  "is_product_launch": true,
  "product_entity_name": "EXACT PRODUCT NAME",
  "summary": "Short description of what happened."
}}

The product_entity_name MUST be exactly one of the
already-resolved entities whose type is "product".

Do NOT invent a product entity.
Do NOT use a company as product_entity_name.

If the document does not describe a product launch, return ONLY:

{{
  "is_product_launch": false
}}

Document:
{document_text}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config={"response_mime_type": "application/json"},
    )

    content = response.text

    if not content:
        raise ValueError("Gemini returned an empty response")

    result = json.loads(content)

    if not isinstance(result, dict):
        raise ValueError("Gemini event response must be a JSON object")

    if "is_product_launch" not in result:
        raise ValueError(
            "Gemini event response must contain is_product_launch"
        )

    if not isinstance(result["is_product_launch"], bool):
        raise ValueError("is_product_launch must be a boolean")

    # A non-launch is valid and needs no further validation.
    if result["is_product_launch"] is False:
        return result

    product_entity_name = result.get("product_entity_name")

    # A launch without a usable product entity cannot create
    # an event in this sprint.
    if not product_entity_name:
        logger.warning(
            "Gemini detected a product launch but did not provide "
            "a product entity name."
        )
        return None

    if product_entity_name not in product_names:
        logger.warning(
            "Gemini returned an unknown product entity: %s",
            product_entity_name,
        )
        return None

    summary = result.get("summary")

    if not isinstance(summary, str) or not summary.strip():
        logger.warning(
            "Gemini detected a product launch but returned "
            "an invalid summary."
        )
        return None

    return {
        "is_product_launch": True,
        "product_entity_name": product_entity_name,
        "summary": summary.strip(),
    }