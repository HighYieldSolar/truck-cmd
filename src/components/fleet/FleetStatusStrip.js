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
    <div className="flex items-center gap-2 px-5 py-3 overflow-x-auto">
      {items.map((it) => {
        const muted = it.val === 0;
        const tone = muted ? "muted" : it.tone;
        const active = activeFilter === it.key;
        return (
          <button
            key={it.key}
            onClick={() => onPick?.(it)}
            className={`inline-flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-lg border whitespace-nowrap text-[12.5px] font-medium tracking-tight transition ${PALETTE[tone]} ${active ? "ring-2 ring-offset-1 ring-slate-900" : "hover:brightness-95"}`}
          >
            <span className="relative inline-flex items-center justify-center w-3 h-3">
              <it.icon size={12} strokeWidth={1.75} />
              {it.pulse && !muted && (
                <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)] ring-2 ring-emerald-50" />
              )}
            </span>
            <span className="text-[15px] font-semibold tabular-nums leading-none -tracking-[0.01em]">
              {it.val}
            </span>
            <span>{it.label}</span>
          </button>
        );
      })}
      <div className="flex-1" />
      <span className="hidden sm:inline-flex items-center text-[11px] text-slate-500 dark:text-gray-400 whitespace-nowrap">
        {syncedLbl} · <b className="text-slate-700 dark:text-gray-200 ml-1">{syncedAgo ? ageToLabel(syncedAgo) + " " + t("strip.ago", "ago") : "—"}</b>
      </span>
    </div>
  );
}
