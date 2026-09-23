import { SIGNAL, TEXT, TEXT_DIM, LINE_BRIGHT, MUTED } from "../constants/theme";

function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="rounded-md p-9 text-center" style={{ border: `1px dashed ${LINE_BRIGHT}` }}>
      <p className="font-mono text-[11px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>
        No results
      </p>
      <h3 className="mt-2 font-['Fraunces'] text-xl font-bold" style={{ color: TEXT }}>
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: TEXT_DIM }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wide"
          style={{ background: SIGNAL, color: "#171208" }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;