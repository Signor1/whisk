import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Blueprint-style section wrapper modelled on refine.dev's "tapestry":
 *
 * - **Top + bottom dividers run edge-to-edge** (full browser width), so the
 *   horizontal rhythm is visible no matter how wide the viewport gets.
 * - **Vertical guides sit at the content-column edges** (max-w-7xl), so
 *   the inner content has a clear frame around it.
 * - **+ crosshair ticks** sit at the four intersections.
 * - **Generous inner padding** keeps text, cards, and mockups well away
 *   from the vertical guides.
 *
 * Line color uses --foreground at low alpha rather than --border (which
 * has rose hue and blends into the cream backdrop). That keeps the
 * frame readable in both light and dark mode.
 */
export function FramedSection({
  children,
  className,
  innerClassName,
  noTop,
  noBottom,
  id,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  /** First section omits the top divider so it flows into the page top. */
  noTop?: boolean;
  /** Last section omits the bottom divider so it flows into the footer. */
  noBottom?: boolean;
  id?: string;
  ariaLabel?: string;
}) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn("relative isolate", className)}
    >
      {/* Full-bleed top + bottom horizontals. They live outside the
          content column so they touch the browser edges. Color matches
          the nav border (border-border/60) for site-wide uniformity. */}
      {!noTop && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-border/60"
        />
      )}
      {!noBottom && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border/60"
        />
      )}

      {/* Vertical guides + corner crosshairs — pinned to the content
          column edges. Hidden on mobile (below `sm`): on a phone the
          verticals sit too close to the content and read as cramped
          rails rather than a frame. The full-bleed horizontals above
          carry the rhythm by themselves. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 z-0 w-full -translate-x-1/2"
      >
        <div className="relative mx-auto h-full max-w-[90rem]">
          <div className="absolute inset-y-0 left-0 w-px bg-border/60" />
          <div className="absolute inset-y-0 right-0 w-px bg-border/60" />

          {!noTop && (
            <>
              <Tick className="absolute -left-1.5 -top-1.5" />
              <Tick className="absolute -right-1.5 -top-1.5" />
            </>
          )}
          {!noBottom && (
            <>
              <Tick className="absolute -bottom-1.5 -left-1.5" />
              <Tick className="absolute -bottom-1.5 -right-1.5" />
            </>
          )}
        </div>
      </div>

      <div
        className={cn(
          // Wider content column + generous responsive inner padding so
          // text, cards, and mockups never feel cramped against the
          // vertical guides. The padding lives on the same element as
          // the max-width so the inner content area shrinks from the
          // 90rem total by the padding amount.
          // Scale: 24px → 56px → 96px → 128px (mobile → sm → lg → xl).
          "relative z-10 mx-auto w-full max-w-[90rem] px-6",
          innerClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}

function Tick({ className }: { className: string }) {
  return (
    <span aria-hidden className={cn(className, "text-border")}>
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M6 0V12M0 6H12" stroke="currentColor" strokeWidth="1" />
      </svg>
    </span>
  );
}
