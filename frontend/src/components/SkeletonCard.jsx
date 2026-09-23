import { LINE, SURFACE } from "../constants/theme";

function SkeletonCard() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-md"
      style={{ border: `1px solid ${LINE}`, background: SURFACE }}
    >
      <div className="h-9 w-full" style={{ background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${LINE}` }} />
      <div className="space-y-3.5 px-7 py-6">
        <div className="h-6 w-1/3 rounded" style={{ background: LINE }} />
        <div className="h-3.5 w-full rounded" style={{ background: LINE }} />
        <div className="h-3.5 w-5/6 rounded" style={{ background: LINE }} />
      </div>
    </div>
  );
}

export default SkeletonCard;