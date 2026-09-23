// Design tokens for SignalScope — "wire desk" identity.
//
// Concept: this isn't a metrics dashboard, it's a signals desk — closer to
// a wire terminal or an analyst's dossier than a SaaS product. Dark ink
// background so cards read like backlit terminal panels. Monospace carries
// every piece of machine-detected metadata (timestamps, event codes,
// tickers) to signal "this was detected, not written" — while a serif
// (Fraunces) carries entity names and gives them editorial weight, the way
// a wire service headline gets set differently from its byline.
//
// Add to index.html <head>:
// <link rel="preconnect" href="https://fonts.googleapis.com">
// <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,800&family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

export const INK = "#0F1216";          // page background
export const PANEL = "#161A20";        // header / sidebar background
export const SURFACE = "#1B2027";      // card background
export const SURFACE_RAISED = "#20262E"; // hovered / active surface
export const LINE = "#2A303A";         // hairlines
export const LINE_BRIGHT = "#3A4250";  // emphasized hairlines

export const TEXT = "#ECEEF1";         // primary text on dark
export const TEXT_DIM = "#B7BEC9";     // secondary text on dark
export const MUTED = "#7A8393";        // tertiary / meta text

export const SIGNAL = "#E8A33D";       // primary accent — "live wire" amber
export const SIGNAL_DIM = "#8A6529";   // amber for borders/dividers on dark
export const VERIFIED = "#6FB48A";     // evidence / confirmed sage-green
export const ALERT = "#E2725B";        // errors, price drops

export const SHADOW_MD = "0 8px 24px rgba(0,0,0,0.35)";
export const SHADOW_LG = "0 20px 48px rgba(0,0,0,0.45)";

export const EVENT_TYPE_META = {
  product_launch: { label: "PRODUCT_LAUNCH", color: SIGNAL },
  price_change: { label: "PRICE_CHANGE", color: ALERT },
};

export function getEventTypeMeta(eventType) {
  return (
    EVENT_TYPE_META[eventType] || {
      label: (eventType || "UNCLASSIFIED").toUpperCase(),
      color: MUTED,
    }
  );
}

export const GLOBAL_FONT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,800&family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
  :focus-visible { outline: 2px solid ${SIGNAL}; outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { .animate-pulse { animation: none; } }
  ::selection { background: rgba(232,163,61,0.25); }
`;