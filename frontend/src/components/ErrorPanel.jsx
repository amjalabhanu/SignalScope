import { ALERT } from "../constants/theme";

function ErrorPanel({ message, onRetry }) {
  return (
    <div
      className="rounded-md p-6"
      style={{ border: `1px solid rgba(226,114,91,0.35)`, background: "rgba(226,114,91,0.06)" }}
    >
      <p className="font-mono text-sm font-bold" style={{ color: ALERT }}>
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded px-4 py-2 font-mono text-xs font-bold uppercase tracking-wide transition-transform active:scale-[0.98]"
        style={{ background: ALERT, color: "#1A0E0B" }}
      >
        Retry
      </button>
    </div>
  );
}

export default ErrorPanel;