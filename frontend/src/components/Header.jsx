import { TEXT, TEXT_DIM, MUTED, SIGNAL, LINE, LINE_BRIGHT, PANEL, SURFACE, SHADOW_LG, VERIFIED, ALERT } from "../constants/theme";

function SearchResults({ loading, error, results, onSelect }) {
    if (loading) {
        return (
            <div className="px-4 py-3.5 font-mono text-xs" style={{ color: MUTED }}>
                SEARCHING...
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-4 py-3.5">
                <p className="font-mono text-xs font-semibold" style={{ color: ALERT }}>
                    SEARCH_FAILED
                </p>
                <p className="mt-1 text-xs" style={{ color: MUTED }}>
                    Try again in a moment.
                </p>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="px-4 py-3.5">
                <p className="text-sm font-semibold" style={{ color: TEXT }}>
                    No entities found.
                </p>
                <p className="mt-1 text-xs" style={{ color: MUTED }}>
                    Try another name or ticker.
                </p>
            </div>
        );
    }

    return (
        <div className="max-h-80 overflow-y-auto py-1">
            {results.map((entity) => (
                <button
                    key={entity.id}
                    type="button"
                    onClick={() => onSelect(entity.id)}
                    className="flex w-full items-center justify-between gap-4 border-l-2 border-transparent px-4 py-3 text-left transition-colors hover:border-l-2 hover:bg-white/[0.03]"
                    style={{ borderLeftColor: "transparent" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderLeftColor = SIGNAL)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderLeftColor = "transparent")}
                >
                    <div className="min-w-0">
                        <p className="truncate font-['Fraunces'] text-[15px] font-semibold" style={{ color: TEXT }}>
                            {entity.name}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide" style={{ color: MUTED }}>
                            {entity.type}
                            {entity.ticker_symbol ? ` · ${entity.ticker_symbol}` : ""}
                        </p>
                    </div>
                    <span
                        className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wide"
                        style={{ color: entity.is_subscribed ? VERIFIED : MUTED }}
                    >
                        {entity.is_subscribed ? "FOLLOWING" : "+ ADD"}
                    </span>
                </button>
            ))}
        </div>
    );
}

function Header({
    entityCount,
    eventCount,
    activeView,
    onHomeClick,
    onExploreClick,
    searchQuery,
    onSearchChange,
    onClearSearch,
    entitySearchLoading,
    entitySearchError,
    entitySearchResults,
    onSelectSearchResult,
}) {
    return (
        <header className="sticky top-0 z-10" style={{ background: PANEL, borderBottom: `1px solid ${LINE}` }}>
            <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${SIGNAL} 0%, transparent 60%)` }} />
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <div className="flex items-center gap-4">
                    <div>
                        <div className="flex items-baseline gap-2.5">
                            <h1 className="font-['Fraunces'] text-[26px] font-extrabold leading-none tracking-tight" style={{ color: TEXT }}>
                                SignalScope
                            </h1>
                            <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: SIGNAL, boxShadow: `0 0 8px ${SIGNAL}` }}
                                aria-hidden="true"
                            />
                        </div>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-widest" style={{ color: MUTED }}>
                            {entityCount} tracked · {eventCount} signals
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onHomeClick}
                            className="rounded border px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide transition-colors"
                            style={{
                                background: activeView === "home" ? SIGNAL : "transparent",
                                color: activeView === "home" ? "#171208" : TEXT_DIM,
                                borderColor: activeView === "home" ? SIGNAL : LINE_BRIGHT,
                            }}
                        >
                            Home
                        </button>

                        <button
                            type="button"
                            onClick={onExploreClick}
                            className="rounded border px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide transition-colors"
                            style={{
                                background: activeView === "explore" ? SIGNAL : "transparent",
                                color: activeView === "explore" ? "#171208" : TEXT_DIM,
                                borderColor: activeView === "explore" ? SIGNAL : LINE_BRIGHT,
                            }}
                        >
                            Explore
                        </button>
                    </div>
                </div>

        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="relative w-full sm:w-72">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm" style={{ color: MUTED }}>
              /
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="search entities"
              className="w-full rounded py-2.5 pl-7 pr-9 font-mono text-sm placeholder:text-[#5A6270] focus:outline-none"
              style={{ border: `1px solid ${LINE_BRIGHT}`, background: SURFACE, color: TEXT }}
              aria-label="Search entities"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={onClearSearch}
                aria-label="Clear entity search"
                className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full font-mono text-sm"
                style={{ color: MUTED }}
              >
                ×
              </button>
            )}

            {searchQuery.trim() && (
              <div
                className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-md"
                style={{ border: `1px solid ${LINE_BRIGHT}`, background: SURFACE, boxShadow: SHADOW_LG }}
              >
                <SearchResults
                  loading={entitySearchLoading}
                  error={entitySearchError}
                  results={entitySearchResults}
                  onSelect={onSelectSearchResult}
                />
              </div>
            )}
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="shrink-0 rounded border px-3.5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide transition-colors hover:border-[color:var(--alert)] hover:text-[color:var(--alert)]"
              style={{ borderColor: LINE_BRIGHT, color: MUTED, "--alert": "#E2725B" }}
            >
              Log out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;