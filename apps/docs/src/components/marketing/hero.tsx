import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WidgetMockup } from "./widget-mockup";
import { cn } from "@/lib/utils";

/**
 * Above-the-fold hero. Two-column on desktop (copy + mockup), stacked
 * on mobile. The mockup is the only client component on this surface
 * — everything else is a server-rendered string of HTML for an
 * instant LCP.
 *
 * The background `BeamGrid` is a pure-CSS radial-mask grid in brand
 * tones; no canvas, no shader, no client JS.
 */
export function Hero({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-border/60",
        className,
      )}
    >
      <BeamGrid />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-2 md:py-28 lg:gap-20">
        <div className="flex flex-col items-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            v0.0.1 · built on Circle App Kit
          </span>

          <h1 className="mt-6 max-w-xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            USDC, sent and bridged with{" "}
            <span className="bg-gradient-to-br from-primary via-primary to-foreground/70 bg-clip-text text-transparent">
              one component.
            </span>
          </h1>

          <p className="mt-5 max-w-md text-balance text-base text-muted-foreground sm:text-lg">
            Drop-in React widget for same-chain sends and cross-chain
            bridges. Multi-chain, type-safe, themable. MIT licensed.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/docs"
              className="inline-flex h-11 items-center gap-1.5 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://whisk-playground.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center rounded-md border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Try the playground
            </a>
          </div>

          <p className="mt-8 max-w-md text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">17 testnets</span>{" "}
            ·{" "}
            <span className="font-medium text-foreground/80">CCTP v2</span> ·{" "}
            <span className="font-medium text-foreground/80">
              ENS resolution
            </span>{" "}
            ·{" "}
            <span className="font-medium text-foreground/80">
              same-chain swap
            </span>
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <WidgetMockup />
        </div>
      </div>
    </section>
  );
}

/**
 * Pure-CSS background — a faint grid bleeding into a soft brand-tone
 * radial. No canvas, no JS, no shader pipeline. Looks expensive,
 * costs nothing.
 */
function BeamGrid() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.35)_1px,transparent_1px)] bg-[size:48px_48px]"
        style={{
          maskImage:
            "radial-gradient(ellipse at 50% 0%, black 30%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 0%, black 30%, transparent 70%)",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_center_top,hsl(var(--primary)/0.18),transparent_60%)]" />
    </div>
  );
}
