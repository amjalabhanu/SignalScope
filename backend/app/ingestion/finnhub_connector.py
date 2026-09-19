import requests

from app.config import settings


def fetch_quote(ticker: str) -> dict | None:
    """
    Fetch the latest stock quote for a ticker from Finnhub.

    This connector only talks to Finnhub.
    It does not know anything about SignalScope entities,
    documents, events, or the database.
    """

    url = "https://finnhub.io/api/v1/quote"

    params = {
        "symbol": ticker,
        "token": settings.FINNHUB_API_KEY,
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()

        data = response.json()

        # Finnhub returns an empty/zero-valued quote when it cannot
        # provide usable data for the requested ticker.
        if not data or data.get("c") is None or data.get("t") is None:
            return None

        return data

    except requests.RequestException:
        return None