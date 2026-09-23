export function normalizeEvent(event) {
  if (!event || typeof event !== "object") {
    return null;
  }

  return {
    id: event.id ?? null,
    event_type: event.event_type ?? "unknown_event",
    entity: event.entity
      ? {
          id: event.entity.id ?? null,
          name: event.entity.name ?? "Unknown entity",
          type: event.entity.type ?? "unknown",
          ...(event.entity.ticker_symbol !== undefined
            ? { ticker_symbol: event.entity.ticker_symbol }
            : {}),
        }
      : null,
    ai_summary: event.ai_summary ?? "",
    detected_at: event.detected_at ?? null,
    evidence: Array.isArray(event.evidence)
      ? event.evidence
      : [],
  };
}

export function normalizeEvents(events) {
  if (!Array.isArray(events)) {
    return [];
  }

  return events
    .map(normalizeEvent)
    .filter(Boolean);
}

export function formatEventType(eventType) {
  if (!eventType) {
    return "UNKNOWN EVENT";
  }

  return String(eventType)
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toUpperCase();
}