"use client";

import { useTranslation } from "@/context/LanguageContext";

const PALETTE = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-100 [--dot:theme(colors.emerald.500)]",
  "On Leave": "bg-amber-50 text-amber-700 border-amber-100 [--dot:theme(colors.amber.500)]",
  Onboarding: "bg-blue-50 text-blue-700 border-blue-100 [--dot:theme(colors.blue.500)]",
  Suspended: "bg-rose-50 text-rose-700 border-rose-100 [--dot:theme(colors.rose.500)]",
  Inactive: "bg-slate-100 text-slate-600 border-slate-200 [--dot:theme(colors.slate.400)]",
  Idle: "bg-slate-100 text-slate-600 border-slate-200 [--dot:theme(colors.slate.400)]",
  Maintenance: "bg-amber-50 text-amber-700 border-amber-100 [--dot:theme(colors.amber.500)]",
  "Out of service": "bg-rose-50 text-rose-700 border-rose-100 [--dot:theme(colors.rose.500)]",
  "In Maintenance": "bg-amber-50 text-amber-700 border-amber-100 [--dot:theme(colors.amber.500)]",
  Pending: "bg-slate-100 text-slate-600 border-slate-200 [--dot:theme(colors.slate.400)]",
  Scheduled: "bg-blue-50 text-blue-700 border-blue-100 [--dot:theme(colors.blue.500)]",
  "In Progress": "bg-amber-50 text-amber-700 border-amber-100 [--dot:theme(colors.amber.500)]",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-100 [--dot:theme(colors.emerald.500)]",
  Cancelled: "bg-slate-100 text-slate-500 border-slate-200 [--dot:theme(colors.slate.300)]",
  Overdue: "bg-rose-50 text-rose-700 border-rose-100 [--dot:theme(colors.rose.500)]",
};

const I18N_KEYS = {
  Active: "redesign.segments.active",
  "On Leave": "redesign.segments.onLeave",
  Onboarding: "redesign.segments.onboarding",
  Suspended: "redesign.segments.suspended",
  Inactive: "status.inactive",
  Idle: "redesign.segments.idle",
  Maintenance: "status.inMaintenance",
  "Out of service": "redesign.segments.outOfService",
  "In Maintenance": "redesign.segments.inMaintenance",
  Pending: "redesign.segments.pending",
  Scheduled: "redesign.segments.scheduled",
  "In Progress": "redesign.segments.inProgress",
  Completed: "redesign.segments.completed",
  Cancelled: "redesign.segments.cancelled",
  Overdue: "redesign.segments.overdue",
};

export default function StatusPill({ status }) {
  const { t } = useTranslation("fleet");
  const cls = PALETTE[status] || PALETTE.Inactive;
  const key = I18N_KEYS[status];
  const label = key ? t(key, status) : status;
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-5 px-2 rounded-full border text-[11.5px] font-medium tracking-tight whitespace-nowrap ${cls}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--dot)]" />
      {label}
    </span>
  );
}
