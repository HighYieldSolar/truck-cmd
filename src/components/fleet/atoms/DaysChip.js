"use client";

import { Check, X, AlertCircle, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

/**
 * Days-to-expiry chip with thresholds:
 *   < 0          → red "Expired"   (X icon)
 *   0–7          → rose "Nd"       (AlertCircle)
 *   8–14         → amber "Nd"      (AlertTriangle)
 *   15–30        → yellow "Nd"     (AlertTriangle)
 *   > 30 / null  → emerald "Valid" (Check)
 */
export default function DaysChip({ days, label }) {
  const { t } = useTranslation("fleet");
  let Icon, cls, txt;
  if (days == null || days > 30) {
    Icon = Check;
    cls = "bg-emerald-50 text-emerald-700 border-emerald-100";
    txt = label || t("healthScore.valid", "Valid");
  } else if (days < 0) {
    Icon = X;
    cls = "bg-rose-50 text-rose-700 border-rose-100";
    txt = t("healthScore.expired", "Expired");
  } else if (days <= 7) {
    Icon = AlertCircle;
    cls = "bg-rose-50 text-rose-700 border-rose-100";
    txt = `${days}d`;
  } else if (days <= 14) {
    Icon = AlertTriangle;
    cls = "bg-amber-50 text-amber-700 border-amber-100";
    txt = `${days}d`;
  } else {
    Icon = AlertTriangle;
    cls = "bg-yellow-50 text-yellow-700 border-yellow-100";
    txt = `${days}d`;
  }
  return (
    <span
      className={`inline-flex items-center gap-1 h-5 px-1.5 rounded border text-[11.5px] font-medium tabular-nums tracking-tight whitespace-nowrap ${cls}`}
      title={label ? `${label}: ${txt}` : undefined}
    >
      <Icon size={11} strokeWidth={2.25} />
      {txt}
    </span>
  );
}
