"use client";

/**
 * "MANUAL" / "N MANUAL" amber badge — surfaces records not auto-synced from ELD,
 * so dispatchers can audit data provenance.
 */
export default function ManualBadge({ count }) {
  const text = count != null ? `${count} manual` : "Manual";
  return (
    <span
      title={count != null ? `${count} manually entered` : "Manually entered"}
      className="inline-flex items-center gap-0.5 h-4 px-1.5 rounded bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-semibold uppercase tracking-wider"
    >
      {text}
    </span>
  );
}
