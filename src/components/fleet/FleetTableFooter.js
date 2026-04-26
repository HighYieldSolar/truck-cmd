"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function FleetTableFooter({
  count = 0,
  total = 0,
  page = 1,
  pageSize = 50,
  onPage,
  onPageSize,
}) {
  const { t } = useTranslation("fleet");
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-2 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-200 dark:border-gray-700 text-[12px] text-gray-500 dark:text-gray-400 shrink-0">
      {/* Row 1 on mobile: showing + rows-per-page */}
      <div className="flex items-center justify-between sm:justify-start sm:flex-1 gap-3">
        <span className="text-[12px]">
          {t("redesign.showing", "Showing")}{" "}
          <b className="text-gray-900 dark:text-gray-100 tabular-nums">
            {count === 0 ? 0 : 1}–{count}
          </b>{" "}
          {t("redesign.of", "of")}{" "}
          <b className="text-gray-900 dark:text-gray-100 tabular-nums">{total}</b>
        </span>
        <label className="inline-flex items-center gap-1.5">
          <span className="hidden sm:inline">{t("redesign.rowsPerPage", "Rows per page")}:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSize?.(Number(e.target.value))}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 font-semibold text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={t("redesign.rowsPerPage", "Rows per page")}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>

      {/* Row 2 on mobile: page navigation, evenly aligned */}
      <div className="flex items-center justify-center sm:justify-end gap-2">
        <button
          onClick={() => onPage?.(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 sm:w-8 sm:h-8 rounded border border-gray-300 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="tabular-nums px-2">
          {t("redesign.page", "Page")}{" "}
          <b className="text-slate-900 dark:text-gray-100">{page}</b>{" "}
          {t("redesign.of", "of")} {totalPages}
        </span>
        <button
          onClick={() => onPage?.(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 sm:w-8 sm:h-8 rounded border border-gray-300 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
