"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, ExternalLink, Trash2 } from "lucide-react";

/**
 * Compact row-action menu attached to a 3-dot button. Anchored bottom-right
 * of the trigger so it stays inside the table viewport.
 */
export default function RowMenu({ items = [], stopRowClick = true, ariaLabel = "Row actions" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (!ref.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!items.length) return null;

  return (
    <div
      className="relative"
      ref={ref}
      onClick={stopRowClick ? (e) => e.stopPropagation() : undefined}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-gray-700"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal size={14} className="text-slate-500 dark:text-gray-400" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-8 z-30 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 text-[13px]"
        >
          {items.map((it, i) => {
            const Icon = it.icon;
            const danger = it.danger;
            return (
              <button
                key={i}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  it.onClick?.();
                }}
                className={
                  "w-full text-left px-3 py-1.5 flex items-center gap-2 transition-colors " +
                  (danger
                    ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    : "text-slate-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60")
                }
              >
                {Icon && <Icon size={13} />}
                <span>{it.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { Pencil, ExternalLink, Trash2 };
