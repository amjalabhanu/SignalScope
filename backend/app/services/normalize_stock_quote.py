import hashlib
from datetime import datetime, timezone


def normalize_stock_quote(ticker: str, quote_data: dict) -> dict:
    """
    Convert raw Finnhub quote data into the shape expected
    by the existing documents table.
    """

    price = quote_data["c"]
    timestamp = quote_data["t"]

    # Finnhub gives the timestamp as Unix time (seconds).
    published_at = datetime.fromtimestamp(
        timestamp,
        tz=timezone.utc,
    )

    raw_content = f"{ticker} current price: {price}"

    # Deliberately exclude the timestamp from the hash.
    #
    # If we poll the same ticker and its price has not changed,
    # we want the same content_hash so the existing document
    # storage layer recognizes it as a duplicate.
    hash_input = f"{ticker}:{price}"

    content_hash = hashlib.sha256(
        hash_input.encode("utf-8")
    ).hexdigest()

    return {
        "source_type": "api",
        "source_name": "Finnhub",
        "raw_title": f"{ticker} price update",
        "raw_content": raw_content,
        "source_url": f"https://finnhub.io/quote/{ticker}",
        "content_hash": content_hash,
        "published_at": published_at,
    }