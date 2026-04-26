"use client";

/**
 * Skeleton state — 8 rows that approximate the final column layout.
 * Generic across tabs; columns prop sets widths to match the live table.
 */
export default function FleetSkeletonTable({ rows = 8, columns = [] }) {
  return (
    <div role="rowgroup" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center border-b border-gray-100 dark:border-gray-700/50 min-h-[44px] animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="w-9 flex justify-center">
            <Bar w={14} h={14} r={3} />
          </div>
          {columns.map((c, j) => (
            <div
              key={j}
              className={`px-2.5 ${c.right ? "flex justify-end" : ""}`}
              style={c.w ? { flex: `0 0 ${typeof c.w === "number" ? `${c.w}px` : c.w}` } : { flex: 1 }}
            >
              <Bar w={(80 + (i * 11 + j * 7) % 80)} h={10} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Bar({ w = 80, h = 10, r = 3 }) {
  return <div style={{ width: w, height: h, borderRadius: r }} className="bg-gray-200 dark:bg-gray-700" />;
}
