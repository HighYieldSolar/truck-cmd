"use client";

import { Pencil, Truck, Bell, Download, Archive } from "lucide-react";

/**
 * Replaces the FilterBar when ≥1 row is selected.
 * Bulk actions are tab-aware via `actions` prop; `count` shows N selected.
 */
export default function FleetSelectionBar({ count, onClear, actions = [] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-5 py-2.5 bg-blue-50 dark:bg-blue-900/30 border-b border-gray-200 dark:border-gray-700 shrink-0">
      <span className="text-[12.5px] font-semibold text-blue-700 dark:text-blue-300">{count} selected</span>
      <button
        onClick={onClear}
        className="inline-flex items-center h-7 px-2 rounded-md text-[12.5px] font-medium text-slate-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-800/40 dark:hover:bg-blue-800/40"
      >
        Clear
      </button>
      <div className="w-px h-4 bg-blue-200 dark:bg-blue-700/50 mx-1" />
      {actions.filter((a) => typeof a.onClick === "function").map((a) => (
        <button
          key={a.label}
          onClick={a.onClick}
          className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-[12.5px] font-medium ${
            a.danger
              ? "bg-white dark:bg-gray-700 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/30"
              : "bg-white dark:bg-gray-700 text-slate-700 dark:text-gray-200 border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-600"
          }`}
        >
          {a.icon}
          {a.label}
        </button>
      ))}
      <div className="flex-1" />
      <span className="hidden md:inline text-[11.5px] text-blue-700 dark:text-blue-300">
        Shift+click to range-select · Esc to clear
      </span>
    </div>
  );
}

// Pre-baked action recipes, exported for tabs to reuse.
export const SELECTION_ACTIONS = {
  drivers: ({ onEditStatus, onAssign, onNotify, onExport, onArchive }) => [
    { label: "Edit status", icon: <Pencil size={12} />, onClick: onEditStatus },
    { label: "Assign vehicle", icon: <Truck size={12} />, onClick: onAssign },
    { label: "Notify", icon: <Bell size={12} />, onClick: onNotify },
    { label: "Export", icon: <Download size={12} />, onClick: onExport },
    { label: "Archive", icon: <Archive size={12} />, onClick: onArchive, danger: true },
  ],
  vehicles: ({ onEditStatus, onAssign, onExport, onArchive }) => [
    { label: "Edit status", icon: <Pencil size={12} />, onClick: onEditStatus },
    { label: "Assign driver", icon: <Truck size={12} />, onClick: onAssign },
    { label: "Export", icon: <Download size={12} />, onClick: onExport },
    { label: "Archive", icon: <Archive size={12} />, onClick: onArchive, danger: true },
  ],
  maintenance: ({ onMarkComplete, onAssignVendor, onExport, onArchive }) => [
    { label: "Mark complete", icon: <Pencil size={12} />, onClick: onMarkComplete },
    { label: "Assign vendor", icon: <Truck size={12} />, onClick: onAssignVendor },
    { label: "Export", icon: <Download size={12} />, onClick: onExport },
    { label: "Archive", icon: <Archive size={12} />, onClick: onArchive, danger: true },
  ],
};
