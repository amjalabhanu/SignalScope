import { useEffect, useRef, useState } from "react";
import ErrorPanel from "./ErrorPanel";
import {
  LINE,
  LINE_BRIGHT,
  PANEL,
  SURFACE,
  TEXT,
  TEXT_DIM,
  MUTED,
  SIGNAL,
  VERIFIED,
} from "../constants/theme";

const AUTO_SCROLL_SPEED = 0.35; // px/frame — deliberately subtle, not marquee-fast

/**
 * Drives a gentle, continuous ping-pong auto-scroll on the rail.
 * Uses scrollLeft (not a transform) so it composes correctly with real
 * user scrolling/dragging, and needs no duplicated card list. Pauses
 * whenever `paused` is true and is a no-op entirely when the visitor
 * has prefers-reduced-motion set.
 */
function useAutoScroll(containerRef, paused, enabled) {
  const directionRef = useRef(1);

  useEffect(() => {
    if (!enabled) return undefined;

    const node = containerRef.current;
    if (!node) return undefined;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotionQuery.matches) return undefined;

    let frameId;
    let stopped = false;

    function handleReducedMotionChange(event) {
      if (event.matches) {
        stopped = true;
        cancelAnimationFrame(frameId);
      }
    }
    reducedMotionQuery.addEventListener?.("change", handleReducedMotionChange);

    function step() {
      if (stopped) return;

      if (!paused) {
        const max = node.scrollWidth - node.clientWidth;
        if (max > 0) {
          let next = node.scrollLeft + AUTO_SCROLL_SPEED * directionRef.current;
          if (next >= max) {
            next = max;
            directionRef.current = -1;
          } else if (next <= 0) {
            next = 0;
            directionRef.current = 1;
          }
          node.scrollLeft = next;
        }
      }
      frameId = requestAnimationFrame(step);
    }

    frameId = requestAnimationFrame(step);

    return () => {
      stopped = true;
      cancelAnimationFrame(frameId);
      reducedMotionQuery.removeEventListener?.("change", handleReducedMotionChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, paused, enabled]);
}

function StoryCardSkeleton() {
  return (
    <div
      className="h-[132px] w-[248px] shrink-0 animate-pulse rounded-md"
      style={{ border: `1px solid ${LINE}`, background: SURFACE }}
    />
  );
}

function StoryCard({ recommendation, onSelectEntity, onFollow, isFollowingNow }) {
  const entity = recommendation.entity;
  if (!entity) return null;

  return (
    <article
      className="w-[248px] shrink-0 rounded-md p-4"
      style={{ border: `1px solid ${LINE}`, background: SURFACE }}
    >
      <button type="button" onClick={() => onSelectEntity(entity.id)} className="block w-full text-left">
        <p className="font-['Fraunces'] text-[17px] font-bold leading-tight" style={{ color: TEXT }}>
          {entity.name}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wide" style={{ color: TEXT_DIM }}>
          {entity.type}
          {entity.ticker_symbol ? ` · ${entity.ticker_symbol}` : ""}
        </p>

        {recommendation.reason && (
          <p
            className="mt-2.5 font-mono text-[11px] leading-4"
            style={{
              color: MUTED,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {recommendation.reason}
          </p>
        )}
      </button>

      <div className="mt-3.5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSelectEntity(entity.id)}
          className="flex-1 rounded border px-2 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wide"
          style={{ borderColor: LINE_BRIGHT, color: TEXT_DIM }}
        >
          View
        </button>
        <button
          type="button"
          onClick={() => onFollow(entity.id)}
          disabled={isFollowingNow}
          className="flex-1 rounded border px-2 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
          style={{ borderColor: SIGNAL, color: SIGNAL }}
        >
          {isFollowingNow ? "..." : "+ Follow"}
        </button>
      </div>
    </article>
  );
}

function RailScrollButton({ direction, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Scroll recommendations left" : "Scroll recommendations right"}
      className="hidden shrink-0 items-center justify-center rounded-full font-mono text-sm sm:flex"
      style={{
        width: 28,
        height: 28,
        border: `1px solid ${LINE_BRIGHT}`,
        color: MUTED,
        background: PANEL,
      }}
    >
      {direction === "left" ? "‹" : "›"}
    </button>
  );
}

function RecommendationList({
  recommendations,
  loading,
  error,
  hasSubscriptions = true,
  onRetry,
  onSelectEntity,
  onFollow,
  followingEntityId = null,
}) {
  const railRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const canAutoScroll = !loading && !error && hasSubscriptions && recommendations.length > 2;

  useAutoScroll(railRef, paused, canAutoScroll);

  const pause = () => setPaused(true);
  const resume = () => setPaused(false);

  const scrollByCards = (direction) => {
    const node = railRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * 264, behavior: "smooth" });
  };

  const Heading = (
    <div className="flex items-baseline justify-between">
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: SIGNAL }}>
          Discovery
        </p>
        <h2 className="mt-1 font-['Fraunces'] text-lg font-bold" style={{ color: TEXT }}>
          Entities you may want to follow
        </h2>
      </div>
      <span className="hidden font-mono text-xs sm:inline" style={{ color: MUTED }}>
        →
      </span>
    </div>
  );

  if (loading) {
    return (
      <section className="space-y-3">
        {Heading}
        <div className="flex gap-3 overflow-hidden">
          <StoryCardSkeleton />
          <StoryCardSkeleton />
          <StoryCardSkeleton />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-3">
        {Heading}
        <ErrorPanel message="Unable to load recommendations." onRetry={onRetry} />
      </section>
    );
  }

  if (!hasSubscriptions) {
    return (
      <section className="space-y-3">
        {Heading}
        <p className="font-mono text-xs" style={{ color: TEXT_DIM }}>
          Follow entities to get related suggestions.
        </p>
      </section>
    );
  }

  if (!recommendations.length) {
    return (
      <section className="space-y-3">
        {Heading}
        <p className="font-mono text-xs" style={{ color: TEXT_DIM }}>
          No related entities found yet.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {Heading}

      <div className="flex items-center gap-2">
        <RailScrollButton direction="left" onClick={() => scrollByCards(-1)} />

        <div
          ref={railRef}
          onMouseEnter={pause}
          onMouseLeave={resume}
          onTouchStart={pause}
          onTouchEnd={resume}
          onPointerDown={pause}
          onFocus={pause}
          onBlur={resume}
          className="flex flex-1 gap-3 overflow-x-auto scroll-smooth pb-1"
          style={{ scrollbarWidth: "thin" }}
          tabIndex={0}
          role="region"
          aria-label="Recommended entities, scroll horizontally"
        >
          {recommendations.map((recommendation) => (
            <StoryCard
              key={recommendation.entity.id}
              recommendation={recommendation}
              onSelectEntity={onSelectEntity}
              onFollow={onFollow}
              isFollowingNow={followingEntityId === recommendation.entity.id}
            />
          ))}
        </div>

        <RailScrollButton direction="right" onClick={() => scrollByCards(1)} />
      </div>
    </section>
  );
}

export default RecommendationList;