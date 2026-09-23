import { formatDetectedAt } from "../utils/formatters";
import { SIGNAL, TEXT, TEXT_DIM, LINE, LINE_BRIGHT, MUTED, SURFACE, ALERT, SHADOW_MD } from "../constants/theme";
import ErrorPanel from "./ErrorPanel";

function EntityDetail({
  loading,
  error,
  entity,
  subscriptionLoading,
  subscriptionError,
  onToggleSubscription,
  onClose,
  onRetry,
}) {
  if (loading) {
    return (
      <div
        className="animate-pulse rounded-md p-7"
        style={{ border: `1px solid ${LINE}`, background: SURFACE }}
      >
        <div className="h-3 w-24 rounded" style={{ background: LINE }} />
        <div className="mt-4 h-7 w-1/3 rounded" style={{ background: LINE }} />
        <div className="mt-7 h-3 w-2/3 rounded" style={{ background: LINE }} />
      </div>
    );
  }

  if (error) {
    return <ErrorPanel message="Couldn't load entity details." onRetry={onRetry} />;
  }

  if (!entity) return null;

  return (
    <article
      className="overflow-hidden rounded-md"
      style={{ border: `1px solid ${LINE_BRIGHT}`, background: SURFACE, boxShadow: SHADOW_MD }}
    >
      <div className="px-7 pt-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>
          Dossier · {entity.type}
        </p>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 px-7 pt-2">
        <div>
          <h2 className="font-['Fraunces'] text-[30px] font-extrabold leading-tight" style={{ color: TEXT }}>
            {entity.name}
          </h2>

          {entity.ticker_symbol && (
            <span
              className="mt-2 inline-block rounded px-2 py-0.5 font-mono text-xs font-bold"
              style={{ color: SIGNAL, background: "rgba(232,163,61,0.1)", border: `1px solid rgba(232,163,61,0.3)` }}
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
              background: entity.is_subscribed ? "transparent" : SIGNAL,
              color: entity.is_subscribed ? TEXT_DIM : "#171208",
              border: `1px solid ${entity.is_subscribed ? LINE_BRIGHT : SIGNAL}`,
            }}
          >
            {subscriptionLoading ? "Updating..." : entity.is_subscribed ? "Unfollow" : "+ Follow"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-2 font-mono text-xs font-bold uppercase tracking-wide"
            style={{ border: `1px solid ${LINE_BRIGHT}`, color: MUTED }}
          >
            Close
          </button>
        </div>
      </div>

      {subscriptionError && (
        <div className="mx-7 mt-4 rounded px-3.5 py-2.5" style={{ border: `1px solid rgba(226,114,91,0.35)`, background: "rgba(226,114,91,0.08)" }}>
          <p className="font-mono text-xs font-semibold" style={{ color: ALERT }}>
            {subscriptionError.message || "Couldn't update your subscription."}
          </p>
        </div>
      )}

      {Array.isArray(entity.aliases) && entity.aliases.length > 0 && (
        <div className="mx-7 mt-6 border-t pt-4" style={{ borderColor: LINE }}>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>
            Also known as
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {entity.aliases.map((alias, index) => (
              <span
                key={`${alias}-${index}`}
                className="rounded px-2.5 py-1 font-mono text-xs"
                style={{ background: "rgba(255,255,255,0.04)", color: TEXT_DIM, border: `1px solid ${LINE}` }}
              >
                {String(alias)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mx-7 mb-7 mt-6 grid grid-cols-2 gap-5 border-t pt-5" style={{ borderColor: LINE }}>
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>
            Status
          </p>
          <p className="mt-1 text-[15px] font-semibold" style={{ color: TEXT }}>
            {entity.is_subscribed ? "Following" : "Not following"}
          </p>
        </div>

        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>
            Added
          </p>
          <p className="mt-1 text-[15px] font-semibold" style={{ color: TEXT }}>
            {formatDetectedAt(entity.created_at)}
          </p>
        </div>
      </div>
    </article>
  );
}

export default EntityDetail;