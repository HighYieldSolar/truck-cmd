"use client";

import { Truck, CheckCircle2, Pencil, ExternalLink, Trash2 } from "lucide-react";
import { StatusPill, DaysChip, ManualBadge, RowMenu } from "../atoms";
import { FleetRow } from "../FleetTable";
import { useTranslation } from "@/context/LanguageContext";

export default function MaintenanceRow({
  m,
  kind = "upcoming",
  dense,
  isSelected,
  onClick,
  onSelect,
  onMarkComplete,
  onEdit,
  onOpen,
  onDelete,
}) {
  const { t } = useTranslation("fleet");
  const overdue = kind === "upcoming" && m.due != null && m.due < 0;
  return (
    <div
      className={`relative ${overdue ? "bg-rose-50/60 dark:bg-rose-950/30" : ""}`}
      onClick={onClick}
    >
      <FleetRow selected={isSelected} dense={dense} ariaLabel={m.type}>
        <div
          className="w-9 flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            aria-label={`Select ${m.type}`}
            checked={!!isSelected}
            onChange={(e) => onSelect?.(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 accent-blue-600 dark:accent-blue-500 cursor-pointer"
          />
        </div>

        <div className="flex-1 min-w-0 px-2.5 flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
            <Truck size={12} className="text-slate-600 dark:text-gray-400" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 dark:text-gray-100 text-[13px] truncate">{m.vehicle}</div>
            {m.vid && <div className="font-mono text-[11px] text-slate-500 dark:text-gray-400">{m.vid}</div>}
          </div>
        </div>

        <div className="px-2.5 min-w-0" style={{ flex: "0 0 280px" }}>
          <div className="font-medium text-slate-800 dark:text-gray-200 text-[13px] truncate">{m.type}</div>
          {(kind === "upcoming" ? m.odo : m.odo) && (
            <div className="text-[11.5px] text-slate-500 dark:text-gray-400 mt-0.5">{m.odo}</div>
          )}
        </div>

        <div className="hidden md:flex px-2.5 items-center" style={{ flex: "0 0 110px" }}>
          {kind === "upcoming" ? (
            m.due != null ? (
              <DaysChip days={m.due} label="Due" />
            ) : (
              <span className="text-slate-300">—</span>
            )
          ) : (
            <span className="text-[12px] text-slate-700 dark:text-gray-300 tabular-nums">
              {m.completed || "—"}
            </span>
          )}
        </div>

        <div className="hidden md:flex px-2.5 items-center" style={{ flex: "0 0 110px" }}>
          <StatusPill status={m.status} />
        </div>

        <div
          className="hidden md:flex px-2.5 items-center text-[12.5px] text-slate-600 dark:text-gray-400 truncate"
          style={{ flex: "0 0 200px" }}
        >
          <span className="truncate">{m.provider}</span>
          {m.manual && <span className="ml-1.5"><ManualBadge /></span>}
        </div>

        <div
          className="hidden md:flex px-2.5 items-center justify-end font-mono tabular-nums text-[12.5px] text-slate-700 dark:text-gray-300"
          style={{ flex: "0 0 110px" }}
        >
          ${m.cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          {kind === "upcoming" && m.est && (
            <span className="text-[10px] text-slate-400 dark:text-gray-500 ml-1">est</span>
          )}
        </div>

        {kind === "history" && (
          <div className="hidden md:flex items-center justify-center" style={{ flex: "0 0 50px" }}>
            {m.synced ? (
              <span title="Synced to expenses">
                <CheckCircle2 size={14} className="text-emerald-600" />
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 dark:text-gray-500">—</span>
            )}
          </div>
        )}

        <div
          className="px-2.5 flex items-center justify-end"
          style={{ flex: "0 0 130px" }}
          onClick={(e) => e.stopPropagation()}
        >
          {kind === "upcoming" &&
            (m.status === "Pending" || m.status === "Scheduled" || m.status === "Overdue" || m.status === "In Progress") && (
              <button
                onClick={() => onMarkComplete?.(m)}
                className="inline-flex items-center h-6 px-2 rounded-md bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 text-[11.5px] font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-600"
              >
                {t("maintenanceForm.markComplete", "Mark complete")}
              </button>
            )}
        </div>

        <div className="w-9 flex items-center justify-center self-start md:self-stretch flex-shrink-0">
          <RowMenu
            ariaLabel={t("redesign.actionsFor", "Actions for {{name}}", { name: m.type })}
            items={[
              { label: t("redesign.openDetails", "Open details"), icon: ExternalLink, onClick: () => onOpen?.(m) },
              { label: t("redesign.editRecord", "Edit record"), icon: Pencil, onClick: () => onEdit?.(m) },
              { label: t("redesign.deleteRecord", "Delete record"), icon: Trash2, onClick: () => onDelete?.(m), danger: true },
            ]}
          />
        </div>
      </FleetRow>
    </div>
  );
}

export const MAINTENANCE_COLUMNS_UPCOMING = [
  { key: "vehicle", label: "Vehicle", labelKey: "redesign.cols.vehicle", sortable: true },
  { key: "type", label: "Type", labelKey: "redesign.cols.type", w: 280, sortable: true },
  { key: "due", label: "Due", labelKey: "redesign.cols.due", w: 110, sortable: true },
  { key: "status", label: "Status", labelKey: "redesign.cols.status", w: 110, sortable: true },
  { key: "provider", label: "Provider", labelKey: "redesign.cols.provider", w: 200, sortable: false },
  { key: "cost", label: "Cost", labelKey: "redesign.cols.cost", w: 110, right: true, sortable: true },
  { key: "_action", label: "", w: 130, sortable: false },
  { key: "_more", label: "", w: 36, sortable: false },
];

export const MAINTENANCE_COLUMNS_HISTORY = [
  { key: "vehicle", label: "Vehicle", labelKey: "redesign.cols.vehicle", sortable: true },
  { key: "type", label: "Type", labelKey: "redesign.cols.type", w: 280, sortable: true },
  { key: "completed", label: "Completed", labelKey: "redesign.cols.completed", w: 110, sortable: true },
  { key: "status", label: "Status", labelKey: "redesign.cols.status", w: 110, sortable: false },
  { key: "provider", label: "Provider", labelKey: "redesign.cols.provider", w: 200, sortable: false },
  { key: "cost", label: "Cost", labelKey: "redesign.cols.cost", w: 110, right: true, sortable: true },
  { key: "synced", label: "Sync", labelKey: "redesign.cols.sync", w: 50, sortable: false },
  { key: "_action", label: "", w: 130, sortable: false },
  { key: "_more", label: "", w: 36, sortable: false },
];
