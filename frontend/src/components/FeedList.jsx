import EventCard from "./EventCard";
import SkeletonCard from "./SkeletonCard";
import ErrorPanel from "./ErrorPanel";
import EmptyState from "./EmptyState";

function FeedList({
  events,
  loading,
  error,
  hasSubscriptions = true,
  hasMore = false,
  loadingMore = false,
  onRetry,
  onLoadMore,
  onEntityClick,
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return <ErrorPanel message="UNABLE_TO_LOAD_SIGNALS" onRetry={onRetry} />;
  }

  if (!hasSubscriptions) {
    return (
      <EmptyState
        title="Follow an entity to build your intelligence feed."
        description="Signals from entities you follow will appear here."
      />
    );
  }

  if (!events.length) {
    return <EmptyState title="No signals yet." description="There are no signals available for the entities you follow." />;
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} onEntityClick={onEntityClick} />
      ))}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="rounded border px-6 py-3 font-mono text-xs font-bold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
            style={{ borderColor: "#3A4250", color: "#ECEEF1" }}
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}

export default FeedList;