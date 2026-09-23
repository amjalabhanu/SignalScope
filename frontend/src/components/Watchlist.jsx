import { SIGNAL, TEXT, TEXT_DIM, LINE, MUTED, SURFACE } from "../constants/theme";
import ErrorPanel from "./ErrorPanel";

function EntityRow({ entity, count, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className="flex w-full items-center justify-between gap-2 border-l-2 px-3.5 py-3 text-left text-sm transition-colors"
      style={{
        background: isSelected ? "rgba(232,163,61,0.08)" : "transparent",
        borderLeftColor: isSelected ? SIGNAL : "transparent",
        color: isSelected ? TEXT : TEXT_DIM,
        fontWeight: isSelected ? 600 : 500,
      }}
    >
      <span className="truncate">{entity.name}</span>
      {typeof count === "number" && (
        <span
          className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums"
          style={{ color: isSelected ? SIGNAL : MUTED, background: "rgba(255,255,255,0.04)" }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function Watchlist({
  subscribedEntities,
  eventCountByEntity,
  selectedEntityId,
  loading,
  error,
  onRetry,
  onSelectEntity,
  onClearSelection,
}) {
  return (
    <aside className="lg:sticky lg:top-24 lg:h-fit">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="font-mono text-[11px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>
          Watchlist
        </h2>
        {selectedEntityId && (
          <button
            type="button"
            onClick={onClearSelection}
            className="font-mono text-[10px] font-bold uppercase tracking-wide hover:underline"
            style={{ color: SIGNAL }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="rounded-md" style={{ border: `1px solid ${LINE}`, background: SURFACE }}>
        {loading ? (
          <div className="space-y-px p-2">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="h-9 animate-pulse rounded"
                style={{ background: LINE, opacity: 0.5 }}
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-3">
            <ErrorPanel message="Couldn't load your watchlist." onRetry={onRetry} />
          </div>
        ) : subscribedEntities.length === 0 ? (
          <div className="p-4">
            <p className="text-sm font-medium" style={{ color: TEXT_DIM }}>
              Not following anyone yet.
            </p>
            <p className="mt-1 text-xs" style={{ color: MUTED }}>
              Search above to start tracking an entity.
            </p>
          </div>
        ) : (
          <nav className="divide-y py-1" style={{ borderColor: LINE }}>
            {subscribedEntities.map((entity) => (
              <EntityRow
                key={entity.id}
                entity={entity}
                count={eventCountByEntity[entity.id]}
                isSelected={selectedEntityId === entity.id}
                onSelect={() => onSelectEntity(entity.id)}
              />
            ))}
          </nav>
        )}
      </div>
    </aside>
  );
}

export default Watchlist;