import type { CSSProperties, ReactNode } from "react";

/**
 * Reusable host-site fragments shared across every recipe shell.
 * Nothing is interactive — these render purely as decoration so the
 * recipe canvases read as real product pages, with the Whisk mock
 * sitting natively inside them.
 */

/* -------------------------------------------------------------------------- */
/*  Nav bar                                                                    */
/* -------------------------------------------------------------------------- */

export function SiteNav({
  brand,
  links = [],
  trailing,
  tokens,
}: {
  brand: ReactNode;
  links?: ReadonlyArray<string>;
  trailing?: ReactNode;
  tokens?: { fg?: string; fgMuted?: string; border?: string };
}) {
  return (
    <div
      className="flex items-center justify-between border-b px-5 py-3"
      style={{
        borderColor: tokens?.border ?? "rgb(0 0 0 / 0.08)",
        color: tokens?.fg,
      }}
    >
      <div className="flex items-center gap-2 font-display text-[13px] font-semibold">
        {brand}
      </div>
      <nav
        className="hidden items-center gap-5 text-[12px] sm:flex"
        style={{ color: tokens?.fgMuted }}
      >
        {links.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </nav>
      {trailing && <div className="flex items-center gap-3">{trailing}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Breadcrumb                                                                 */
/* -------------------------------------------------------------------------- */

export function Breadcrumb({
  items,
  color,
}: {
  items: ReadonlyArray<{ label: string; current?: boolean }>;
  color?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1.5 font-display text-[11px]"
      style={{ color: color ?? "currentColor" }}
    >
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden>›</span>}
          <span
            className={item.current ? "font-semibold" : ""}
            style={{ opacity: item.current ? 1 : 0.7 }}
          >
            {item.label}
          </span>
        </span>
      ))}
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*  Status pill                                                                */
/* -------------------------------------------------------------------------- */

export function StatusPill({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: "neutral" | "good" | "warn" | "danger" | "primary";
  className?: string;
}) {
  const palette: Record<typeof tone, { bg: string; fg: string }> = {
    neutral: { bg: "rgb(0 0 0 / 0.06)", fg: "currentColor" },
    good: { bg: "rgb(52 211 153 / 0.15)", fg: "rgb(20 130 90)" },
    warn: { bg: "rgb(251 191 36 / 0.18)", fg: "rgb(146 86 4)" },
    danger: { bg: "rgb(251 113 133 / 0.18)", fg: "rgb(150 30 50)" },
    primary: { bg: "rgb(99 102 241 / 0.14)", fg: "rgb(60 65 180)" },
  };
  const { bg, fg } = palette[tone];
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-display text-[10.5px] font-medium uppercase tracking-wider " +
        (className ?? "")
      }
      style={{ backgroundColor: bg, color: fg }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: fg, opacity: 0.7 }}
      />
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Progress bar                                                               */
/* -------------------------------------------------------------------------- */

export function ProgressBar({
  value,
  max,
  trackColor,
  fillColor,
}: {
  value: number;
  max: number;
  trackColor?: string;
  fillColor?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const style: CSSProperties = {
    backgroundColor: trackColor ?? "rgb(0 0 0 / 0.08)",
  };
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full" style={style}>
      <div
        className="h-full rounded-full transition-[width]"
        style={{
          width: `${pct}%`,
          backgroundColor: fillColor ?? "currentColor",
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Mark — small geometric brand logo for fake host sites                      */
/* -------------------------------------------------------------------------- */

export function Mark({
  shape = "square",
  color,
}: {
  shape?: "square" | "circle" | "diamond";
  color: string;
}) {
  const base = "inline-block h-4 w-4";
  if (shape === "circle")
    return (
      <span
        className={base + " rounded-full"}
        style={{ backgroundColor: color }}
      />
    );
  if (shape === "diamond")
    return (
      <span
        className={base}
        style={{
          backgroundColor: color,
          transform: "rotate(45deg)",
          borderRadius: 2,
        }}
      />
    );
  return (
    <span className={base + " rounded-sm"} style={{ backgroundColor: color }} />
  );
}
