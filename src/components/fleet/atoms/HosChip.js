"use client";

import { TruckIcon, Clock, Pause, Bed, WifiOff } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

const DUTY_I18N = {
  Driving: "hos.driving",
  "On Duty": "hos.onDuty",
  "Off Duty": "hos.offDuty",
  Sleeper: "hos.sleeper",
  "Not Connected": "hos.notConnected",
};

const DUTY = {
  Driving: {
    Icon: TruckIcon,
    cls: "bg-emerald-50 text-emerald-700 border-emerald-100 border-solid",
    dot: "bg-emerald-500",
    pulse: true,
  },
  "On Duty": {
    Icon: Clock,
    cls: "bg-amber-50 text-amber-700 border-amber-100 border-solid",
    dot: "bg-amber-500",
  },
  "Off Duty": {
    Icon: Pause,
    cls: "bg-slate-100 text-slate-600 border-slate-200 border-solid",
    dot: "bg-slate-400",
  },
  Sleeper: {
    Icon: Bed,
    cls: "bg-slate-100 text-slate-600 border-slate-200 border-solid",
    dot: "bg-slate-400",
  },
  "Not Connected": {
    Icon: WifiOff,
    cls: "bg-transparent text-slate-500 border-slate-200 border-dashed",
    dot: "bg-slate-300",
  },
};

const SIZE = {
  xs: { h: "h-[18px]", px: "px-1.5", gap: "gap-1", text: "text-[11px]", dot: "w-1 h-1" },
  sm: { h: "h-[22px]", px: "px-2", gap: "gap-1.5", text: "text-[12px]", dot: "w-1.5 h-1.5" },
  md: { h: "h-[26px]", px: "px-2.5", gap: "gap-1.5", text: "text-[13px]", dot: "w-[7px] h-[7px]" },
};

/**
 * HOS chip — duty status + remaining time. The most novel atom in the system.
 * @param {object} props
 * @param {"Driving"|"On Duty"|"Off Duty"|"Sleeper"|"Not Connected"} props.duty
 * @param {string} [props.remaining] e.g. "6:42"
 * @param {boolean} [props.stale]
 * @param {"xs"|"sm"|"md"} [props.size]
 */
export default function HosChip({ duty, remaining, stale, size = "sm" }) {
  const { t } = useTranslation("fleet");
  const cfg = DUTY[duty] || DUTY["Not Connected"];
  const sz = SIZE[size];
  const key = DUTY_I18N[duty] || DUTY_I18N["Not Connected"];
  const dutyLabel = t(key, duty);
  return (
    <span
      className={`inline-flex items-center rounded-full border whitespace-nowrap font-medium tracking-tight ${sz.h} ${sz.px} ${sz.gap} ${sz.text} ${cfg.cls} ${stale ? "opacity-60" : ""}`}
    >
      <span className="relative inline-flex">
        <span className={`relative inline-block rounded-full ${sz.dot} ${cfg.dot}`} />
        {cfg.pulse && !stale && (
          <span className={`absolute inset-0 rounded-full ${cfg.dot} animate-ping opacity-60`} />
        )}
      </span>
      <span className="font-semibold">{dutyLabel}</span>
      {remaining && (
        <>
          <span className="opacity-40">·</span>
          <span className="tabular-nums">{remaining}</span>
        </>
      )}
      {stale && (
        <>
          <span className="opacity-40">·</span>
          <span className="italic text-amber-700">{t("hos.stale", "stale")}</span>
        </>
      )}
    </span>
  );
}
