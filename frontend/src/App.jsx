
import { useEffect, useMemo, useState, useCallback } from "react";
import { getEvents, getEntities, searchEntities, getEntity, followEntity, unfollowEntity, getSubscriptions } from "./api";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { useAuth } from "./auth/useAuth";

/**
 * Design notes
 * ------------
 * SignalScope reads as a briefing memo, not a metrics dashboard: an
 * editorial serif (Fraunces) carries entity names and the page title,
 * a technical sans (IBM Plex Sans) carries UI chrome and body copy.
 *
 * One accent color (cobalt) marks what's new/actionable; a second
 * (sage) marks what's been verified via evidence. Event type is
 * communicated first through a colored spine on the left edge of each
 * card, so the badge itself can stay quiet. Evidence renders as a
 * numbered source list — it's genuinely a sequence of citations, so
 * numbering earns its place here.
 *
 * Add these to your index.html <head> (or import via your CSS entry):
 * <link rel="preconnect" href="https://fonts.googleapis.com">
 * <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
 */

const INK = "#171B21";
const PAPER = "#F4F5F7";
const SURFACE = "#FFFFFF";
const LINE = "#E1E4E9";
const MUTED = "#667085";
const COBALT = "#3457D5"; // new / primary actionable
const SAGE = "#4B7F52"; // verified / evidence
const AMBER = "#B8780F"; // price movement
const RUST = "#B42318"; // errors

const EVENT_TYPE_META = {
  product_launch: { label: "Product launch", color: COBALT },
  price_change: { label: "Price change", color: AMBER },
};

function getEventTypeMeta(eventType) {
  return (
    EVENT_TYPE_META[eventType] || {
      label: eventType || "Unclassified",
      color: MUTED,
    }
  );
}

function formatDetectedAt(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isRecent(value, hours = 24) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() < hours * 60 * 60 * 1000;
}

function ExternalIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className="inline-block"
      aria-hidden="true"
    >
      <path
        d="M4 2H2.5A1.5 1.5 0 0 0 1 3.5v6A1.5 1.5 0 0 0 2.5 11h6A1.5 1.5 0 0 0 10 9.5V8M7 1h4v4M11 1 5.5 6.5"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EvidenceItem({ document, index }) {
  return (
    <li className="flex gap-3 py-2.5 first:pt-0">
      <span
        className="mt-0.5 shrink-0 font-['IBM_Plex_Sans'] text-xs tabular-nums"
        style={{ color: MUTED }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium" style={{ color: INK }}>
          {document.title || "Untitled source"}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: MUTED }}>
          {document.source || "Unknown source"}
        </p>
        {document.url ? (
          <a
            href={document.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium hover:underline"
            style={{ color: SAGE }}
          >
            Open source
            <ExternalIcon />
          </a>
        ) : (
          <span className="mt-1 inline-block text-xs" style={{ color: MUTED }}>
            No link on file
          </span>
        )}
      </div>
    </li>
  );
}

