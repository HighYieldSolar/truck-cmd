"use client";

import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

/**
 * Generic fleet table shell. Each tab supplies its own column definitions and
 * row renderer; this component handles the sticky header chrome + scroll body
 * + states (empty/loading/error).
 *
 * @param {object} props
 * @param {Array<{ key: string, label: string, w?: number|string, right?: boolean, sortable?: boolean }>} props.columns
 * @param {string} [props.sortKey]    e.g. "name"
 * @param {"asc"|"desc"} [props.sortDir]
 * @param {(key: string) => void} [props.onSort]
 * @param {boolean} [props.allSelected]
 * @param {(checked: boolean) => void} [props.onSelectAll]
 * @param {React.ReactNode} props.children   row markup
 * @param {React.ReactNode} [props.empty]    empty/no-results state
 * @param {boolean} [props.loading]
 * @param {React.ReactNode} [props.skeleton]
 */
export default function FleetTable({
  columns,
  sortKey,
  sortDir,
  onSort,
  allSelected,
  someSelected,
  onSelectAll,
  children,
  empty,
  loading,
  skeleton,
  selectable = true,
}) {
  const { t } = useTranslation("fleet");
  return (
    <div className="flex-1 overflow-auto bg-white dark:bg-gray-800">
      <div className="min-w-full md:min-w-max">
        <div className="sticky top-0 z-[1] flex items-center bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700 hidden md:flex">
          {selectable && (
            <div className="w-9 flex items-center justify-center">
              <input
                type="checkbox"
                aria-label={t("redesign.selectAll", "Select all")}
                className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 accent-blue-600 dark:accent-blue-500 cursor-pointer"
                checked={!!allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = !!someSelected && !allSelected;
                }}
                onChange={(e) => onSelectAll?.(e.target.checked)}
              />
            </div>
          )}
          {columns.map((c) => (
            <button
              key={c.key}
              onClick={() => c.sortable !== false && onSort?.(c.key)}
              disabled={c.sortable === false}
              style={c.w != null ? { flex: `0 0 ${typeof c.w === "number" ? `${c.w}px` : c.w}` } : { flex: 1, minWidth: 0 }}
              className={`px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1 ${
                c.right ? "justify-end" : "justify-start"
              } ${c.sortable === false ? "cursor-default" : "hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"}`}
            >
              <span>{c.labelKey ? t(c.labelKey, c.label) : c.label}</span>
              {c.sortable !== false && (
                <SortIcon active={sortKey === c.key} dir={sortDir} />
              )}
            </button>
          ))}
        </div>
        {loading ? (
          skeleton
        ) : empty ? (
          empty
        ) : (
          <div role="rowgroup">{children}</div>
        )}
      </div>
    </div>
  );
}

function SortIcon({ active, dir }) {
  if (!active) return <ChevronsUpDown size={11} className="text-gray-300 dark:text-gray-600" />;
  return dir === "asc" ? (
    <ChevronUp size={11} className="text-gray-700 dark:text-gray-300" />
  ) : (
    <ChevronDown size={11} className="text-gray-700 dark:text-gray-300" />
  );
}

/**
 * Generic row wrapper — alignment, hover, selection, click handler.
 * Tabs use this so the look stays uniform; the inner content is per-tab.
 */
export function FleetRow({ selected, onClick, children, dense, ariaLabel }) {
  return (
    <div
      role="row"
      tabIndex={0}
      aria-selected={selected || undefined}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(e);
        }
      }}
      className={`flex flex-wrap md:flex-nowrap items-stretch border-b border-gray-100 dark:border-gray-700/50 cursor-pointer transition ${
        selected ? "bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50" : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
      } focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400 ${
        dense ? "min-h-[36px] py-1" : "min-h-[44px] py-2"
      }`}
    >
      {children}
    </div>
  );
}
