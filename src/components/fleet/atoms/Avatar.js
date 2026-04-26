"use client";

const TONES = {
  slate: "bg-slate-200 text-slate-700",
  emerald: "bg-emerald-100 text-emerald-700",
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
};

const TONE_KEYS = ["slate", "emerald", "blue", "amber"];

function autoTone(name = "") {
  const c = name.charCodeAt(0) || 0;
  return TONE_KEYS[c % TONE_KEYS.length];
}

/**
 * Initials avatar. Used for drivers; vehicles use a slate truck icon tile instead.
 */
export default function Avatar({ name = "", size = 24, tone = "auto", src }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const t = TONES[tone === "auto" ? autoTone(name) : tone] || TONES.slate;
  const px = `${size}px`;
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className="rounded-full object-cover shrink-0"
        style={{ width: px, height: px }}
      />
    );
  }
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full shrink-0 font-semibold tracking-tight ${t}`}
      style={{ width: px, height: px, fontSize: Math.round(size * 0.42) }}
    >
      {initials || "?"}
    </div>
  );
}
