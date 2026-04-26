"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const DEFAULT_TAB = "drivers";
const VALID_TABS = ["drivers", "vehicles", "maintenance"];

/**
 * Centralized URL state for the single fleet page.
 * Encodes: ?tab=drivers|vehicles|maintenance, ?row=<id>, ?q=<search>,
 *          ?status=<segment>, ?maint=upcoming|history, ?map=on|off.
 */
export default function useFleetUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const state = useMemo(() => {
    const rawTab = sp.get("tab");
    const tab = VALID_TABS.includes(rawTab) ? rawTab : DEFAULT_TAB;
    return {
      tab,
      row: sp.get("row") || null,
      q: sp.get("q") || "",
      status: sp.get("status") || "All",
      filterChip: sp.get("filter") || null, // e.g. "driving", "faults", "hos-violations"
      maint: sp.get("maint") === "history" ? "history" : "upcoming",
      mapOn: sp.get("map") !== "off", // default ON for vehicles tab
      density: sp.get("d") === "compact" ? "compact" : "comfortable",
    };
  }, [sp]);

  const update = useCallback(
    (patch, opts = {}) => {
      const next = new URLSearchParams(sp.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v == null || v === "" || v === false) next.delete(k);
        else next.set(k, String(v));
      });
      // Drop row if switching tabs unless explicitly set in patch
      if ("tab" in patch && !("row" in patch)) next.delete("row");
      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (opts.replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [router, pathname, sp]
  );

  const setTab = useCallback((tab) => update({ tab, row: null, status: null, filter: null }), [update]);
  const setRow = useCallback((id) => update({ row: id || null }), [update]);
  const closeRow = useCallback(() => update({ row: null }), [update]);
  const setSearch = useCallback((q) => update({ q: q || null }, { replace: true }), [update]);
  const setStatus = useCallback((s) => update({ status: s === "All" ? null : s }), [update]);
  const setFilterChip = useCallback((f) => update({ filter: f }), [update]);
  const setMaint = useCallback((m) => update({ maint: m === "history" ? "history" : null }), [update]);
  const toggleMap = useCallback(() => update({ map: state.mapOn ? "off" : null }), [update, state.mapOn]);
  const setDensity = useCallback((d) => update({ d: d === "compact" ? "compact" : null }, { replace: true }), [update]);

  return {
    ...state,
    update,
    setTab,
    setRow,
    closeRow,
    setSearch,
    setStatus,
    setFilterChip,
    setMaint,
    toggleMap,
    setDensity,
  };
}
