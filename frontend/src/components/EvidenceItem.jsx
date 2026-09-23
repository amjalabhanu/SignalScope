import { TEXT, TEXT_DIM, MUTED, VERIFIED } from "../constants/theme";

function ExternalIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="inline-block" aria-hidden="true">
      <path
        d="M4 2H2.5A1.5 1.5 0 0 0 1 3.5v6A1.5 1.5 0 0 0 2.5 11h6A1.5 1.5 0 0 0 10 9.5V8M7 1h4v4M11 1 5.5 6.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EvidenceItem({ document, index }) {
  return (
    <li className="flex gap-3.5 py-3 first:pt-0">
      <span className="mt-0.5 shrink-0 font-mono text-[11px] font-bold tabular-nums" style={{ color: VERIFIED }}>
        [{String(index + 1).padStart(2, "0")}]
      </span>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold" style={{ color: TEXT }}>
          {document.title || "Untitled source"}
        </p>

        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide" style={{ color: MUTED }}>
          {document.source || "Unknown source"}
        </p>

        {document.url ? (
          <a
            href={document.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1.5 inline-flex items-center gap-1 font-mono text-[11px] font-bold hover:underline"
            style={{ color: VERIFIED }}
          >
            OPEN_SOURCE
            <ExternalIcon />
          </a>
        ) : (
          <span className="mt-1.5 inline-block font-mono text-[11px]" style={{ color: MUTED }}>
            NO_LINK
          </span>
        )}
      </div>
    </li>
  );
}

export default EvidenceItem;