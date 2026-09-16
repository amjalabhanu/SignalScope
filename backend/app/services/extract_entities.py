import json

from google import genai

from app.config import settings


# Create the Gemini client using the API key from configuration.
# The key itself is never hardcoded in this file.
client = genai.Client(api_key=settings.GEMINI_API_KEY)


def extract_entities(document_text: str) -> list[dict]:
    # Tell Gemini exactly what structure we expect.
    # The model should return only entity objects.
    prompt = """
Extract the entities mentioned in the following document.

Return ONLY a JSON array.
Each object must contain exactly:
- "name": the entity's name
- "type": either "company" or "product"

Do not return markdown.
Do not return explanations.
Do not return any text outside the JSON array.

Document:
""" + document_text

    # Ask Gemini to generate the extraction result.
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
        },
    )

    # Get Gemini's generated text.
    content = response.text

    if not content:
        raise ValueError("Gemini returned an empty response")

    # Parse the response as JSON.
    # Invalid JSON raises an exception instead of silently returning [].
    candidates = json.loads(content)

    # The top-level response must be a JSON array.
    if not isinstance(candidates, list):
        raise ValueError("Gemini response must be a JSON array")

    # Validate every candidate.
    for candidate in candidates:
        if not isinstance(candidate, dict):
            raise ValueError("Each entity candidate must be an object")

        if "name" not in candidate or "type" not in candidate:
            raise ValueError(
                "Each entity candidate must contain name and type"
            )

        if not isinstance(candidate["name"], str):
            raise ValueError("Entity name must be a string")

        if not isinstance(candidate["type"], str):
            raise ValueError("Entity type must be a string")

        if candidate["type"] not in {"company", "product"}:
            raise ValueError(
                f"Unsupported entity type: {candidate['type']}"
            )

    return candidates