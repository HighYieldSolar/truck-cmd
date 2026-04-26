"use client";

import { Truck, Pause, MapPin, AlertTriangle, AlertCircle } from "lucide-react";
import { ageToLabel } from "./atoms/LocationAge";
import { useTranslation } from "@/context/LanguageContext";

const PALETTE = {
  emerald: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800 [--accent:theme(colors.emerald.500)]",
  amber: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800 [--accent:theme(colors.amber.500)]",
  slate: "bg-slate-50 dark:bg-gray-700/40 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-gray-600 [--accent:theme(colors.slate.500)]",
  rose: "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-800 [--accent:theme(colors.rose.500)]",
  muted: "bg-white dark:bg-gray-800 text-slate-500 dark:text-gray-500 border-slate-200 dark:border-gray-700 [--accent:theme(colors.slate.400)]",
};

/**
 * Five live count chips — Driving, On duty, In motion, Faults, HOS violations.
 * Clicking a chip applies that filter to the active tab (delegated via onPick).
 */
export default function FleetStatusStrip({
  counts = {},
  onPick,
  activeFilter,
  syncedAgo,
  syncedLabel,
}) {
  const { t } = useTranslation("fleet");
  const items = [
    { key: "driving", icon: Truck, label: t("strip.driving", "Driving"), val: counts.driving ?? 0, tone: "emerald", pulse: true, target: "drivers" },
    { key: "on-duty", icon: Pause, label: t("strip.onDuty", "On duty"), val: counts.onDuty ?? 0, tone: "amber", target: "drivers" },
    { key: "in-motion", icon: MapPin, label: t("strip.inMotion", "In motion"), val: counts.inMotion ?? 0, tone: "slate", target: "vehicles" },
    { key: "faults", icon: AlertTriangle, label: t("strip.activeFaults", "Active faults"), val: counts.faults ?? 0, tone: "rose", target: "vehicles" },
    { key: "hos-violations", icon: AlertCircle, label: t("strip.hosViolations", "HOS violations"), val: counts.hos ?? 0, tone: "rose", target: "drivers" },
  ];
  const syncedLbl = syncedLabel ?? t("strip.syncedFromEld", "Synced from ELD");
  return (
    <div className="px-3 sm:px-5 py-3">
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2">
        {items.map((it, idx) => {
          const muted = it.val === 0;
          const tone = muted ? "muted" : it.tone;
          const active = activeFilter === it.key;
          // When there's an odd count, the last cell would sit alone in the
          // mobile 2-col grid; let it span both columns so it fills the gap.
          const isLastOfOdd = idx === items.length - 1 && items.length % 2 === 1;
          return (
            <button
              key={it.key}
              onClick={() => onPick?.(it)}
              className={`min-w-0 inline-flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-lg border text-[12.5px] font-medium tracking-tight transition ${PALETTE[tone]} ${active ? "ring-2 ring-offset-1 ring-slate-900" : "hover:brightness-95"} ${isLastOfOdd ? "col-span-2 sm:col-span-1 justify-center sm:justify-start" : ""}`}
            >
              <span className="relative inline-flex items-center justify-center w-3 h-3 flex-shrink-0">
                <it.icon size={12} strokeWidth={1.75} />
                {it.pulse && !muted && (
                  <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)] ring-2 ring-emerald-50 dark:ring-emerald-900/40" />
                )}
              </span>
              <span className="text-[15px] font-semibold tabular-nums leading-none -tracking-[0.01em] flex-shrink-0">
                {it.val}
              </span>
              <span className="truncate">{it.label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-2 hidden sm:flex justify-end">
        <span className="text-[11px] text-slate-500 dark:text-gray-400 whitespace-nowrap">
          {syncedLbl} · <b className="text-slate-700 dark:text-gray-200 ml-1">{syncedAgo ? ageToLabel(syncedAgo) + " " + t("strip.ago", "ago") : "—"}</b>
        </span>
      </div>
    </div>
  );
}
