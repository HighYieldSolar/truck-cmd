"use client";

import { Layers, ChevronDown } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

/**
 * Drivers / Vehicles / Maintenance tab strip + saved view chip on the right.
 */
export default function FleetTabs({ active = "drivers", counts = {}, onChange, savedView }) {
  const { t } = useTranslation("fleet");
  const tabs = [
    ["drivers", t("drivers.title", "Drivers")],
    ["vehicles", t("vehicles.title", "Vehicles")],
    ["maintenance", t("maintenance.title", "Maintenance")],
  ];
  return (
    <div className="flex items-end gap-4 px-5 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
      {tabs.map(([k, label]) => {
        const isActive = active === k;
        const count = counts[k] ?? 0;
        return (
          <button
            key={k}
            onClick={() => onChange?.(k)}
            className={`-mb-px py-3 inline-flex items-center gap-2 text-[13px] tracking-tight border-b-2 transition ${
              isActive
                ? "text-gray-900 dark:text-gray-100 font-semibold border-blue-600 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400 font-medium border-transparent hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {label}
            <span
              className={`text-[11px] px-1.5 rounded-md tabular-nums font-semibold ${
                isActive ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
      <div className="flex-1" />
      {savedView && (
        <span className="hidden md:inline-flex items-center gap-1 pb-3 text-[11.5px] text-gray-500 dark:text-gray-400">
          <Layers size={11} className="text-gray-400 dark:text-gray-500" />
          {t("redesign.savedView", "Saved view")}:{" "}
          <b className="text-gray-700 dark:text-gray-200 ml-0.5">{savedView}</b>
          <ChevronDown size={10} className="text-gray-400 dark:text-gray-500" />
        </span>
      )}
    </div>
  );
}
