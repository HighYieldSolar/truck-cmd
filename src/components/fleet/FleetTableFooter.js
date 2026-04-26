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
    <div className="flex items-center gap-2 px-5 py-2 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-200 dark:border-gray-700 text-[12px] text-gray-500 dark:text-gray-400 shrink-0">
      <span>
        {t("redesign.showing", "Showing")}{" "}
        <b className="text-gray-900 dark:text-gray-100 tabular-nums">
          {count === 0 ? 0 : 1}–{count}
        </b>{" "}
        {t("redesign.of", "of")}{" "}
        <b className="text-gray-900 dark:text-gray-100 tabular-nums">{total}</b>
      </span>
      <div className="flex-1" />
      <span className="hidden sm:inline">
        {t("redesign.rowsPerPage", "Rows per page")}:
        <select
          value={pageSize}
          onChange={(e) => onPageSize?.(Number(e.target.value))}
          className="ml-1 bg-transparent font-semibold text-gray-700 dark:text-gray-300 outline-none"
        >
          <option>25</option>
          <option>50</option>
          <option>100</option>
        </select>
      </span>
      <div className="w-px h-4 bg-slate-200 dark:bg-gray-700" />
      <button
        onClick={() => onPage?.(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Previous page"
      >
        <ChevronLeft size={12} />
      </button>
      <span className="tabular-nums">
        {t("redesign.page", "Page")}{" "}
        <b className="text-slate-900 dark:text-gray-100">{page}</b>{" "}
        {t("redesign.of", "of")} {totalPages}
      </span>
      <button
        onClick={() => onPage?.(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Next page"
      >
        <ChevronRight size={12} />
      </button>
    </div>
  );
}
