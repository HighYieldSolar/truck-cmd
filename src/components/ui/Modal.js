"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * Mobile-safe modal shell.
 *
 * Solves the "modal cuts off top and bottom on mobile" problem from the audit:
 *  - Backdrop is `fixed inset-0` with safe-area padding (`p-3 sm:p-4`).
 *  - Card is constrained to `max-h-[calc(100dvh-1.5rem)]` so it always fits the
 *    viewport (uses `dvh` so iOS Safari url bar doesn't push it offscreen).
 *  - Body scrolls; header/footer stay pinned via flex layout.
 *  - Esc + click-outside close. Body scroll lock while open.
 *
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {string} title - shown in the header
 * @param {React.ReactNode} icon - optional icon next to title
 * @param {React.ReactNode} children - body
 * @param {React.ReactNode} footer - optional footer (action buttons)
 * @param {"sm"|"md"|"lg"|"xl"|"2xl"|"3xl"|"4xl"} size - max width on desktop
 * @param {boolean} closeOnBackdrop - default true
 * @param {string} bodyClassName - extra classes for the scrollable body
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  size = "lg",
  closeOnBackdrop = true,
  bodyClassName = "",
  hideHeader = false,
}) {
  const cardRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  };
  const maxW = sizes[size] || sizes.lg;

  const handleBackdrop = (e) => {
    if (!closeOnBackdrop) return;
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-3 sm:p-4"
    >
      <div
        ref={cardRef}
        className={`w-full ${maxW} bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden`}
      >
        {!hideHeader && (
          <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {icon && <span className="flex-shrink-0">{icon}</span>}
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex-shrink-0 p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div
          className={`flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 ${bodyClassName}`}
        >
          {children}
        </div>

        {footer && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-4 sm:px-5 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
