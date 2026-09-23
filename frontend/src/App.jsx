import { useEffect, useMemo, useState, useCallback } from "react";
import {
  getEvents,
  getEntities,
  searchEntities,
  getEntity,
  followEntity,
  unfollowEntity,
  getSubscriptions,
  getFeed,
  getRecommendations,
  getRelatedEntities,
} from "./api";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { useAuth } from "./auth/useAuth";

import Header from "./components/Header";
import Watchlist from "./components/Watchlist";
import EntityDetail from "./components/EntityDetail";
import FilterBar from "./components/FilterBar";
import FeedList from "./components/FeedList";
import EmptyState from "./components/EmptyState";
import RecommendationList from "./components/RecommendationList";
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
  const [feedPage, setFeedPage] = useState(1);
  const [exploreEvents, setExploreEvents] = useState([]);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [exploreError, setExploreError] = useState(null);
  const [feedHasMore, setFeedHasMore] = useState(false);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [entities, setEntities] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [subscriptionsError, setSubscriptionsError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState(null);
  const [relatedEntities, setRelatedEntities] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState(null);
  const [followingRecommendationId, setFollowingRecommendationId] = useState(null);
  const [activeView, setActiveView] = useState("home");
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
  useEffect(() => {
    if (!selectedEntityId || !token) return undefined;

    let cancelled = false;

    async function loadRelatedEntities() {
      setRelatedLoading(true);
      setRelatedError(null);

      try {
        const data = await getRelatedEntities(selectedEntityId, token);

        if (cancelled) return;

        setRelatedEntities(Array.isArray(data) ? data : []);
      } catch (error) {
        if (cancelled) return;

        setRelatedEntities([]);
        setRelatedError(error);
      } finally {
        if (!cancelled) {
          setRelatedLoading(false);
        }
      }
    }

    loadRelatedEntities();

    return () => {
      cancelled = true;
    };
  }, [selectedEntityId, token]);
  const loadFeed = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    setFeedPage(1);

    try {
      const data = await getFeed({
        page: 1,
        limit: 20,
        token,
      });

      setEvents(Array.isArray(data?.items) ? data.items : []);
      setFeedHasMore(Boolean(data?.has_more));
    } catch (error) {
      setEventsError(error);
      setEvents([]);
      setFeedHasMore(false);
    } finally {
      setEventsLoading(false);
    }
  }, [token]);
  const loadExploreEvents = useCallback(async () => {
    setExploreLoading(true);
    setExploreError(null);

    try {
      const data = await getEvents();

      setExploreEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      setExploreError(error);
      setExploreEvents([]);
    } finally {
      setExploreLoading(false);
    }
  }, []);
  const loadMoreFeed = useCallback(async () => {
    if (!token || feedLoadingMore || !feedHasMore) {
      return;
    }

    setFeedLoadingMore(true);

    try {
      const nextPage = feedPage + 1;

      const data = await getFeed({
        page: nextPage,
        limit: 20,
        token,
      });

      const newItems = Array.isArray(data?.items) ? data.items : [];

      setEvents((currentEvents) => [...currentEvents, ...newItems]);
      setFeedPage(data?.page ?? nextPage);
      setFeedHasMore(Boolean(data?.has_more));
    } catch (error) {
      setEventsError(error);
    } finally {
      setFeedLoadingMore(false);
    }
  }, [token, feedPage, feedHasMore, feedLoadingMore]);

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
  const loadRecommendations = useCallback(async () => {
    if (!token) {
      setRecommendations([]);
      setRecommendationsLoading(false);
      return;
    }

    setRecommendationsLoading(true);
    setRecommendationsError(null);

    try {
      const data = await getRecommendations({
        page: 1,
        limit: 20,
        token,
      });

      setRecommendations(
        Array.isArray(data?.items) ? data.items : []
      );

    } catch (error) {
      setRecommendations([]);
      setRecommendationsError(error);
    } finally {
      setRecommendationsLoading(false);
    }
  }, [token]);
  const visibleRecommendations = useMemo(() => {
    const subscribedIds = new Set(
      subscriptions
        .map((subscription) => subscription.entity?.id)
        .filter(Boolean)
    );

    return recommendations.filter(
      (recommendation) =>
        recommendation.entity &&
        !subscribedIds.has(recommendation.entity.id)
    );
  }, [recommendations, subscriptions]);
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
  const handleRecommendationFollow = async (entityId) => {
    if (!token || followingRecommendationId) return;

    setFollowingRecommendationId(entityId);
    setRecommendationsError(null);

    try {
      await followEntity(entityId, token);

      setRecommendations((currentRecommendations) =>
        currentRecommendations.filter(
          (recommendation) => recommendation.entity?.id !== entityId
        )
      );

      await loadSubscriptions();
    } catch (error) {
      setRecommendationsError(error);
    } finally {
      setFollowingRecommendationId(null);
    }
  };
  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);
  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      const [feedResult, entitiesResult, subscriptionsResult] =
        await Promise.allSettled([
          getFeed({
            page: 1,
            limit: 20,
            token,
          }),
          getEntities(),
          getSubscriptions(token),
        ]);

      if (cancelled) return;

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

      if (feedResult.status === "fulfilled") {
        const feed = feedResult.value;

        setEvents(Array.isArray(feed?.items) ? feed.items : []);
        setFeedPage(feed?.page ?? 1);
        setFeedHasMore(Boolean(feed?.has_more));
        setEventsError(null);
      } else {
        setEvents([]);
        setFeedHasMore(false);
        setEventsError(feedResult.reason);
      }

      if (entitiesResult.status === "fulfilled") {
        setEntities(
          Array.isArray(entitiesResult.value)
            ? entitiesResult.value
            : []
        );
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
        activeView={activeView}
        onHomeClick={() => {
          setActiveView("home");
          setSelectedEntityId(null);
          setSelectedEntity(null);
          setSubscriptionError(null);
        }}
        onExploreClick={() => {
          setActiveView("explore");
          setSelectedEntityId(null);
          setSelectedEntity(null);
          setSubscriptionError(null);
          loadExploreEvents();
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery("")}
        entitySearchLoading={entitySearchLoading}
        entitySearchError={entitySearchError}
        entitySearchResults={entitySearchResults}
        onSelectSearchResult={(entityId) => {
          setActiveView("home");
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
            setActiveView("home");
            setSelectedEntityId(selectedEntityId === entityId ? null : entityId);
          }}
          onClearSelection={() => setSelectedEntityId(null)}
        />

        <main>
          {activeView === "home" && (
            <div className="mb-8">
              <RecommendationList
                recommendations={visibleRecommendations}
                loading={recommendationsLoading}
                error={recommendationsError}
                hasSubscriptions={subscriptions.length > 0}
                onRetry={loadRecommendations}
                onSelectEntity={(entityId) => {
                  setRelatedEntities([]);
                  setRelatedError(null);
                  setActiveView("home");
                  setSelectedEntityId(entityId);
                  setSearchQuery("");
                }}
                onFollow={handleRecommendationFollow}
                followingEntityId={followingRecommendationId}
              />
            </div>
          )}

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
                      setRelatedEntities([]);
                      setRelatedError(null);
                      setSubscriptionError(null);
                    }}
                    onRetry={() => {
                      setSelectedEntityId(null);
                      setTimeout(() => setSelectedEntityId(selectedEntityId), 0);
                    }}
                    relatedEntities={relatedEntities}
                    relatedLoading={relatedLoading}
                    relatedError={relatedError}
                    onRetryRelated={() => {
                      if (!selectedEntityId || !token) return;

                      setRelatedError(null);

                      getRelatedEntities(selectedEntityId, token)
                        .then((data) => {
                          setRelatedEntities(Array.isArray(data) ? data : []);
                        })
                        .catch((error) => {
                          setRelatedEntities([]);
                          setRelatedError(error);
                        });
                    }}
                    onSelectRelatedEntity={(entityId) => {
                      setRelatedEntities([]);
                      setRelatedError(null);
                      setActiveView("home");
                      setSelectedEntityId(entityId);
                      setSearchQuery("");
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


          {activeView === "explore" ? (
            exploreError && !exploreLoading ? (
              <FeedList
                events={[]}
                loading={false}
                error={exploreError}
                onRetry={loadExploreEvents}
                onEntityClick={setSelectedEntityId}
              />
            ) : (
              <FeedList
                events={exploreEvents}
                loading={exploreLoading}
                error={null}
                onEntityClick={setSelectedEntityId}
              />
            )
          ) : eventsError && !eventsLoading ? (
            <FeedList
              events={[]}
              loading={false}
              error={eventsError}
              onRetry={loadFeed}
              onEntityClick={setSelectedEntityId}
            />
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
              hasMore={feedHasMore}
              loadingMore={feedLoadingMore}
              onRetry={loadFeed}
              onLoadMore={loadMoreFeed}
              onEntityClick={setSelectedEntityId}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;