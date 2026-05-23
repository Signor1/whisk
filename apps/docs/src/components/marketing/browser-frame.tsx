import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * macOS-style browser chrome that wraps real React children. Inspired
 * by MagicUI's Safari component, but reworked so the inner screen is a
 * normal block-flow container (rather than an SVG-clipped image).
 *
 * Use it to put a real, interactive recipe UI "inside a browser" for
 * the Recipes section.
 */
export function BrowserFrame({
  url,
  children,
  className,
  bodyClassName,
}: {
  url: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl shadow-foreground/5",
        className,
      )}
    >
      {/* Chrome */}
      <div className="flex items-center gap-3 border-b border-border/70 bg-background/70 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </div>
        <div className="ml-2 hidden items-center gap-1.5 text-foreground/35 sm:flex">
          <Chev dir="left" />
          <Chev dir="right" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="inline-flex max-w-[70%] items-center gap-2 rounded-md border border-border/50 bg-background/70 px-3 py-1 font-mono text-[11px] text-foreground/55">
            <Lock />
            <span className="truncate">{url}</span>
          </div>
        </div>
        <div className="hidden text-foreground/35 sm:block">
          <Refresh />
        </div>
      </div>

      {/* Body — recipe UI renders here */}
      <div className={cn("relative", bodyClassName)}>{children}</div>
    </div>
  );
}

function Chev({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Lock() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 11V7a4 4 0 0 1 8 0v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Refresh() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 12a9 9 0 1 1-3-6.7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M21 3v6h-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
