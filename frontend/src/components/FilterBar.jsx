import { SIGNAL, TEXT, TEXT_DIM, LINE, LINE_BRIGHT, MUTED, getEventTypeMeta } from "../constants/theme";

function FilterBar({
  availableEventTypes,
  selectedEventType,
  onSelectEventType,
  sortOrder,
  onChangeSortOrder,
  activeFilterCount,
  filteredCount,
  totalCount,
  selectedEntityName,
  onClearFilters,
}) {
  return (
    <div className="border-b pb-4" style={{ borderColor: LINE }}>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <button
          type="button"
          onClick={() => onSelectEventType(null)}
          className="relative pb-2.5 font-mono text-xs font-bold uppercase tracking-wide"
          style={{ color: !selectedEventType ? TEXT : MUTED }}
        >
          All
          {!selectedEventType && (
            <span className="absolute -bottom-[17px] left-0 h-[2px] w-full" style={{ background: SIGNAL }} />
          )}
        </button>

        {availableEventTypes.map((type) => {
          const meta = getEventTypeMeta(type);
          const isSelected = selectedEventType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelectEventType(isSelected ? null : type)}
              aria-pressed={isSelected}
              className="relative flex items-center gap-1.5 pb-2.5 font-mono text-xs font-bold uppercase tracking-wide transition-colors"
              style={{ color: isSelected ? meta.color : MUTED }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
              {meta.label}
              {isSelected && (
                <span className="absolute -bottom-[17px] left-0 h-[2px] w-full" style={{ background: meta.color }} />
              )}
            </button>
          );
        })}

        <select
          value={sortOrder}
          onChange={(e) => onChangeSortOrder(e.target.value)}
          className="ml-auto rounded px-2.5 py-1.5 font-mono text-xs font-bold focus:outline-none"
          style={{ border: `1px solid ${LINE_BRIGHT}`, background: "transparent", color: TEXT_DIM }}
        >
          <option value="newest" style={{ background: "#1B2027" }}>NEWEST</option>
          <option value="oldest" style={{ background: "#1B2027" }}>OLDEST</option>
        </select>
      </div>

      <p className="mt-4 text-xs" style={{ color: MUTED }}>
        {activeFilterCount > 0 ? (
          <>
            Showing {filteredCount} of {totalCount}
            {selectedEntityName ? ` for ${selectedEntityName}` : ""}
            {" · "}
            <button type="button" onClick={onClearFilters} className="font-bold hover:underline" style={{ color: SIGNAL }}>
              Clear filters
            </button>
          </>
        ) : (
          `Showing all ${totalCount} signals`
        )}
      </p>
    </div>
  );
}

export default FilterBar;