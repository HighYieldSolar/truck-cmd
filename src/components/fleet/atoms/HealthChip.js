"use client";

import { CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";

const KIND = {
  healthy: { Icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  warning: { Icon: AlertCircle, cls: "bg-amber-50 text-amber-700 border-amber-100" },
  critical: { Icon: AlertTriangle, cls: "bg-rose-50 text-rose-700 border-rose-100" },
};

/**
 * Vehicle health summary chip.
 * @param {object} props
 * @param {{ kind: 'healthy'|'warning'|'critical', label?: string, count?: number }} props.health
 */
export default function HealthChip({ health }) {
  const k = health?.kind || "healthy";
  const cfg = KIND[k] || KIND.healthy;
  const label = health?.label || (k === "healthy" ? "Healthy" : k === "warning"
    ? `${health?.count ?? 0} warning${(health?.count ?? 0) === 1 ? "" : "s"}`
    : `${health?.count ?? 0} critical`);
  return (
    <span
      className={`inline-flex items-center gap-1 h-5 px-2 rounded-full border text-[11.5px] font-medium tracking-tight whitespace-nowrap ${cfg.cls}`}
    >
      <cfg.Icon size={11} strokeWidth={2.25} />
      {label}
    </span>
  );
}
