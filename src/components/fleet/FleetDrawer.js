"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  X,
  Pencil,
} from "lucide-react";

/**
 * Generic drawer shell — slides in from the right at 480px, edit-led header
 * with breadcrumb back + prev/next stepper + Edit CTA + tabs underneath.
 *
 * Keyboard: ←/→ steps prev/next within `peers` (the visible filtered list);
 * Esc closes. Focus trapped.
 *
 * @param {object} props
 * @param {string} props.kind            "drivers"|"vehicles"|"maintenance"
 * @param {string} props.title
 * @param {React.ReactNode} props.subtitle
 * @param {React.ReactNode} props.headerExtra   chips/badges below the title
 * @param {string[]} props.tabs          tab labels
 * @param {(tab) => React.ReactNode} props.children   body renderer per tab
 * @param {string[]} props.peers         IDs in current filtered list (for prev/next)
 * @param {string} props.currentId
 * @param {(id: string) => void} props.onNav
 * @param {() => void} props.onClose
 * @param {() => void} [props.onEdit]
 * @param {React.ReactNode} [props.avatar]  rendered top-left
 */
export default function FleetDrawer({
  kind,
  title,
  subtitle,
  headerExtra,
  tabs = ["Overview"],
  children,
  peers = [],
  currentId,
  onNav,
  onClose,
  onEdit,
  avatar,
  footer,
}) {
  const [tab, setTab] = useState(tabs[0]);
  const ref = useRef(null);

  const idx = peers.indexOf(currentId);
  const total = peers.length;
  const prevId = idx > 0 ? peers[idx - 1] : null;
  const nextId = idx >= 0 && idx < total - 1 ? peers[idx + 1] : null;

  useEffect(() => {
    setTab(tabs[0]);
  }, [currentId]); // reset to first tab when row changes

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
      if (e.key === "ArrowLeft" && prevId) {
        e.preventDefault();
        onNav?.(prevId);
      }
      if (e.key === "ArrowRight" && nextId) {
        e.preventDefault();
        onNav?.(nextId);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, onNav, prevId, nextId]);

  // Click-outside-to-close. Deferred one tick so the same click that opened
  // the drawer (e.g. on a row) doesn't immediately close it. Clicking a
  // different row will fall through to the row's onClick and the URL state
  // swap will reopen the drawer with the new id.
  useEffect(() => {
    let timer;
    function onDoc(e) {
      const aside = ref.current;
      if (!aside) return;
      if (aside.contains(e.target)) return;
      // Ignore clicks that landed on portaled menus / modals that float above
      // the page (e.g. the FleetHeader Add menu, RowMenu items). We detect
      // them by walking up to see if the click target sits inside an element
      // marked role="menu" or role="dialog".
      if (e.target.closest?.('[role="menu"], [role="dialog"]')) return;
      onClose?.();
    }
    timer = setTimeout(() => {
      document.addEventListener("mousedown", onDoc);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [onClose]);

  const kindLabel = { drivers: "Drivers", vehicles: "Vehicles", maintenance: "Maintenance" }[kind] || "Back";

  return (
    <>
      {/* Light scrim on mobile only — desktop is a floating card so the page
          behind stays visible and interactive. */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] z-30 lg:hidden"
      />
      {/* Floating card: clears the global topbar (~64px) and hugs the right
          edge with breathing room so it reads as a panel over content rather
          than a full-height side rail. */}
      <aside
        ref={ref}
        role="complementary"
        aria-label={`${title} drawer`}
        className="fixed inset-x-2 top-20 bottom-3 sm:inset-x-auto sm:right-3 sm:left-auto sm:top-20 sm:bottom-4 sm:w-[420px] lg:w-[460px] z-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col overflow-hidden shadow-2xl shadow-slate-900/15 dark:shadow-black/60 ring-1 ring-black/5 dark:ring-white/5"
      >
      {/* Sub-header bar: breadcrumb back, position counter, prev/next */}
      <div className="flex items-center gap-1 px-4 py-2 bg-gray-50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1 h-6 px-1.5 rounded text-[12px] font-medium text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-100 hover:bg-slate-100 dark:hover:bg-gray-700"
        >
          <ChevronLeft size={14} />
          {kindLabel}
        </button>
        <div className="flex-1" />
        {total > 0 && (
          <span className="text-[11.5px] text-slate-500 dark:text-gray-400 tabular-nums">
            {idx + 1} of {total}
          </span>
        )}
        <button
          onClick={() => prevId && onNav?.(prevId)}
          disabled={!prevId}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-transparent"
          aria-label="Previous"
        >
          <ChevronUp size={13} className="text-slate-500 dark:text-gray-400" />
        </button>
        <button
          onClick={() => nextId && onNav?.(nextId)}
          disabled={!nextId}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-transparent"
          aria-label="Next"
        >
          <ChevronDown size={13} className="text-slate-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Identity row */}
      <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start gap-3">
          {avatar}
          <div className="flex-1 min-w-0">
            <div className="text-[17px] font-semibold tracking-tight leading-tight truncate">{title}</div>
            <div className="text-[12px] text-slate-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
              {subtitle}
            </div>
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-[12.5px] font-medium"
            >
              <Pencil size={12} strokeWidth={2.25} />
              Edit
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <X size={14} className="text-slate-500 dark:text-gray-400" />
          </button>
        </div>
        {headerExtra && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">{headerExtra}</div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-end gap-3.5 px-4 border-b border-gray-100 dark:border-gray-700 text-[12.5px]">
        {tabs.map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px py-2 border-b-2 transition ${
                active
                  ? "text-gray-900 dark:text-gray-100 font-semibold border-blue-600 dark:border-blue-400"
                  : "text-gray-500 dark:text-gray-400 font-medium border-transparent hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {children?.(tab) || null}
      </div>

      {/* Footer */}
      {footer && (
        <div className="border-t border-slate-100 dark:border-gray-700 px-4 py-2.5 bg-slate-50 dark:bg-gray-900/40">{footer}</div>
      )}
      </aside>
    </>
  );
}

/**
 * Section heading with thin divider, used inside drawer bodies.
 */
export function DrawerSection({ title, badge, children }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {title}
        </div>
        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
        {badge}
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

export function KV({ label, value, mono }) {
  return (
    <div className="flex items-start gap-2 text-[12.5px]">
      <div className="w-[110px] shrink-0 text-slate-500 dark:text-gray-400">{label}</div>
      <div
        className={`flex-1 min-w-0 text-slate-800 dark:text-gray-200 ${
          mono ? "font-mono tabular-nums" : ""
        } break-words`}
      >
        {value ?? <span className="text-slate-400 dark:text-gray-500">—</span>}
      </div>
    </div>
  );
}

/**
 * "Open external" link button used as escape hatch from drawer to full page
 * (e.g. dispatch board) when relevant.
 */
export function DrawerExternalLink({ children, href }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 text-[12px] text-blue-700 dark:text-blue-400 font-medium hover:underline"
    >
      {children}
      <ExternalLink size={11} />
    </a>
  );
}
