import { useState } from "react";
import {
  formatDetectedAt,
  isRecent,
} from "../utils/formatters";
import {
  SIGNAL,
  TEXT,
  TEXT_DIM,
  LINE,
  MUTED,
  SURFACE,
  VERIFIED,
  getEventTypeMeta,
} from "../constants/theme";
import {
  normalizeEvent,
  formatEventType,
} from "../utils/eventUtils";
import EvidenceItem from "./EvidenceItem";

function EventCard({ event, onEntityClick }) {
  const [expanded, setExpanded] = useState(false);

  const normalizedEvent = normalizeEvent(event);

  if (!normalizedEvent) {
    return null;
  }

  const {
    entity,
    ai_summary: summary,
    detected_at: detectedAt,
    evidence,
  } = normalizedEvent;

  const eventType = normalizedEvent.event_type;
  const meta = getEventTypeMeta(eventType);

  const visibleEvidence = expanded
    ? evidence
    : evidence.slice(0, 2);

  const hiddenCount =
    evidence.length - visibleEvidence.length;

  const recent = isRecent(detectedAt);

  return (
    <article
      className="overflow-hidden rounded-md border"
      style={{
        background: SURFACE,
        borderColor: LINE,
      }}
    >
      <header
        className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3"
        style={{
          borderColor: LINE,
          background: "rgba(255,255,255,0.015)",
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: meta.color || SIGNAL }}
          >
            {formatEventType(eventType)}
          </span>

          {recent && (
            <span
              className="rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]"
              style={{
                color: SIGNAL,
                background: "rgba(232,163,61,0.08)",
              }}
            >
              LIVE
            </span>
          )}
        </div>

        <time
          className="font-mono text-[10px] uppercase tracking-[0.08em]"
          style={{ color: MUTED }}
          dateTime={detectedAt || undefined}
        >
          {formatDetectedAt(detectedAt)}
        </time>
      </header>

      <div className="px-5 py-5">
        {entity?.name ? (
          <button
            type="button"
            onClick={() => {
              if (entity.id && onEntityClick) {
                onEntityClick(entity.id);
              }
            }}
            disabled={!entity.id || !onEntityClick}
            className="mb-3 text-left font-['Fraunces'] text-2xl font-semibold tracking-tight transition-opacity hover:opacity-80 disabled:cursor-default disabled:hover:opacity-100"
            style={{ color: TEXT }}
          >
            {entity.name}
          </button>
        ) : (
          <div
            className="mb-3 font-['Fraunces'] text-2xl font-semibold tracking-tight"
            style={{ color: TEXT }}
          >
            Unknown entity
          </div>
        )}

        {summary && (
          <p
            className="max-w-3xl text-sm leading-7"
            style={{ color: TEXT_DIM }}
          >
            {summary}
          </p>
        )}

        {evidence.length > 0 && (
          <section
            className="mt-5 border-t pt-4"
            style={{ borderColor: LINE }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: VERIFIED }}
              >
                EVIDENCE
              </span>

              <span
                className="rounded-full px-1.5 py-0.5 font-mono text-[9px]"
                style={{
                  color: VERIFIED,
                  background: "rgba(111,180,138,0.1)",
                }}
              >
                {evidence.length}
              </span>
            </div>

            <div className="space-y-3">
              {visibleEvidence.map((item, index) => (
                <EvidenceItem
                  key={`${item.url || item.title || "evidence"}-${index}`}
                  evidence={item}
                  index={index}
                />
              ))}
            </div>

            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                className="mt-4 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
                style={{
                  color: VERIFIED,
                }}
              >
                {expanded
                  ? "SHOW_LESS"
                  : `SHOW_${hiddenCount}_MORE`}
              </button>
            )}
          </section>
        )}

        {!summary && evidence.length === 0 && (
          <p
            className="font-mono text-[10px] uppercase tracking-[0.08em]"
            style={{ color: MUTED }}
          >
            No additional signal details available.
          </p>
        )}
      </div>
    </article>
  );
}

export default EventCard;