function EventCard({ event, onEntityClick }) {
  const [expanded, setExpanded] = useState(false);
  const meta = getEventTypeMeta(event.event_type);
  const evidence = Array.isArray(event.evidence) ? event.evidence : [];
  const visibleEvidence = expanded ? evidence : evidence.slice(0, 2);
  const hiddenCount = evidence.length - visibleEvidence.length;
  const recent = isRecent(event.detected_at);

  return (
    <article
      className="flex overflow-hidden rounded-md"
      style={{ border: `1px solid ${LINE}`, background: SURFACE }}
    >
      <div className="w-1 shrink-0" style={{ background: meta.color }} />

      <div className="flex-1 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {recent && (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: COBALT }}
                aria-label="Detected in the last 24 hours"
                title="Detected in the last 24 hours"
              />
            )}
            <button
              type="button"
              onClick={() => {
                if (event.entity?.id) {
                  onEntityClick(event.entity.id);
                }
              }}
              disabled={!event.entity?.id}
              className="font-['Fraunces'] text-lg leading-tight text-left hover:underline disabled:cursor-default disabled:no-underline"
              style={{ color: INK }}
            >
              {event.entity?.name || "Unknown entity"}
            </button>
          </div>
          <span
            className="whitespace-nowrap font-['IBM_Plex_Sans'] text-xs"
            style={{ color: MUTED }}
          >
            {formatDetectedAt(event.detected_at)}
          </span>
        </div>

        <p
          className="mt-1 text-xs font-medium"
          style={{ color: meta.color }}
        >
          {meta.label}
        </p>

        <p className="mt-3 max-w-[68ch] text-[15px] leading-7" style={{ color: "#333A44" }}>
          {event.ai_summary || "No summary available."}
        </p>

        <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${LINE}` }}>
          {evidence.length === 0 ? (
            <p className="text-sm" style={{ color: MUTED }}>
              No evidence on file for this signal.
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                aria-expanded={expanded}
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: INK }}
              >
                Evidence
                <span
                  className="rounded-full px-1.5 py-0.5 font-['IBM_Plex_Sans'] text-xs tabular-nums"
                  style={{ background: PAPER, color: MUTED }}
                >
                  {evidence.length}
                </span>
              </button>

              <ul className="mt-1 divide-y" style={{ borderColor: LINE }}>
                {visibleEvidence.map((document, index) => (
                  <EvidenceItem
                    key={document.url || `${event.id}-evidence-${index}`}
                    document={document}
                    index={index}
                  />
                ))}
              </ul>

              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="mt-1 text-sm font-medium hover:underline"
                  style={{ color: SAGE }}
                >
                  Show {hiddenCount} more source{hiddenCount === 1 ? "" : "s"}
                </button>
              )}
              {expanded && evidence.length > 2 && (
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="mt-1 text-sm font-medium hover:underline"
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

function EntityRow({ entity, count, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-colors"
      style={{
        background: isSelected ? "rgba(52,87,213,0.08)" : "transparent",
        borderLeft: `2px solid ${isSelected ? COBALT : "transparent"}`,
        color: isSelected ? INK : "#3D4451",
      }}
    >
      <span className="truncate font-medium">{entity.name}</span>
      {typeof count === "number" && (
        <span className="shrink-0 font-['IBM_Plex_Sans'] text-xs tabular-nums" style={{ color: MUTED }}>
          {count}
        </span>
      )}
    </button>
  );
}

function ErrorPanel({ message, onRetry }) {
  return (
    <div
      className="rounded-md p-5"
      style={{ border: `1px solid #F1C4BE`, background: "#FDF3F1" }}
    >
      <p className="text-sm font-medium" style={{ color: RUST }}>
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-md px-4 py-2 text-sm font-medium text-white"
        style={{ background: RUST }}
      >
        Try again
      </button>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-md"
      style={{ border: `1px solid ${LINE}`, background: SURFACE }}
    >
      <div className="flex">
        <div className="w-1 shrink-0" style={{ background: LINE }} />
        <div className="flex-1 space-y-3 p-6">
          <div className="h-4 w-1/3 rounded" style={{ background: PAPER }} />
          <div className="h-3 w-1/2 rounded" style={{ background: PAPER }} />
          <div className="h-3 w-full rounded" style={{ background: PAPER }} />
          <div className="h-3 w-5/6 rounded" style={{ background: PAPER }} />
        </div>
      </div>
    </div>
  );
}

