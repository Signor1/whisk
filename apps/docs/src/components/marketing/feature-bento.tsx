import {
  ArrowDownToLine,
  Code2,
  Globe2,
  Palette,
  PuzzleIcon,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Feature bento — 6 cells, weighted layout (two cells span wider than
 * the rest for visual hierarchy). Pure CSS / SVG visuals; no client
 * JS. Each cell tells one capability story with a one-line headline
 * + supporting copy.
 */

const FEATURES = [
  {
    title: "17 testnets, 21 mainnets",
    body: "Every chain App Kit ships with — Arc, Base, Arbitrum, Optimism, Linea, Sonic, Sei, HyperEVM, Monad, more. Same widget, every chain.",
    Icon: Globe2,
    span: "md:col-span-2",
    visual: <GlobeVisual />,
  },
  {
    title: "Type-safe, top to bottom",
    body: "100% TypeScript. Every prop, every event, every chain literal narrowed end-to-end. No `any` escape hatches.",
    Icon: ShieldCheck,
    span: "md:col-span-1",
  },
  {
    title: "Themable to your palette",
    body: "Every visible property routes through a CSS variable. Override `--whisk-primary` and the whole widget follows. Light + dark.",
    Icon: Palette,
    span: "md:col-span-1",
    visual: <PaletteVisual />,
  },
  {
    title: "One-signature bridges",
    body: "Forwarder Service is on by default — user signs once on source, Circle's Iris service relays the mint. No chain switch.",
    Icon: ArrowDownToLine,
    span: "md:col-span-2",
    visual: <FlowVisual />,
  },
  {
    title: "Headless if you need it",
    body: "Drop in the styled component or import the hooks (`useWhisk`, `useWhiskSwap`, `useWhiskAccount`) and build your own UI.",
    Icon: Code2,
    span: "md:col-span-1",
  },
  {
    title: "Pluggable resolvers",
    body: "ENS + ENSIP-11 out of the box. Compose your own — Lens, Farcaster, Unstoppable, even custom email lookups — via `composeResolvers`.",
    Icon: PuzzleIcon,
    span: "md:col-span-2",
  },
];

export function FeatureBento({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "border-b border-border/60 py-20 sm:py-24",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Why Whisk
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Production primitives, not a starter kit.
          </h2>
          <p className="mt-4 text-balance text-base text-muted-foreground">
            Designed to ship into a live app on day one — typed, themed,
            and battery-included.
          </p>
        </header>

        <div className="mt-12 grid auto-rows-fr gap-4 md:grid-cols-3 md:gap-5">
          {FEATURES.map((feat) => (
            <article
              key={feat.title}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg hover:shadow-primary/5",
                feat.span,
              )}
            >
              <feat.Icon
                className="h-5 w-5 text-primary"
                strokeWidth={2}
                aria-hidden="true"
              />
              <h3 className="mt-4 text-lg font-semibold tracking-tight">
                {feat.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feat.body}
              </p>

              {feat.visual ? (
                <div className="mt-6 flex-1 -mb-6 -mx-6 overflow-hidden">
                  {feat.visual}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Cell visuals — pure SVG / CSS                                              */
/* -------------------------------------------------------------------------- */

function GlobeVisual() {
  return (
    <div className="relative h-44 w-full">
      <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-border/60" />
      <div className="absolute left-1/2 top-1/2 h-32 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/40" />
      <div className="absolute left-1/2 top-1/2 h-44 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/40" />
      <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-lg shadow-primary/40" />
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <span
          key={deg}
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-foreground/80"
          style={{
            transform: `rotate(${deg}deg) translateY(-${64 + (i % 2) * 18}px)`,
          }}
        />
      ))}
    </div>
  );
}

function PaletteVisual() {
  return (
    <div className="flex h-24 items-end gap-1.5 px-2">
      {[40, 60, 80, 70, 90, 55].map((h, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="flex-1 rounded-t-sm"
          style={{
            height: `${h}%`,
            background: `hsl(var(--primary) / ${0.25 + i * 0.12})`,
          }}
        />
      ))}
    </div>
  );
}

function FlowVisual() {
  return (
    <div className="relative flex h-36 items-center justify-between gap-2 px-4">
      <FlowNode label="Source" tone="primary" />
      <FlowArrow />
      <FlowNode label="Forwarder" tone="muted" />
      <FlowArrow />
      <FlowNode label="Destination" tone="primary" />

      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        one signature
      </span>
    </div>
  );
}

function FlowNode({
  label,
  tone,
}: {
  label: string;
  tone: "primary" | "muted";
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-semibold",
          tone === "primary"
            ? "border border-primary/40 bg-primary/15 text-primary"
            : "border border-border bg-muted/60 text-muted-foreground",
        )}
      >
        {label[0]}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function FlowArrow() {
  return (
    <span
      aria-hidden="true"
      className="h-px flex-1 bg-gradient-to-r from-border via-primary/60 to-border"
    />
  );
}
