"use client";

import { User, Search, Truck, Wrench } from "lucide-react";

const ICONS = { drivers: User, vehicles: Truck, maintenance: Wrench };

/**
 * Empty / no-results state used by all three tabs. `kind="empty"` is "no rows
 * exist yet" (sells the import); `kind="noresults"` is "filters too tight".
 */
export default function FleetEmptyState({
  kind = "empty",
  entity = "drivers",
  onPrimary,
  onSecondary,
  onClearFilters,
  filtersSummary,
}) {
  const Icon = ICONS[entity] || User;

  if (kind === "empty") {
    const copy = COPY[entity] || COPY.drivers;
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800 py-16">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 mx-auto mb-3.5 rounded-[10px] bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Icon size={22} className="text-gray-400 dark:text-gray-500" />
          </div>
          <div className="text-[16px] font-semibold mb-1 text-gray-900 dark:text-gray-100">{copy.title}</div>
          <div className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mb-4 max-w-[400px] mx-auto">
            {copy.body}
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={onPrimary}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-[13px] font-medium"
            >
              {copy.primary}
            </button>
            <button
              onClick={onSecondary}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-[13px] font-medium hover:bg-slate-50 dark:hover:bg-gray-600"
            >
              {copy.secondary}
            </button>
          </div>
          <div className="mt-3.5 text-[11.5px] text-gray-400 dark:text-gray-500">
            Already connected an ELD?{" "}
            <a className="text-blue-700 dark:text-blue-400 underline-offset-2 hover:underline cursor-pointer">
              Sync from your provider
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800 py-12">
      <div className="text-center max-w-[380px]">
        <div className="w-9 h-9 mx-auto mb-3 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <Search size={16} className="text-gray-400 dark:text-gray-500" />
        </div>
        <div className="text-[14px] font-semibold mb-1 text-gray-900 dark:text-gray-100">No {entity} match your filters</div>
        {filtersSummary && (
          <div className="text-[12.5px] text-gray-500 dark:text-gray-400 mb-3.5">{filtersSummary}</div>
        )}
        <div className="flex gap-1.5 justify-center">
          <button
            onClick={onClearFilters}
            className="inline-flex items-center h-7 px-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-[12.5px] font-medium text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-600"
          >
            Clear filters
          </button>
        </div>
      </div>
    </div>
  );
}

const COPY = {
  drivers: {
    title: "No drivers yet",
    body: "Add your first driver to start assigning loads, tracking HOS, and monitoring DOT compliance.",
    primary: "Add driver",
    secondary: "Import from CSV",
  },
  vehicles: {
    title: "No vehicles yet",
    body: "Add a vehicle to start tracking compliance documents, fault codes, and IFTA mileage.",
    primary: "Add vehicle",
    secondary: "Import from CSV",
  },
  maintenance: {
    title: "No maintenance scheduled",
    body: "Schedule preventive maintenance, oil changes, and DOT inspections to stay ahead of breakdowns.",
    primary: "Schedule maintenance",
    secondary: "View history",
  },
};