function App() {
  const { token, isAuthenticated, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState("login");
  const [events, setEvents] = useState([]);
  const [entities, setEntities] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [subscriptionsError, setSubscriptionsError] = useState(null);
  const [showHome, setShowHome] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [entitySearchResults, setEntitySearchResults] = useState([]);
  const [entitySearchLoading, setEntitySearchLoading] = useState(false);
  const [entitySearchError, setEntitySearchError] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedEntityLoading, setSelectedEntityLoading] = useState(false);
  const [selectedEntityError, setSelectedEntityError] = useState(null);
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState(null);
  const [selectedEventType, setSelectedEventType] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest");
  useEffect(() => {
    const query = searchQuery.trim();

    if (!query || !token) {
      return undefined;
    }

    if (query.length < 1 || !token) {
      return undefined;
    }

    let cancelled = false;

    async function runEntitySearch() {
      setEntitySearchLoading(true);
      setEntitySearchError(null);

      try {
        const data = await searchEntities({
          q: query,
          page: 1,
          limit: 20,
          token,
        });

        if (cancelled) return;

        setEntitySearchResults(
          Array.isArray(data?.results) ? data.results : []
        );
      } catch (error) {
        if (cancelled) return;
        setEntitySearchResults([]);
        setEntitySearchError(error);
      } finally {
        if (!cancelled) {
          setEntitySearchLoading(false);
        }
      }
    }

    runEntitySearch();

    return () => {
      cancelled = true;
    };
  }, [searchQuery, token]);
  useEffect(() => {
    if (!selectedEntityId || !token) {
    return undefined;
    }

    let cancelled = false;

    async function loadSelectedEntity() {
      setSelectedEntityLoading(true);
      setSelectedEntityError(null);

      try {
        const data = await getEntity(selectedEntityId, token);

        if (cancelled) return;

        setSelectedEntity(data);
      } catch (error) {
        if (cancelled) return;

        setSelectedEntity(null);
        setSelectedEntityError(error);
      } finally {
        if (!cancelled) {
          setSelectedEntityLoading(false);
        }
      }
    }

    loadSelectedEntity();

    return () => {
      cancelled = true;
    };
  }, [selectedEntityId, token]);
  const handleSubscriptionToggle = async () => {
    if (!selectedEntity || !token || subscriptionLoading) {
      return;
    }

    setSubscriptionLoading(true);
    setSubscriptionError(null);

    try {
      if (selectedEntity.is_subscribed) {
        await unfollowEntity(selectedEntity.id, token);
      } else {
        await followEntity(selectedEntity.id, token);
      }

      const updatedEntity = await getEntity(selectedEntity.id, token);

      setSelectedEntity(updatedEntity);

      setEntitySearchResults((currentResults) =>
        currentResults.map((entity) =>
          entity.id === updatedEntity.id
            ? {
              ...entity,
              is_subscribed: updatedEntity.is_subscribed,
            }
            : entity
        )
      );
      await loadSubscriptions();
    } catch (error) {
      setSubscriptionError(error);
    } finally {
      setSubscriptionLoading(false);
    }
  };
  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const data = await getEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      setEventsError(error);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const loadSubscriptions = useCallback(async () => {
    if (!token) {
      setSubscriptions([]);
      setSubscriptionsLoading(false);
      return;
    }

    setSubscriptionsLoading(true);
    setSubscriptionsError(null);

    try {
      const data = await getSubscriptions(token);
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch (error) {
      setSubscriptionsError(error);
    } finally {
      setSubscriptionsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    async function loadInitialData() {
      const [eventsResult, entitiesResult, subscriptionsResult] =
        await Promise.allSettled([
          getEvents(),
          getEntities(),
          getSubscriptions(token),
        ]);
      if (subscriptionsResult.status === "fulfilled") {
        setSubscriptions(
          Array.isArray(subscriptionsResult.value)
            ? subscriptionsResult.value
            : []
        );
      } else {
        setSubscriptionsError(subscriptionsResult.reason);
      }

      setSubscriptionsLoading(false);
      if (cancelled) return;

      if (eventsResult.status === "fulfilled") {
        setEvents(Array.isArray(eventsResult.value) ? eventsResult.value : []);
      } else {
        setEventsError(eventsResult.reason);
      }

      if (entitiesResult.status === "fulfilled") {
        setEntities(Array.isArray(entitiesResult.value) ? entitiesResult.value : []);
      } 
      setEventsLoading(false);
    }
    loadInitialData();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const eventCountByEntity = useMemo(() => {
    const counts = {};
    events.forEach((event) => {
      const id = event.entity?.id;
      if (id) counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  }, [events]);

  const availableEventTypes = useMemo(() => {
    const types = new Set();
    events.forEach((event) => {
      if (event.event_type) types.add(event.event_type);
    });
    return Array.from(types);
  }, [events]);

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = events.filter((event) => {
      if (selectedEntityId && selectedEntityId && event.entity?.id !== selectedEntityId) return false;
      if (selectedEventType && event.event_type !== selectedEventType) return false;
      if (query) {
        const haystack = `${event.entity?.name || ""} ${event.ai_summary || ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
    return [...filtered].sort((a, b) => {
      const aTime = new Date(a.detected_at).getTime() || 0;
      const bTime = new Date(b.detected_at).getTime() || 0;
      return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
    });
  }, [events, searchQuery, selectedEntityId, selectedEventType, sortOrder]);

  const activeFilterCount =
    (selectedEntityId ? 1 : 0) + (selectedEventType ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedEntityId(null);
    setSelectedEventType(null);
  };

  const selectedEntityName = entities.find((e) => e.id === selectedEntityId)?.name;
  const subscribedEntities = subscriptions
    .map((subscription) => subscription.entity)
    .filter(Boolean);
  if (loading) {
    return (

      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa]">
        <p className="text-sm text-[#687386]">Restoring your session...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    if (authScreen === "signup") {
      return (
        <SignupPage onSwitchToLogin={() => setAuthScreen("login")} />
      );
    }

    return (
      <LoginPage onSwitchToSignup={() => setAuthScreen("signup")} />
    );
  }

  return (
    <div className="min-h-screen font-['IBM_Plex_Sans']" style={{ background: PAPER, color: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        :focus-visible { outline: 2px solid ${COBALT}; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { .animate-pulse { animation: none; } }
      `}</style>

      <header
        className="sticky top-0 z-10 backdrop-blur"
        style={{ borderBottom: `1px solid ${LINE}`, background: "rgba(244,245,247,0.92)" }}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <div>
            <h1 className="font-['Fraunces'] text-[28px] leading-none" style={{ color: INK }}>
              SignalScope
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: MUTED }}>
              Tracking {entities.length} {entities.length === 1 ? "entity" : "entities"}, {events.length}{" "}
              {events.length === 1 ? "signal" : "signals"} detected
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowHome(true);
              setSelectedEntityId(null);
              setSelectedEntity(null);
              setSubscriptionError(null);
            }}
            className="rounded-md px-3 py-1.5 text-xs font-medium"
            style={{
              background: showHome ? COBALT : SURFACE,
              color: showHome ? "#FFFFFF" : INK,
              border: `1px solid ${showHome ? COBALT : LINE}`,
            }}
          >
            Home
          </button>
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entities"
              className="w-full rounded-md py-2.5 pl-3.5 pr-9 text-sm placeholder:text-[#8A93A3] focus:outline-none"
              style={{
                border: `1px solid ${LINE}`,
                background: SURFACE,
                color: INK,
              }}
              aria-label="Search entities"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear entity search"
                className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-sm"
                style={{ color: MUTED }}
              >
                ✕
              </button>
            )}

            {searchQuery.trim() && (
              <div
                className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-md"
                style={{
                  border: `1px solid ${LINE}`,
                  background: SURFACE,
                  boxShadow: "0 8px 24px rgba(23,27,33,0.08)",
                }}
              >
                {entitySearchLoading ? (
                  <div className="px-4 py-3 text-sm" style={{ color: MUTED }}>
                    Searching entities...
                  </div>
                ) : entitySearchError ? (
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium" style={{ color: RUST }}>
                      Couldn't search entities.
                    </p>
                    <p className="mt-1 text-xs" style={{ color: MUTED }}>
                      Try again in a moment.
                    </p>
                  </div>
                ) : entitySearchResults.length === 0 ? (
                  <div className="px-4 py-3">
                    <p className="text-sm" style={{ color: INK }}>
                      No entities found.
                    </p>
                    <p className="mt-1 text-xs" style={{ color: MUTED }}>
                      Try another name or ticker.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto py-1">
                    {entitySearchResults.map((entity) => (
                      <button
                        key={entity.id}
                        type="button"
                        onClick={() => {
                          setShowHome(false);
                          setSelectedEntityId(entity.id);
                          setSearchQuery("");
                        }}
                        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-[#F4F5F7]"
                      >
                        <div className="min-w-0">
                          <p
                            className="truncate text-sm font-medium"
                            style={{ color: INK }}
                          >
                            {entity.name}
                          </p>

                          <p className="mt-0.5 text-xs" style={{ color: MUTED }}>
                            {entity.type}
                            {entity.ticker_symbol
                              ? ` · ${entity.ticker_symbol}`
                              : ""}
                          </p>
                        </div>

                        <span
                          className="shrink-0 text-xs"
                          style={{
                            color: entity.is_subscribed ? SAGE : MUTED,
                          }}
                        >
                          {entity.is_subscribed ? "Following" : "Discover"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[240px_1fr]">
        {/* Watchlist */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-sm font-medium" style={{ color: INK }}>
              Watchlist
            </h2>
            {selectedEntityId && (
              <button
                type="button"
                onClick={() => setSelectedEntityId(null)}
                className="text-xs font-medium hover:underline"
                style={{ color: COBALT }}
              >
                Clear
              </button>
            )}
          </div>

          {subscriptionsLoading ? (
            <div className="space-y-1.5">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="h-9 animate-pulse rounded-md"
                  style={{ background: LINE, opacity: 0.5 }}
                />
              ))}
            </div>
          ) : subscriptionsError ? (
            <ErrorPanel
              message="Couldn't load your watchlist."
              onRetry={loadSubscriptions}
            />
          ) : subscribedEntities.length === 0 ? (
            <div className="px-1">
              <p className="text-sm" style={{ color: MUTED }}>
                You're not following any entities yet.
              </p>
              <p className="mt-1 text-xs" style={{ color: MUTED }}>
                Search for an entity to start following it.
              </p>
            </div>
          ) : (
            <nav className="space-y-0.5">
              {subscribedEntities.map((entity) => (
                <EntityRow
                  key={entity.id}
                  entity={entity}
                  count={eventCountByEntity[entity.id]}
                  isSelected={selectedEntityId === entity.id}
                  onSelect={() => {
                    setShowHome(false);
                    setSelectedEntityId(
                      selectedEntityId === entity.id ? null : entity.id
                    );
                  }}
                />
              ))}
            </nav>
          )}
        </aside>

        {/* Feed */}
        <main>
          {!eventsLoading && !eventsError && events.length > 0 && (
            <div className="mb-5 flex flex-col gap-3">
              {selectedEntityId && (
                <section className="mb-6">
                  {selectedEntityLoading ? (
                    <div
                      className="animate-pulse rounded-md p-6"
                      style={{
                        border: `1px solid ${LINE}`,
                        background: SURFACE,
                      }}
                    >
                      <div
                        className="h-5 w-1/3 rounded"
                        style={{ background: PAPER }}
                      />
                      <div
                        className="mt-3 h-3 w-1/4 rounded"
                        style={{ background: PAPER }}
                      />
                      <div
                        className="mt-6 h-3 w-2/3 rounded"
                        style={{ background: PAPER }}
                      />
                    </div>
                  ) : selectedEntityError ? (
                    <ErrorPanel
                      message="Couldn't load entity details."
                      onRetry={() => {
                        setSelectedEntityId(null);
                        setTimeout(() => setSelectedEntityId(selectedEntityId), 0);
                      }}
                    />
                  ) : selectedEntity ? (
                    <article
                      className="rounded-md p-6"
                      style={{
                        border: `1px solid ${LINE}`,
                        background: SURFACE,
                      }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p
                            className="text-xs font-medium uppercase tracking-wide"
                            style={{ color: MUTED }}
                          >
                            {selectedEntity.type}
                          </p>

                          <h2
                            className="mt-1 font-['Fraunces'] text-2xl"
                            style={{ color: INK }}
                          >
                            {selectedEntity.name}
                          </h2>

                          {selectedEntity.ticker_symbol && (
                            <p
                              className="mt-1 text-sm font-medium"
                              style={{ color: COBALT }}
                            >
                              {selectedEntity.ticker_symbol}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSubscriptionToggle}
                            disabled={subscriptionLoading}
                            className="rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                            style={{
                              background: selectedEntity.is_subscribed ? MUTED : COBALT,
                            }}
                          >
                            {subscriptionLoading
                              ? "Updating..."
                              : selectedEntity.is_subscribed
                                ? "Unfollow"
                                : "Follow"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEntityId(null);
                              setSubscriptionError(null);
                            }}
                            className="rounded-md px-3 py-1.5 text-xs font-medium"
                            style={{
                              border: `1px solid ${LINE}`,
                              color: MUTED,
                              background: SURFACE,
                            }}
                          >
                            Close
                          </button>
                          {subscriptionError && (
                            <div
                              className="mt-4 rounded-md px-3 py-2"
                              style={{
                                border: `1px solid #F1C4BE`,
                                background: "#FDF3F1",
                              }}
                            >
                              <p className="text-xs font-medium" style={{ color: RUST }}>
                                {subscriptionError.message ||
                                  "Couldn't update your subscription."}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {Array.isArray(selectedEntity.aliases) &&
                        selectedEntity.aliases.length > 0 && (
                          <div
                            className="mt-6 pt-4"
                            style={{ borderTop: `1px solid ${LINE}` }}
                          >
                            <p
                              className="text-xs font-medium uppercase tracking-wide"
                              style={{ color: MUTED }}
                            >
                              Also known as
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2">
                              {selectedEntity.aliases.map((alias, index) => (
                                <span
                                  key={`${alias}-${index}`}
                                  className="rounded-full px-2.5 py-1 text-xs"
                                  style={{
                                    background: PAPER,
                                    color: INK,
                                  }}
                                >
                                  {String(alias)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      <div
                        className="mt-6 grid gap-4 pt-4 sm:grid-cols-2"
                        style={{ borderTop: `1px solid ${LINE}` }}
                      >
                        <div>
                          <p className="text-xs" style={{ color: MUTED }}>
                            Status
                          </p>
                          <p className="mt-1 text-sm font-medium" style={{ color: INK }}>
                            {selectedEntity.is_subscribed
                              ? "Following"
                              : "Not following"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs" style={{ color: MUTED }}>
                            Added
                          </p>
                          <p className="mt-1 text-sm font-medium" style={{ color: INK }}>
                            {formatDetectedAt(selectedEntity.created_at)}
                          </p>
                        </div>
                      </div>
                    </article>
                  ) : null}
                </section>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {availableEventTypes.map((type) => {
                  const meta = getEventTypeMeta(type);
                  const isSelected = selectedEventType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedEventType(isSelected ? null : type)}
                      aria-pressed={isSelected}
                      className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
                      style={{
                        border: `1px solid ${isSelected ? meta.color : LINE}`,
                        color: isSelected ? meta.color : "#3D4451",
                        background: isSelected ? SURFACE : "transparent",
                      }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                      {meta.label}
                    </button>
                  );
                })}

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="ml-auto rounded-md px-2.5 py-1.5 text-xs font-medium focus:outline-none"
                  style={{ border: `1px solid ${LINE}`, background: SURFACE, color: INK }}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>

              <p className="text-xs" style={{ color: MUTED }}>
                {activeFilterCount > 0 ? (
                  <>
                    Showing {filteredEvents.length} of {events.length}
                    {selectedEntityName ? ` for ${selectedEntityName}` : ""}
                    {" · "}
                    <button type="button" onClick={clearFilters} className="font-medium hover:underline" style={{ color: COBALT }}>
                      Clear filters
                    </button>
                  </>
                ) : (
                  `Showing all ${events.length} signals`
                )}
              </p>
            </div>
          )}

          {eventsLoading ? (
            <div className="space-y-5">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : eventsError ? (
            <ErrorPanel message="Couldn't load intelligence signals." onRetry={loadEvents} />
          ) : events.length === 0 ? (
            <div className="rounded-md p-8 text-center" style={{ border: `1px dashed ${LINE}` }}>
              <h3 className="font-['Fraunces'] text-lg" style={{ color: INK }}>
                No signals yet
              </h3>
              <p className="mx-auto mt-1.5 max-w-sm text-sm" style={{ color: MUTED }}>
                SignalScope hasn't detected anything from your sources. New signals will appear here as soon as they're found.
              </p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-md p-8 text-center" style={{ border: `1px dashed ${LINE}` }}>
              <h3 className="font-['Fraunces'] text-lg" style={{ color: INK }}>
                Nothing matches
              </h3>
              <p className="mt-1.5 text-sm" style={{ color: MUTED }}>
                Try a different search term or clear your filters.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-md px-4 py-2 text-sm font-medium text-white"
                style={{ background: COBALT }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onEntityClick={(entityId) => {
                    setShowHome(false);
                    setSelectedEntityId(entityId);
                    setSearchQuery("");
                    setSelectedEventType(null);
                  }}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;