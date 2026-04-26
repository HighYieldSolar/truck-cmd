"use client";

/**
 * Location-age chip: "now" / "Nm" / "Nh" / "Nd".
 * Color shifts with staleness:
 *   < 5m   → emerald  (live)
 *   < 30m  → emerald
 *   < 24h  → amber    (stale)
 *   ≥ 24h  → rose     (lost)
 */
export default function LocationAge({ ageMinutes, label }) {
  const a = Number(ageMinutes ?? 0);
  let cls = "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (a > 30) cls = "bg-amber-50 text-amber-700 border-amber-100";
  if (a > 1440) cls = "bg-rose-50 text-rose-700 border-rose-100";
  const txt = label || ageToLabel(a);
  return (
    <span
      className={`ml-1.5 inline-flex items-center h-4 px-1.5 rounded-full border text-[10.5px] font-semibold tracking-tight whitespace-nowrap ${cls}`}
    >
      {txt}
    </span>
  );
}

export function ageToLabel(minutes) {
  if (minutes < 2) return "now";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
}
