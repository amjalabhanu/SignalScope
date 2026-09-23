from urllib.parse import urlparse


def normalize_source_identity(
    source_name: str | None,
    source_type: str | None,
    source_url: str | None,
) -> str:
    """
    Return a deterministic source identity.

    Prefer the normalized hostname when available.
    Fall back to source name and source type.
    """
    hostname = ""

    if source_url:
        parsed = urlparse(source_url.strip().lower())
        hostname = parsed.hostname or ""

        if hostname.startswith("www."):
            hostname = hostname[4:]

    if hostname:
        return hostname

    name = (source_name or "").strip().lower()
    source_kind = (source_type or "").strip().lower()

    if name and source_kind:
        return f"{name}:{source_kind}"

    return name or source_kind or "unknown"
