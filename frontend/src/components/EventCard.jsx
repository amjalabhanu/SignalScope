import { useState } from "react";
import { formatDetectedAt, isRecent } from "../utils/formatters";
import { SIGNAL, TEXT, TEXT_DIM, LINE, LINE_BRIGHT, MUTED, SURFACE, VERIFIED, getEventTypeMeta } from "../constants/theme";
import EvidenceItem from "./EvidenceItem";

function EventCard({ event, onEntityClick }) {
  const [expanded, setExpanded] = useState(false);

  const meta = getEventTypeMeta(event.event_type);
  const evidence = Array.isArray(event.evidence) ? event.evidence : [];
  const visibleEvidence = expanded ? evidence : evidence.slice(0, 2);
  const hiddenCount = evidence.length - visibleEvidence.length;
  const recent = isRecent(event.detected_at);

  return (
    <article
      className="overflow-hidden rounded-md transition-colors hover:border-[color:var(--line-bright)]"
      style={{ border: `1px solid ${LINE}`, background: SURFACE, "--line-bright": LINE_BRIGHT }}
    >
      {/* metadata strip — the "wire header" */}
      <div
        className="flex items-center justify-between gap-3 px-6 py-2.5"
        style={{ background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${LINE}` }}
      >
        <div className="flex items-center gap-2.5 font-mono text-[11px] font-bold uppercase tracking-wide">
          {recent && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: SIGNAL, boxShadow: `0 0 6px ${SIGNAL}` }}
              aria-label="Detected in the last 24 hours"
              title="Detected in the last 24 hours"
            />
          )}
          <span style={{ color: meta.color }}>{meta.label}</span>
        </div>
        <span className="font-mono text-[11px]" style={{ color: MUTED }}>
          {formatDetectedAt(event.detected_at)}
        </span>
      </div>

      <div className="px-6 py-5 sm:px-7 sm:py-6">
        <button
          type="button"
          onClick={() => {
            if (event.entity?.id && onEntityClick) {
              onEntityClick(event.entity.id);
            }
          }}
          disabled={!event.entity?.id || !onEntityClick}
          className="text-left font-['Fraunces'] text-[22px] font-bold leading-tight hover:underline disabled:cursor-default disabled:no-underline"
          style={{ color: TEXT }}
        >
          {event.entity?.name || "Unknown entity"}
        </button>

        <p className="mt-3 max-w-[68ch] text-[15px] leading-7" style={{ color: TEXT_DIM }}>
          {event.ai_summary || "No summary available."}
        </p>

        <div className="mt-5 border-t pt-4" style={{ borderColor: LINE }}>
          {evidence.length === 0 ? (
            <p className="font-mono text-xs" style={{ color: MUTED }}>
              NO_EVIDENCE_ON_FILE
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                aria-expanded={expanded}
                className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wide"
                style={{ color: VERIFIED }}
              >
                Evidence
                <span
                  className="rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums"
                  style={{ background: "rgba(111,180,138,0.12)", color: VERIFIED }}
                >
                  {evidence.length}
                </span>
              </button>

              <ul className="mt-1.5 divide-y" style={{ borderColor: LINE }}>
                {visibleEvidence.map((document, index) => (
                  <EvidenceItem key={document.url || `${event.id}-evidence-${index}`} document={document} index={index} />
                ))}
              </ul>

              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="mt-1.5 font-mono text-xs font-bold hover:underline"
                  style={{ color: MUTED }}
                >
                  + {hiddenCount} more source{hiddenCount === 1 ? "" : "s"}
                </button>
              )}

              {expanded && evidence.length > 2 && (
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="mt-1.5 font-mono text-xs font-bold hover:underline"
                  style={{ color: MUTED }}
                >
                  Show less
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default EventCard;