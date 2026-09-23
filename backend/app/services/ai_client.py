from google import genai

from app.config import settings


def get_gemini_client():
    return genai.Client(api_key=settings.GEMINI_API_KEY)
