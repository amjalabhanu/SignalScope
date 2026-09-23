import { formatDetectedAt } from "../utils/formatters";
import {
  SIGNAL,
  TEXT,
  TEXT_DIM,
  LINE,
  LINE_BRIGHT,
  MUTED,
  SURFACE,
  ALERT,
  SHADOW_MD,
  getEventTypeMeta,
} from "../constants/theme";
import ErrorPanel from "./ErrorPanel";
import EventCard from "./EventCard";

function EntityDetail({
  loading,
  error,
  entity,
  subscriptionLoading,
  subscriptionError,
  onToggleSubscription,
  onClose,
  onRetry,

  // Related entities
  relatedEntities = [],
  relatedLoading = false,
  relatedError = null,
  onRetryRelated,
  onSelectRelatedEntity,

  // Sprint 5 intelligence history
  intelligenceEvents = [],
  intelligenceLoading = false,
  intelligenceError = null,
  intelligenceHasMore = false,
  intelligenceLoadingMore = false,
  availableEventTypes = [],
  selectedEventType = null,
  onSelectEventType,
  onLoadMoreIntelligence,
  onRetryIntelligence,
}) {
  if (loading) {
    return (
      <div
        className="animate-pulse rounded-md p-7"
        style={{
          border: `1px solid ${LINE}`,
          background: SURFACE,
        }}
      >
        <div
          className="h-3 w-24 rounded"
          style={{ background: LINE }}
        />
        <div
          className="mt-4 h-7 w-1/3 rounded"
          style={{ background: LINE }}
        />
        <div
          className="mt-7 h-3 w-2/3 rounded"
          style={{ background: LINE }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorPanel
        message="Couldn't load entity details."
        onRetry={onRetry}
      />
    );
  }

  if (!entity) return null;

  return (
    <article
      className="overflow-hidden rounded-md"
      style={{
        border: `1px solid ${LINE_BRIGHT}`,
        background: SURFACE,
        boxShadow: SHADOW_MD,
      }}
    >
      {/* ───────────────── Identity ───────────────── */}

      <div className="px-7 pt-6">
        <p
          className="font-mono text-[10px] font-bold uppercase tracking-widest"
          style={{ color: MUTED }}
        >
          Dossier · {entity.type}
        </p>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 px-7 pt-2">
        <div>
          <h2
            className="font-['Fraunces'] text-[30px] font-extrabold leading-tight"
            style={{ color: TEXT }}
          >
            {entity.name}
          </h2>

          {entity.ticker_symbol && (
            <span
              className="mt-2 inline-block rounded px-2 py-0.5 font-mono text-xs font-bold"
              style={{
                color: SIGNAL,
                background: "rgba(232,163,61,0.1)",
                border: "1px solid rgba(232,163,61,0.3)",
              }}
            >
              {entity.ticker_symbol}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSubscription}
            disabled={subscriptionLoading}
            className="rounded px-4 py-2 font-mono text-xs font-bold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: entity.is_subscribed
                ? "transparent"
                : SIGNAL,
              color: entity.is_subscribed
                ? TEXT_DIM
                : "#171208",
              border: `1px solid ${
                entity.is_subscribed ? LINE_BRIGHT : SIGNAL
              }`,
            }}
          >
            {subscriptionLoading
              ? "Updating..."
              : entity.is_subscribed
                ? "Unfollow"
                : "+ Follow"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-2 font-mono text-xs font-bold uppercase tracking-wide"
            style={{
              border: `1px solid ${LINE_BRIGHT}`,
              color: MUTED,
            }}
          >
            Close
          </button>
        </div>
      </div>

      {subscriptionError && (
        <div
          className="mx-7 mt-4 rounded px-3.5 py-2.5"
          style={{
            border: "1px solid rgba(226,114,91,0.35)",
            background: "rgba(226,114,91,0.08)",
          }}
        >
          <p
            className="font-mono text-xs font-semibold"
            style={{ color: ALERT }}
          >
            {subscriptionError.message ||
              "Couldn't update your subscription."}
          </p>
        </div>
      )}

      {Array.isArray(entity.aliases) &&
        entity.aliases.length > 0 && (
          <div
            className="mx-7 mt-6 border-t pt-4"
            style={{ borderColor: LINE }}
          >
            <p
              className="font-mono text-[10px] font-bold uppercase tracking-widest"
              style={{ color: MUTED }}
            >
              Also known as
            </p>

            <div className="mt-2.5 flex flex-wrap gap-2">
              {entity.aliases.map((alias, index) => (
                <span
                  key={`${alias}-${index}`}
                  className="rounded px-2.5 py-1 font-mono text-xs"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    color: TEXT_DIM,
                    border: `1px solid ${LINE}`,
                  }}
                >
                  {String(alias)}
                </span>
              ))}
            </div>
          </div>
        )}

      <div
        className="mx-7 mb-7 mt-6 grid grid-cols-2 gap-5 border-t pt-5"
        style={{ borderColor: LINE }}
      >
        <div>
          <p
            className="font-mono text-[10px] font-bold uppercase tracking-widest"
            style={{ color: MUTED }}
          >
            Status
          </p>

          <p
            className="mt-1 text-[15px] font-semibold"
            style={{ color: TEXT }}
          >
            {entity.is_subscribed
              ? "Following"
              : "Not following"}
          </p>
        </div>

        <div>
          <p
            className="font-mono text-[10px] font-bold uppercase tracking-widest"
            style={{ color: MUTED }}
          >
            Added
          </p>

          <p
            className="mt-1 text-[15px] font-semibold"
            style={{ color: TEXT }}
          >
            {formatDetectedAt(entity.created_at)}
          </p>
        </div>
      </div>

      {/* ───────────────── Intelligence History ───────────────── */}

      <section
        className="mx-7 mb-7 border-t pt-6"
        style={{ borderColor: LINE }}
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p
              className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: SIGNAL }}
            >
              Intelligence
            </p>

            <h3
              className="mt-1 font-['Fraunces'] text-xl font-bold"
              style={{ color: TEXT }}
            >
              Event history
            </h3>

            <p
              className="mt-1 font-mono text-[10px]"
              style={{ color: TEXT_DIM }}
            >
              Signals detected for this entity.
            </p>
          </div>

          {!intelligenceLoading &&
            !intelligenceError &&
            intelligenceEvents.length > 0 && (
              <span
                className="font-mono text-[10px] uppercase tracking-wide"
                style={{ color: MUTED }}
              >
                {intelligenceEvents.length} loaded
              </span>
            )}
        </div>

        {/* Event type filter */}

        {!intelligenceLoading &&
          !intelligenceError &&
          availableEventTypes.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <div
                className="flex min-w-max items-center gap-1 border-b"
                style={{ borderColor: LINE }}
              >
                <button
                  type="button"
                  onClick={() => onSelectEventType(null)}
                  aria-pressed={!selectedEventType}
                  className="relative px-2.5 pb-2.5 pt-1 font-mono text-[10px] font-bold uppercase tracking-wide"
                  style={{
                    color: !selectedEventType ? TEXT : MUTED,
                  }}
                >
                  All

                  {!selectedEventType && (
                    <span
                      className="absolute bottom-[-1px] left-0 h-[2px] w-full"
                      style={{ background: SIGNAL }}
                    />
                  )}
                </button>

                {availableEventTypes.map((type) => {
                  const meta = getEventTypeMeta(type);
                  const isSelected =
                    selectedEventType === type;

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        onSelectEventType(
                          isSelected ? null : type
                        )
                      }
                      aria-pressed={isSelected}
                      className="relative flex items-center gap-1.5 px-2.5 pb-2.5 pt-1 font-mono text-[10px] font-bold uppercase tracking-wide"
                      style={{
                        color: isSelected
                          ? meta.color
                          : MUTED,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: meta.color,
                        }}
                      />

                      {meta.label}

                      {isSelected && (
                        <span
                          className="absolute bottom-[-1px] left-0 h-[2px] w-full"
                          style={{
                            background: meta.color,
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        {/* Intelligence loading */}

        {intelligenceLoading && (
          <div className="mt-5 space-y-3">
            <div
              className="h-36 animate-pulse rounded-md"
              style={{
                border: `1px solid ${LINE}`,
                background: "rgba(255,255,255,0.02)",
              }}
            />

            <div
              className="h-36 animate-pulse rounded-md"
              style={{
                border: `1px solid ${LINE}`,
                background: "rgba(255,255,255,0.02)",
              }}
            />
          </div>
        )}

        {/* Intelligence error */}

        {!intelligenceLoading && intelligenceError && (
          <div className="mt-5">
            <ErrorPanel
              message="Unable to load entity intelligence."
              onRetry={onRetryIntelligence}
            />
          </div>
        )}

        {/* Empty history */}

        {!intelligenceLoading &&
          !intelligenceError &&
          intelligenceEvents.length === 0 && (
            <div
              className="mt-5 rounded-md border px-4 py-5"
              style={{
                borderColor: LINE,
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <p
                className="font-mono text-xs font-semibold"
                style={{ color: TEXT_DIM }}
              >
                NO_INTELLIGENCE_ON_FILE
              </p>

              <p
                className="mt-1 font-mono text-[10px]"
                style={{ color: MUTED }}
              >
                No detected signals match the current
                selection.
              </p>
            </div>
          )}

        {/* Event history */}

        {!intelligenceLoading &&
          !intelligenceError &&
          intelligenceEvents.length > 0 && (
            <div className="mt-5 space-y-3">
              {intelligenceEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={{
                    ...event,
                    entity: event.entity || entity,
                  }}
                />
              ))}
            </div>
          )}

        {/* Load more */}

        {!intelligenceLoading &&
          !intelligenceError &&
          intelligenceEvents.length > 0 &&
          intelligenceHasMore && (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={onLoadMoreIntelligence}
                disabled={intelligenceLoadingMore}
                className="rounded border px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: LINE_BRIGHT,
                  color: TEXT_DIM,
                }}
              >
                {intelligenceLoadingMore
                  ? "Loading..."
                  : "Load more signals"}
              </button>
            </div>
          )}
      </section>

      {/* ───────────────── Related Intelligence ───────────────── */}

      <section
        className="mx-7 mb-7 border-t pt-5"
        style={{ borderColor: LINE }}
      >
        <div>
          <p
            className="font-mono text-[10px] font-bold uppercase tracking-widest"
            style={{ color: SIGNAL }}
          >
            Related intelligence
          </p>

          <p
            className="mt-1 font-mono text-[10px]"
            style={{ color: TEXT_DIM }}
          >
            Entities connected through shared documents.
          </p>
        </div>

        {relatedLoading ? (
          <div className="mt-4 space-y-2">
            <div
              className="h-16 animate-pulse rounded"
              style={{ background: LINE }}
            />
            <div
              className="h-16 animate-pulse rounded"
              style={{ background: LINE }}
            />
          </div>
        ) : relatedError ? (
          <div className="mt-4">
            <ErrorPanel
              message="Unable to load related entities."
              onRetry={onRetryRelated}
            />
          </div>
        ) : relatedEntities.length === 0 ? (
          <p
            className="mt-4 font-mono text-xs"
            style={{ color: TEXT_DIM }}
          >
            No related entities found yet.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {relatedEntities.map((relatedEntity) => (
              <div
                key={relatedEntity.id}
                className="flex flex-col gap-3 border p-3 sm:flex-row sm:items-center sm:justify-between"
                style={{
                  borderColor: LINE,
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    onSelectRelatedEntity(
                      relatedEntity.id
                    )
                  }
                  className="min-w-0 text-left"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span
                      className="font-['Fraunces'] text-base font-bold"
                      style={{ color: TEXT }}
                    >
                      {relatedEntity.name}
                    </span>

                    {relatedEntity.type && (
                      <span
                        className="font-mono text-[10px] uppercase tracking-wide"
                        style={{ color: TEXT_DIM }}
                      >
                        {relatedEntity.type}
                      </span>
                    )}

                    {relatedEntity.ticker_symbol && (
                      <span
                        className="font-mono text-[10px] font-bold"
                        style={{ color: SIGNAL }}
                      >
                        {relatedEntity.ticker_symbol}
                      </span>
                    )}
                  </div>

                  {relatedEntity.reason && (
                    <p
                      className="mt-1 font-mono text-[10px]"
                      style={{ color: TEXT_DIM }}
                    >
                      {relatedEntity.reason}
                    </p>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onSelectRelatedEntity(
                      relatedEntity.id
                    )
                  }
                  className="shrink-0 border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wide"
                  style={{
                    borderColor: LINE_BRIGHT,
                    color: TEXT_DIM,
                  }}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}

export default EntityDetail;