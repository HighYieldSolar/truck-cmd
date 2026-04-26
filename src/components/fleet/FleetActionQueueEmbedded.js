"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  AlertCircle,
  FileText,
  Wrench,
  Shield,
  Clock,
  AlarmClock,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

const ICONS = {
  alertTri: AlertTriangle,
  alert: AlertCircle,
  fileText: FileText,
  wrench: Wrench,
  shield: Shield,
  clock: Clock,
  inbox: Inbox,
};

const SEV = {
  crit: { stripe: "bg-rose-500", icBg: "bg-rose-50", icFg: "text-rose-600", label: "Critical" },
  warn: { stripe: "bg-amber-500", icBg: "bg-amber-50", icFg: "text-amber-600", label: "Warning" },
  info: { stripe: "bg-slate-300", icBg: "bg-slate-100", icFg: "text-slate-500 dark:text-gray-400", label: "Info" },
};

/**
 * Embedded action queue card — sits above the tabs. Shows top 3 by default.
 * Click an item → opens the relevant drawer via onItemClick(item).
 */
export default function FleetActionQueueEmbedded({ items = [], onItemClick }) {
  const { t } = useTranslation("fleet");
  const [collapsed, setCollapsed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, 3);
  const counts = items.reduce(
    (a, x) => ({ ...a, [x.sev]: (a[x.sev] || 0) + 1 }),
    { crit: 0, warn: 0, info: 0 }
  );

  return (
    <div className="mt-4 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden shrink-0">
      <div
        className={`px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/40 ${
          collapsed ? "" : "border-b border-gray-100 dark:border-gray-700"
        }`}
      >
        {/* Row 1 — title + count + collapse toggle (always visible) */}
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-slate-600 dark:text-gray-400 flex-shrink-0" />
          <span className="text-[13px] font-semibold tracking-tight text-slate-900 dark:text-gray-100">
            {t("redesign.actionQueue", "Action queue")}
          </span>
          <span
            className={`inline-flex items-center px-1.5 rounded-lg text-[11px] font-semibold tabular-nums flex-shrink-0 ${
              items.length > 0
                ? "bg-slate-100 text-slate-600 dark:text-gray-400"
                : "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
            }`}
          >
            {items.length}
          </span>

          {/* Desktop-only severity counts inline on row 1 */}
          <div className="hidden sm:flex items-center gap-2 ml-2">
            {counts.crit > 0 && (
              <span className="inline-flex items-center gap-1 text-[11.5px] text-rose-700 dark:text-rose-300 font-medium whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {counts.crit} {t("redesign.critical", "critical")}
              </span>
            )}
            {counts.warn > 0 && (
              <span className="inline-flex items-center gap-1 text-[11.5px] text-amber-700 dark:text-amber-300 font-medium whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {counts.warn} {t("redesign.warning", "warning")}
              </span>
            )}
          </div>

          <div className="flex-1" />

          {/* Desktop View all */}
          {items.length > 3 && !collapsed && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="hidden sm:inline text-[11.5px] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-100 font-medium whitespace-nowrap"
            >
              {showAll ? t("redesign.showTop3", "Show top 3") : t("redesign.viewAllN", "View all ({{n}})", { n: items.length })}
            </button>
          )}

          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-gray-700 flex-shrink-0"
            aria-label={collapsed ? t("redesign.expand", "Expand") : t("redesign.collapse", "Collapse")}
          >
            {collapsed ? (
              <ChevronDown size={14} className="text-slate-500 dark:text-gray-400" />
            ) : (
              <ChevronUp size={14} className="text-slate-500 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* Row 2 — mobile-only: severity counts + view-all */}
        {(counts.crit > 0 || counts.warn > 0 || (items.length > 3 && !collapsed)) && (
          <div className="sm:hidden flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-200/70 dark:border-gray-700/70">
            <div className="flex items-center gap-3">
              {counts.crit > 0 && (
                <span className="inline-flex items-center gap-1 text-[11.5px] text-rose-700 dark:text-rose-300 font-medium whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {counts.crit} {t("redesign.critical", "critical")}
                </span>
              )}
              {counts.warn > 0 && (
                <span className="inline-flex items-center gap-1 text-[11.5px] text-amber-700 dark:text-amber-300 font-medium whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {counts.warn} {t("redesign.warning", "warning")}
                </span>
              )}
            </div>
            {items.length > 3 && !collapsed && (
              <button
                onClick={() => setShowAll((s) => !s)}
                className="text-[11.5px] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-100 font-medium whitespace-nowrap"
              >
                {showAll ? t("redesign.showTop3", "Show top 3") : t("redesign.viewAllN", "View all ({{n}})", { n: items.length })}
              </button>
            )}
          </div>
        )}
      </div>

      {!collapsed && (
        <div className={showAll ? "max-h-[480px] overflow-y-auto" : ""}>
          {items.length === 0 ? (
            <EmptyState />
          ) : (
            visible.map((x) => (
              <ActionRow key={x.id} item={x} onClick={() => onItemClick?.(x)} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ActionRow({ item, onClick }) {
  const { t } = useTranslation("fleet");
  const c = SEV[item.sev] || SEV.info;
  const Icon = ICONS[item.icon] || AlertCircle;
  return (
    <div className="relative flex items-start gap-2.5 px-3.5 py-2.5 border-b border-gray-100 dark:border-gray-700/50 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition cursor-pointer">
      <span className={`absolute left-0 top-0 bottom-0 w-0.5 ${c.stripe}`} />
      <div
        className={`shrink-0 w-6 h-6 rounded-md ${c.icBg} flex items-center justify-center mt-px`}
      >
        <Icon size={13} strokeWidth={2} className={c.icFg} />
      </div>
      <button onClick={onClick} className="flex-1 min-w-0 text-left">
        <div className="text-[13px] font-medium text-slate-900 dark:text-gray-100 leading-snug truncate">
          {item.title}
        </div>
        <div className="text-[12px] text-slate-500 dark:text-gray-400 mt-0.5 truncate">
          <span className="text-blue-700 dark:text-blue-400 font-medium">{item.driver}</span>
          {item.sub ? <span> · {item.sub}</span> : null}
        </div>
      </button>
      {item.action && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className="shrink-0 inline-flex items-center h-6 px-2 rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-[11.5px] font-medium text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-600"
        >
          {item.action}
        </button>
      )}
      <button
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 p-1 rounded hover:bg-slate-100 dark:hover:bg-gray-700"
        aria-label={t("redesign.snooze", "Snooze")}
      >
        <AlarmClock size={13} className="text-slate-500 dark:text-gray-400" />
      </button>
      <button
        onClick={onClick}
        className="shrink-0 p-1 rounded hover:bg-slate-100 dark:hover:bg-gray-700"
        aria-label={t("redesign.open", "Open")}
      >
        <ChevronRight size={13} className="text-slate-400 dark:text-gray-500" />
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center gap-3 px-5 py-5">
      <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center">
        <Check size={16} strokeWidth={2.5} className="text-emerald-600 dark:text-emerald-400" />
      </div>
      <div>
        <div className="text-[13.5px] font-semibold text-slate-900 dark:text-gray-100">
          All clear — no fleet actions needed today
        </div>
        <div className="text-[12px] text-slate-500 dark:text-gray-400 mt-0.5">
          Next: <b className="text-slate-700 dark:text-gray-300">3 docs expire next week</b>
        </div>
      </div>
    </div>
  );
}
