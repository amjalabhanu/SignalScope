import { useEffect, useMemo, useState, useCallback } from "react";
import { getEvents, getEntities, searchEntities, getEntity, followEntity, unfollowEntity, getSubscriptions } from "./api";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { useAuth } from "./auth/useAuth";

import Header from "./components/Header";
import Watchlist from "./components/Watchlist";
import EntityDetail from "./components/EntityDetail";
import FilterBar from "./components/FilterBar";
import FeedList from "./components/FeedList";
import EmptyState from "./components/EmptyState";
import { GLOBAL_FONT_STYLES, INK, TEXT } from "./constants/theme";

/**
 * Design notes — "wire desk" identity
 * ------------------------------------
 * SignalScope reads as an analyst's dossier on a dark terminal, not a
 * SaaS dashboard. Machine-detected metadata (timestamps, event codes,
 * evidence counts) is set in IBM Plex Mono to signal "this was detected,
 * not written"; entity names are set in Fraunces for editorial weight,
 * the way a wire headline is typeset differently from its byline.
 *
 * A single warm amber (SIGNAL) marks what's live/actionable; a sage
 * green (VERIFIED) marks evidence. Each event card opens with a wire
 * header strip (event code + timestamp) instead of a quiet colored
 * spine, and filters read as terminal tabs rather than pill buttons.
 */

function App() {
  const { token, isAuthenticated, loading, logout } = useAuth();
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
    if (!query || !token) return undefined;

    let cancelled = false;

    async function runEntitySearch() {
      setEntitySearchLoading(true);
      setEntitySearchError(null);
      try {
        const data = await searchEntities({ q: query, page: 1, limit: 20, token });
        if (cancelled) return;
        setEntitySearchResults(Array.isArray(data?.results) ? data.results : []);
      } catch (error) {
        if (cancelled) return;
        setEntitySearchResults([]);
        setEntitySearchError(error);
      } finally {
        if (!cancelled) setEntitySearchLoading(false);
      }
    }

    runEntitySearch();
    return () => {
      cancelled = true;
    };
  }, [searchQuery, token]);

  useEffect(() => {
    if (!selectedEntityId || !token) return undefined;

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
        if (!cancelled) setSelectedEntityLoading(false);
      }
    }

    loadSelectedEntity();
    return () => {
      cancelled = true;
    };
  }, [selectedEntityId, token]);

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

  const handleSubscriptionToggle = async () => {
    if (!selectedEntity || !token || subscriptionLoading) return;

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
          entity.id === updatedEntity.id ? { ...entity, is_subscribed: updatedEntity.is_subscribed } : entity
        )
      );
      await loadSubscriptions();
    } catch (error) {
      setSubscriptionError(error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function loadInitialData() {
      const [eventsResult, entitiesResult, subscriptionsResult] = await Promise.allSettled([
        getEvents(),
        getEntities(),
        getSubscriptions(token),
      ]);

      if (subscriptionsResult.status === "fulfilled") {
        setSubscriptions(Array.isArray(subscriptionsResult.value) ? subscriptionsResult.value : []);
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
      if (selectedEntityId && event.entity?.id !== selectedEntityId) return false;
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

  const activeFilterCount = (selectedEntityId ? 1 : 0) + (selectedEventType ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedEntityId(null);
    setSelectedEventType(null);
  };

  const selectedEntityName = entities.find((e) => e.id === selectedEntityId)?.name;
  const subscribedEntities = subscriptions.map((subscription) => subscription.entity).filter(Boolean);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: INK }}>
        <p className="font-mono text-sm" style={{ color: "#7A8393" }}>RESTORING_SESSION...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return authScreen === "signup" ? (
      <SignupPage onSwitchToLogin={() => setAuthScreen("login")} />
    ) : (
      <LoginPage onSwitchToSignup={() => setAuthScreen("signup")} />
    );
  }

  return (
    <div className="min-h-screen font-['IBM_Plex_Sans']" style={{ background: INK, color: TEXT }}>
      <style>{GLOBAL_FONT_STYLES}</style>

      <Header
        entityCount={entities.length}
        eventCount={events.length}
        showHome={showHome}
        onHomeClick={() => {
          setShowHome(true);
          setSelectedEntityId(null);
          setSelectedEntity(null);
          setSubscriptionError(null);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery("")}
        entitySearchLoading={entitySearchLoading}
        entitySearchError={entitySearchError}
        entitySearchResults={entitySearchResults}
        onSelectSearchResult={(entityId) => {
          setShowHome(false);
          setSelectedEntityId(entityId);
          setSearchQuery("");
        }}
        onLogout={logout}
      />

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[260px_1fr]">
        <Watchlist
          subscribedEntities={subscribedEntities}
          eventCountByEntity={eventCountByEntity}
          selectedEntityId={selectedEntityId}
          loading={subscriptionsLoading}
          error={subscriptionsError}
          onRetry={loadSubscriptions}
          onSelectEntity={(entityId) => {
            setShowHome(false);
            setSelectedEntityId(selectedEntityId === entityId ? null : entityId);
          }}
          onClearSelection={() => setSelectedEntityId(null)}
        />

        <main>
          {!eventsLoading && !eventsError && events.length > 0 && (
            <div className="mb-5 flex flex-col gap-4">
              {selectedEntityId && (
                <section className="mb-6">
                  <EntityDetail
                    loading={selectedEntityLoading}
                    error={selectedEntityError}
                    entity={selectedEntity}
                    subscriptionLoading={subscriptionLoading}
                    subscriptionError={subscriptionError}
                    onToggleSubscription={handleSubscriptionToggle}
                    onClose={() => {
                      setSelectedEntityId(null);
                      setSubscriptionError(null);
                    }}
                    onRetry={() => {
                      setSelectedEntityId(null);
                      setTimeout(() => setSelectedEntityId(selectedEntityId), 0);
                    }}
                  />
                </section>
              )}

              <FilterBar
                availableEventTypes={availableEventTypes}
                selectedEventType={selectedEventType}
                onSelectEventType={setSelectedEventType}
                sortOrder={sortOrder}
                onChangeSortOrder={setSortOrder}
                activeFilterCount={activeFilterCount}
                filteredCount={filteredEvents.length}
                totalCount={events.length}
                selectedEntityName={selectedEntityName}
                onClearFilters={clearFilters}
              />
            </div>
          )}

          {eventsError && !eventsLoading ? (
            <FeedList events={[]} loading={false} error={eventsError} onRetry={loadEvents} />
          ) : events.length === 0 && !eventsLoading ? (
            <EmptyState
              title="No signals yet"
              description="SignalScope hasn't detected anything from your sources. New signals will appear here as soon as they're found."
            />
          ) : filteredEvents.length === 0 && !eventsLoading ? (
            <EmptyState
              title="Nothing matches"
              description="Try a different search term or clear your filters."
              actionLabel="Clear filters"
              onAction={clearFilters}
            />
          ) : (
            <FeedList
              events={filteredEvents}
              loading={eventsLoading}
              error={null}
              onRetry={loadEvents}
              onEntityClick={setSelectedEntityId}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;