"use client";

import { Search, SlidersHorizontal, ArrowUpDown, Rows3, List, Columns3, Map as MapIcon } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

/**
 * Per-tab filter bar — search + segment control + filter button + sort + density + columns.
 * Optional `mapToggle` prop renders a Hide map / Show map button (vehicles tab only).
 */
export default function FleetFilterBar({
  segments = [],
  activeSegment = "All",
  segmentCounts = {},
  segmentLabel, // optional: (segment) => translated string
  q = "",
  onSearch,
  onSegment,
  density = "comfortable",
  onDensity,
  filterCount = 0,
  onFilter,
  onSort,
  onColumns,
  mapToggle, // { on: bool, onToggle: () => void }
  rightSlot,
}) {
  const { t } = useTranslation("fleet");
  return (
    <div className="flex flex-wrap items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
      {segments.length > 0 && (
        <div className="inline-flex gap-px bg-gray-100 dark:bg-gray-900/40 p-0.5 rounded-md max-w-full overflow-x-auto">
          {segments.map((s) => {
            const isActive = activeSegment === s;
            const count = segmentCounts[s];
            const label = segmentLabel ? segmentLabel(s) : s;
            return (
              <button
                key={s}
                onClick={() => onSegment?.(s)}
                className={`px-2.5 py-1 rounded text-[12px] font-medium tracking-tight whitespace-nowrap transition ${
                  isActive
                    ? "bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                    : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-100"
                }`}
              >
                {label}
                {count != null && (
                  <span className="ml-1.5 text-slate-400 tabular-nums">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {segments.length > 0 && <div className="w-px h-4 bg-slate-200 dark:bg-gray-700 mx-1" />}

      <div className="inline-flex items-center gap-1.5 h-7 px-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-[12.5px] text-slate-700 dark:text-gray-200 w-[200px] focus-within:border-slate-400 dark:focus-within:border-gray-500">
        <Search size={12} className="text-slate-400 dark:text-gray-500" />
        <input
          value={q}
          onChange={(e) => onSearch?.(e.target.value)}
          placeholder={t("redesign.searchPlaceholder", "Search by name, ID, plate…")}
          className="flex-1 outline-none bg-transparent placeholder:text-slate-400 dark:placeholder:text-gray-500"
        />
      </div>

      {onFilter && (
        <button
          onClick={onFilter}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-[12.5px] font-medium text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-600"
        >
          <SlidersHorizontal size={12} />
          {t("redesign.filter", "Filter")}
          {filterCount > 0 && <span className="text-slate-400 ml-0.5">{filterCount}</span>}
        </button>
      )}

      {onSort && (
        <button
          onClick={onSort}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12.5px] font-medium text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700"
        >
          <ArrowUpDown size={13} />
          {t("redesign.sort", "Sort")}
        </button>
      )}

      <div className="flex-1" />

      {mapToggle && (
        <button
          onClick={mapToggle.onToggle}
          className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-[12.5px] font-semibold transition-colors ${
            mapToggle.on
              ? "bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
              : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/60"
          }`}
        >
          <MapIcon size={13} />
          {mapToggle.on ? t("redesign.hideMap", "Hide map") : t("redesign.showMap", "Show map")}
        </button>
      )}

      <div className="inline-flex gap-px bg-gray-100 dark:bg-gray-900/40 p-0.5 rounded-md">
        {[
          ["comfortable", Rows3, t("redesign.comfortable", "Comfortable")],
          ["compact", List, t("redesign.compact", "Compact")],
        ].map(([v, Icon, title]) => (
          <button
            key={v}
            onClick={() => onDensity?.(v)}
            title={title}
            className={`px-1.5 py-1 rounded transition ${
              density === v
                ? "bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                : "text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200"
            }`}
          >
            <Icon size={13} />
          </button>
        ))}
      </div>

      {onColumns && (
        <button
          onClick={onColumns}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12.5px] font-medium text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700"
        >
          <Columns3 size={13} />
          {t("redesign.columns", "Columns")}
        </button>
      )}

      {rightSlot}
    </div>
  );
}
