import { useEffect, useMemo, useState, useCallback } from "react";
import {
  getEvents,
  getEntities,
  searchEntities,
  getEntity,
  getEntityEvents,
  followEntity,
  unfollowEntity,
  getSubscriptions,
  getFeed,
  getRecommendations,
  getRelatedEntities,
} from "./api";
import { normalizeEvents } from "./utils/eventUtils";
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

function App() {
  const { token, isAuthenticated, loading, logout } = useAuth();

  const [authScreen, setAuthScreen] = useState("login");

  const [events, setEvents] = useState([]);
  const [feedPage, setFeedPage] = useState(1);
  const [feedHasMore, setFeedHasMore] = useState(false);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);

  const [exploreEvents, setExploreEvents] = useState([]);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [exploreError, setExploreError] = useState(null);

  const [entities, setEntities] = useState([]);

  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [subscriptionsError, setSubscriptionsError] = useState(null);

  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState(null);
  const [followingRecommendationId, setFollowingRecommendationId] =
    useState(null);

  const [relatedEntities, setRelatedEntities] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState(null);

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

  // Sprint 5 — Entity Intelligence
  const [intelligenceEvents, setIntelligenceEvents] = useState([]);
  const [intelligencePage, setIntelligencePage] = useState(1);
  const [intelligenceHasMore, setIntelligenceHasMore] = useState(false);
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);
  const [intelligenceLoadingMore, setIntelligenceLoadingMore] =
    useState(false);
  const [intelligenceError, setIntelligenceError] = useState(null);
  const [selectedIntelligenceEventType, setSelectedIntelligenceEventType] =
    useState(null);

  // ---------------------------------------------------------------------------
  // Entity search
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const query = searchQuery.trim();

    if (!query || !token) {
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

        if (cancelled) {
          return;
        }

        setEntitySearchResults(
          Array.isArray(data?.results) ? data.results : []
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

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

  // ---------------------------------------------------------------------------
  // Selected entity
  // ---------------------------------------------------------------------------

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

        if (cancelled) {
          return;
        }

        setSelectedEntity(data);
      } catch (error) {
        if (cancelled) {
          return;
        }

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

  // ---------------------------------------------------------------------------
  // Sprint 5 — reusable Entity Intelligence loader
  // Used by Load More and Retry.
  // ---------------------------------------------------------------------------

  const loadEntityIntelligence = useCallback(
    async ({
      entityId = selectedEntityId,
      eventType = selectedIntelligenceEventType,
      page = 1,
      append = false,
    }) => {
      if (!entityId || !token) {
        return;
      }

      if (append) {
        setIntelligenceLoadingMore(true);
      } else {
        setIntelligenceLoading(true);
      }

      setIntelligenceError(null);

      try {
        const data = await getEntityEvents({
          entityId,
          page,
          limit: 20,
          eventType,
          token,
        });

        const items = Array.isArray(data?.items) ? data.items : [];

        setIntelligenceEvents((currentEvents) => {
          if (!append) {
            return items;
          }

          const existingIds = new Set(
            currentEvents.map((event) => event.id)
          );

          return [
            ...currentEvents,
            ...items.filter((event) => !existingIds.has(event.id)),
          ];
        });

        setIntelligencePage(data?.page ?? page);
        setIntelligenceHasMore(Boolean(data?.has_more));
      } catch (error) {
        setIntelligenceError(error);

        if (!append) {
          setIntelligenceEvents([]);
          setIntelligencePage(1);
          setIntelligenceHasMore(false);
        }
      } finally {
        if (append) {
          setIntelligenceLoadingMore(false);
        } else {
          setIntelligenceLoading(false);
        }
      }
    },
    [
      selectedEntityId,
      selectedIntelligenceEventType,
      token,
    ]
  );

  // ---------------------------------------------------------------------------
  // Sprint 5 — initial Entity Intelligence request
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!selectedEntityId || !token) {
      return undefined;
    }

    let cancelled = false;

    async function loadInitialIntelligence() {
      setIntelligenceLoading(true);
      setIntelligenceError(null);

      try {
        const data = await getEntityEvents({
          entityId: selectedEntityId,
          page: 1,
          limit: 20,
          eventType: selectedIntelligenceEventType,
          token,
        });

        if (cancelled) {
          return;
        }

        const items = Array.isArray(data?.items) ? data.items : [];

        setIntelligenceEvents(items);
        setIntelligencePage(data?.page ?? 1);
        setIntelligenceHasMore(Boolean(data?.has_more));
      } catch (error) {
        if (cancelled) {
          return;
        }

        setIntelligenceEvents([]);
        setIntelligencePage(1);
        setIntelligenceHasMore(false);
        setIntelligenceError(error);
      } finally {
        if (!cancelled) {
          setIntelligenceLoading(false);
        }
      }
    }

    loadInitialIntelligence();

    return () => {
      cancelled = true;
    };
  }, [
    selectedEntityId,
    selectedIntelligenceEventType,
    token,
  ]);

  // ---------------------------------------------------------------------------
  // Related entities
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!selectedEntityId || !token) {
      return undefined;
    }

    let cancelled = false;

    async function loadRelatedEntities() {
      setRelatedLoading(true);
      setRelatedError(null);

      try {
        const data = await getRelatedEntities(selectedEntityId, token);

        if (cancelled) {
          return;
        }

        setRelatedEntities(
          Array.isArray(data?.items) ? data.items : []
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

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

  // ---------------------------------------------------------------------------
  // Feed
  // ---------------------------------------------------------------------------

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

      setEvents(normalizeEvents(data?.items));
      setFeedHasMore(Boolean(data?.has_more));
    } catch (error) {
      setEventsError(error);
      setEvents([]);
      setFeedHasMore(false);
    } finally {
      setEventsLoading(false);
    }
  }, [token]);

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

      const newItems = normalizeEvents(data?.items);

      setEvents((currentEvents) => [
        ...currentEvents,
        ...newItems,
      ]);

      setFeedPage(data?.page ?? nextPage);
      setFeedHasMore(Boolean(data?.has_more));
    } catch (error) {
      setEventsError(error);
    } finally {
      setFeedLoadingMore(false);
    }
  }, [
    token,
    feedPage,
    feedHasMore,
    feedLoadingMore,
  ]);

  // ---------------------------------------------------------------------------
  // Explore
  // ---------------------------------------------------------------------------

  const loadExploreEvents = useCallback(async () => {
    setExploreLoading(true);
    setExploreError(null);

    try {
      const data = await getEvents();

      setExploreEvents(normalizeEvents(data));
    } catch (error) {
      setExploreError(error);
      setExploreEvents([]);
    } finally {
      setExploreLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Subscriptions
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Recommendations
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Subscription actions
  // ---------------------------------------------------------------------------

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

      const updatedEntity = await getEntity(
        selectedEntity.id,
        token
      );

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

  const handleRecommendationFollow = async (entityId) => {
    if (!token || followingRecommendationId) {
      return;
    }

    setFollowingRecommendationId(entityId);
    setRecommendationsError(null);

    try {
      await followEntity(entityId, token);

      setRecommendations((currentRecommendations) =>
        currentRecommendations.filter(
          (recommendation) =>
            recommendation.entity?.id !== entityId
        )
      );

      await loadSubscriptions();
    } catch (error) {
      setRecommendationsError(error);
    } finally {
      setFollowingRecommendationId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Initial data
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let cancelled = false;

    async function fetchRecommendations() {
      setRecommendationsLoading(true);
      setRecommendationsError(null);

      try {
        const data = await getRecommendations({
          page: 1,
          limit: 20,
          token,
        });

        if (cancelled) {
          return;
        }

        setRecommendations(
          Array.isArray(data?.items) ? data.items : []
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setRecommendations([]);
        setRecommendationsError(error);
      } finally {
        if (!cancelled) {
          setRecommendationsLoading(false);
        }
      }
    }

    fetchRecommendations();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      const [
        feedResult,
        entitiesResult,
        subscriptionsResult,
      ] = await Promise.allSettled([
        getFeed({
          page: 1,
          limit: 20,
          token,
        }),
        getEntities(),
        getSubscriptions(token),
      ]);

      if (cancelled) {
        return;
      }

      if (subscriptionsResult.status === "fulfilled") {
        setSubscriptions(
          Array.isArray(subscriptionsResult.value)
            ? subscriptionsResult.value
            : []
        );
      } else {
        setSubscriptionsError(
          subscriptionsResult.reason
        );
      }

      setSubscriptionsLoading(false);

      if (feedResult.status === "fulfilled") {
        const feed = feedResult.value;

        setEvents(normalizeEvents(feed?.items));

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

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const eventCountByEntity = useMemo(() => {
    const counts = {};

    events.forEach((event) => {
      const id = event.entity?.id;

      if (id) {
        counts[id] = (counts[id] || 0) + 1;
      }
    });

    return counts;
  }, [events]);

  const availableEventTypes = useMemo(() => {
    const types = new Set();

    events.forEach((event) => {
      if (event.event_type) {
        types.add(event.event_type);
      }
    });

    return Array.from(types);
  }, [events]);

  const intelligenceEventTypes = useMemo(() => {
    const types = new Set();

    intelligenceEvents.forEach((event) => {
      if (event.event_type) {
        types.add(event.event_type);
      }
    });

    return Array.from(types);
  }, [intelligenceEvents]);

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = events.filter((event) => {
      if (
        selectedEntityId &&
        event.entity?.id !== selectedEntityId
      ) {
        return false;
      }

      if (
        selectedEventType &&
        event.event_type !== selectedEventType
      ) {
        return false;
      }

      if (query) {
        const haystack = `
          ${event.entity?.name || ""}
          ${event.ai_summary || ""}
        `.toLowerCase();

        if (!haystack.includes(query)) {
          return false;
        }
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      const aTime =
        new Date(a.detected_at).getTime() || 0;

      const bTime =
        new Date(b.detected_at).getTime() || 0;

      return sortOrder === "newest"
        ? bTime - aTime
        : aTime - bTime;
    });
  }, [
    events,
    searchQuery,
    selectedEntityId,
    selectedEventType,
    sortOrder,
  ]);

  const activeFilterCount =
    (selectedEntityId ? 1 : 0) +
    (selectedEventType ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedEntityId(null);
    setSelectedEventType(null);
  };

  const selectedEntityName = entities.find(
    (entity) => entity.id === selectedEntityId
  )?.name;

  const subscribedEntities = subscriptions
    .map((subscription) => subscription.entity)
    .filter(Boolean);

  // ---------------------------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        style={{ background: INK }}
      >
        <p
          className="font-mono text-sm"
          style={{ color: "#7A8393" }}
        >
          RESTORING_SESSION...
        </p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return authScreen === "signup" ? (
      <SignupPage
        onSwitchToLogin={() => setAuthScreen("login")}
      />
    ) : (
      <LoginPage
        onSwitchToSignup={() => setAuthScreen("signup")}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      className="min-h-screen font-['IBM_Plex_Sans']"
      style={{
        background: INK,
        color: TEXT,
      }}
    >
      <style>{GLOBAL_FONT_STYLES}</style>

      <Header
        entityCount={entities.length}
        eventCount={events.length}
        activeView={activeView}
        onHomeClick={() => {
          setActiveView("home");
          setSelectedEntityId(null);
          setSelectedEntity(null);
          setSelectedIntelligenceEventType(null);
          setIntelligenceEvents([]);
          setIntelligencePage(1);
          setIntelligenceHasMore(false);
          setIntelligenceError(null);
          setSubscriptionError(null);
        }}
        onExploreClick={() => {
          setActiveView("explore");
          setSelectedEntityId(null);
          setSelectedEntity(null);
          setSelectedIntelligenceEventType(null);
          setIntelligenceEvents([]);
          setIntelligencePage(1);
          setIntelligenceHasMore(false);
          setIntelligenceError(null);
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
          setSelectedIntelligenceEventType(null);
          setIntelligenceEvents([]);
          setIntelligencePage(1);
          setIntelligenceHasMore(false);
          setIntelligenceError(null);
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

            if (selectedEntityId === entityId) {
              setSelectedEntityId(null);
              return;
            }

            setSelectedEventType(null);
            setSelectedIntelligenceEventType(null);
            setIntelligenceEvents([]);
            setIntelligencePage(1);
            setIntelligenceHasMore(false);
            setIntelligenceError(null);
            setSelectedEntityId(entityId);
          }}
          onClearSelection={() => {
            setSelectedEntityId(null);
            setSelectedIntelligenceEventType(null);
            setIntelligenceEvents([]);
            setIntelligencePage(1);
            setIntelligenceHasMore(false);
            setIntelligenceError(null);
          }}
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
                  setSelectedIntelligenceEventType(null);
                  setIntelligenceEvents([]);
                  setIntelligencePage(1);
                  setIntelligenceHasMore(false);
                  setIntelligenceError(null);
                  setSearchQuery("");
                  setSelectedEntityId(entityId);
                }}
                onFollow={handleRecommendationFollow}
                followingEntityId={followingRecommendationId}
              />
            </div>
          )}

          {!eventsLoading &&
            !eventsError &&
            events.length > 0 && (
              <div className="mb-5 flex flex-col gap-4">
                {selectedEntityId && (
                  <section className="mb-6">
                    <EntityDetail
                      loading={selectedEntityLoading}
                      error={selectedEntityError}
                      entity={selectedEntity}
                      subscriptionLoading={subscriptionLoading}
                      subscriptionError={subscriptionError}
                      onToggleSubscription={
                        handleSubscriptionToggle
                      }
                      onClose={() => {
                        setSelectedEntityId(null);
                        setSelectedEntity(null);
                        setSelectedIntelligenceEventType(null);
                        setIntelligenceEvents([]);
                        setIntelligencePage(1);
                        setIntelligenceHasMore(false);
                        setIntelligenceError(null);
                        setRelatedEntities([]);
                        setRelatedError(null);
                        setSubscriptionError(null);
                      }}
                      onRetry={() => {
                        setSelectedEntityId(null);

                        setTimeout(() => {
                          setSelectedEntityId(
                            selectedEntityId
                          );
                        }, 0);
                      }}
                      relatedEntities={relatedEntities}
                      relatedLoading={relatedLoading}
                      relatedError={relatedError}
                      onRetryRelated={() => {
                        if (!selectedEntityId || !token) {
                          return;
                        }

                        setRelatedError(null);

                        getRelatedEntities(selectedEntityId, token)
                          .then((data) => {
                            setRelatedEntities(
                              Array.isArray(data?.items) ? data.items : []
                            );
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
                        setSelectedIntelligenceEventType(null);
                        setIntelligenceEvents([]);
                        setIntelligencePage(1);
                        setIntelligenceHasMore(false);
                        setIntelligenceError(null);
                        setSelectedEntityId(entityId);
                        setSearchQuery("");
                      }}
                      intelligenceEvents={
                        intelligenceEvents
                      }
                      intelligenceLoading={
                        intelligenceLoading
                      }
                      intelligenceError={
                        intelligenceError
                      }
                      intelligenceHasMore={
                        intelligenceHasMore
                      }
                      intelligenceLoadingMore={
                        intelligenceLoadingMore
                      }
                      availableEventTypes={
                        intelligenceEventTypes
                      }
                      selectedEventType={
                        selectedIntelligenceEventType
                      }
                      onSelectEventType={
                        setSelectedIntelligenceEventType
                      }
                      onLoadMoreIntelligence={() => {
                        if (
                          !intelligenceHasMore ||
                          intelligenceLoadingMore
                        ) {
                          return;
                        }

                        loadEntityIntelligence({
                          entityId: selectedEntityId,
                          eventType:
                            selectedIntelligenceEventType,
                          page: intelligencePage + 1,
                          append: true,
                        });
                      }}
                      onRetryIntelligence={() => {
                        loadEntityIntelligence({
                          entityId: selectedEntityId,
                          eventType:
                            selectedIntelligenceEventType,
                          page: 1,
                          append: false,
                        });
                      }}
                    />
                  </section>
                )}

                <FilterBar
                  availableEventTypes={
                    availableEventTypes
                  }
                  selectedEventType={
                    selectedEventType
                  }
                  onSelectEventType={
                    setSelectedEventType
                  }
                  sortOrder={sortOrder}
                  onChangeSortOrder={setSortOrder}
                  activeFilterCount={
                    activeFilterCount
                  }
                  filteredCount={
                    filteredEvents.length
                  }
                  totalCount={events.length}
                  selectedEntityName={
                    selectedEntityName
                  }
                  onClearFilters={
                    clearFilters
                  }
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
          ) : filteredEvents.length === 0 &&
            !eventsLoading ? (
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