import {
  ArrowDownToLine,
  Code2,
  Globe2,
  Palette,
  PuzzleIcon,
  ShieldCheck,
} from "lucide-react";
import type { ComponentType, SVGAttributes } from "react";
import {
  NetworkArbitrumOne,
  NetworkArc,
  NetworkAvalanche,
  NetworkBase,
  NetworkCodex,
  NetworkEthereum,
  NetworkHyperEvm,
  NetworkInk,
  NetworkLinea,
  NetworkMonad,
  NetworkOptimism,
  NetworkPlume,
  NetworkPolygon,
  NetworkSeiNetwork,
  NetworkSolana,
  NetworkSonic,
  NetworkUnichain,
  NetworkWorld,
} from "@web3icons/react";
import { cn } from "@/lib/utils";

/**
 * Feature bento — six cells, weighted so the wider ones carry the
 * heavier visuals. Every illustration is pure SVG / CSS. No client JS.
 */

const FEATURES = [
  {
    title: "Every chain App Kit supports",
    body:
      "17 testnets, 21 mainnets — Arc, Base, Arbitrum, Optimism, Linea, Sonic, Sei, HyperEVM, Monad, and on. One widget, one config.",
    Icon: Globe2,
    span: "md:col-span-2",
    visual: <ChainGridVisual />,
  },
  {
    title: "Type-safe end to end",
    body:
      "Every prop, every event, every chain literal narrows in your editor. We don't ship `any`.",
    Icon: ShieldCheck,
    span: "md:col-span-1",
    visual: <TypeSafeVisual />,
  },
  {
    title: "Themed to your brand",
    body:
      "Whisk reads CSS variables. Override `--whisk-primary` once and the whole widget follows. Light, dark, your own palette.",
    Icon: Palette,
    span: "md:col-span-1",
    visual: <PaletteVisual />,
  },
  {
    title: "Bridges in one signature",
    body:
      "Circle's Iris service relays the mint on the destination chain, so the user only signs on the source. No chain-switch dance.",
    Icon: ArrowDownToLine,
    span: "md:col-span-2",
    visual: <FlowVisual />,
  },
  {
    title: "Hooks if you want them",
    body:
      "Skip the styled card and call `useWhisk`, `useWhiskSwap`, `useWhiskAccount` directly. Same engine, your UI.",
    Icon: Code2,
    span: "md:col-span-1",
    visual: <HeadlessVisual />,
  },
  {
    title: "Resolvers you can stack",
    body:
      "Addresses, ENS, and ENSIP-11 ship by default. Plug in Lens, Farcaster, an email lookup — whatever you need — with `composeResolvers`.",
    Icon: PuzzleIcon,
    span: "md:col-span-2",
    visual: <ResolverPipelineVisual />,
  },
];

export function FeatureBento({ className }: { className?: string }) {
  return (
    <section className={cn("border-b border-border/60 py-20 sm:py-24", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Why Whisk
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for the integration, not the demo.
          </h2>
          <p className="mt-4 text-balance text-base text-muted-foreground">
            Every detail you'd otherwise build yourself — themed, typed,
            chain-aware — already sits behind the component.
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
                <div className="mt-6 flex-1 -mx-6 -mb-6 overflow-hidden">
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

/**
 * Wall of branded chain logos, faded at the bottom edge. Eighteen of
 * the chains Whisk routes through, each rendered with its real glyph
 * from `@web3icons/react`. Reads as "look how many — and they're all
 * the real thing" without any text labels competing with the brand
 * marks.
 */
type Web3Icon = ComponentType<
  SVGAttributes<SVGSVGElement> & {
    variant?: "branded" | "mono" | "background";
    size?: number | string;
  }
>;

const BENTO_CHAINS: Array<{ id: string; Icon: Web3Icon }> = [
  { id: "arc", Icon: NetworkArc },
  { id: "base", Icon: NetworkBase },
  { id: "arb", Icon: NetworkArbitrumOne },
  { id: "opt", Icon: NetworkOptimism },
  { id: "linea", Icon: NetworkLinea },
  { id: "sonic", Icon: NetworkSonic },
  { id: "sei", Icon: NetworkSeiNetwork },
  { id: "hyper", Icon: NetworkHyperEvm },
  { id: "monad", Icon: NetworkMonad },
  { id: "eth", Icon: NetworkEthereum },
  { id: "polygon", Icon: NetworkPolygon },
  { id: "plume", Icon: NetworkPlume },
  { id: "unichain", Icon: NetworkUnichain },
  { id: "ink", Icon: NetworkInk },
  { id: "codex", Icon: NetworkCodex },
  { id: "avax", Icon: NetworkAvalanche },
  { id: "solana", Icon: NetworkSolana },
  { id: "world", Icon: NetworkWorld },
];

function ChainGridVisual() {
  return (
    <div
      className="relative h-48 px-6 pb-6 pt-2"
      style={{
        maskImage:
          "linear-gradient(to bottom, black 65%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, black 65%, transparent 100%)",
      }}
    >
      <div className="grid grid-cols-6 gap-2">
        {BENTO_CHAINS.map(({ id, Icon }) => (
          <div
            key={id}
            className="flex h-11 items-center justify-center rounded-md border border-border bg-background/60"
          >
            <Icon variant="branded" size={22} aria-hidden="true" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * A snippet of TypeScript with the literal-union being narrowed.
 * Doesn't run shiki — just hand-rolled spans, brand-coloured.
 */
function TypeSafeVisual() {
  return (
    <div className="mt-2 px-6 pb-6">
      <pre className="overflow-hidden rounded-md border border-border bg-background/50 p-3 font-mono text-[11px] leading-relaxed text-foreground/85">
        <code className="block">
          <span className="text-muted-foreground">{"// "}widens at the source</span>
          {"\n"}
          <span className="text-primary">type</span>{" Chain ="}
          {"\n"}
          {"  "}
          <span className="text-emerald-700 dark:text-emerald-400">"Base"</span>
          {" | "}
          <span className="text-emerald-700 dark:text-emerald-400">"Arc"</span>
          {" | "}
          <span className="text-emerald-700 dark:text-emerald-400">"Optimism"</span>
          {"\n"}
          {"  "}
          <span className="text-muted-foreground">// ...</span>
          {"\n"}
          {"\n"}
          <span className="text-primary">const</span>
          {" c: "}
          <span className="text-foreground">Chain</span>
          {" = "}
          <span className="text-emerald-700 dark:text-emerald-400">"USDX"</span>
          {"\n"}
          <span className="text-rose-700/80 dark:text-rose-400/80">{"  ╳ Type '\"USDX\"' is not assignable"}</span>
        </code>
      </pre>
    </div>
  );
}

function PaletteVisual() {
  return (
    <div className="flex h-24 items-end gap-1.5 px-6 pb-6">
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

/**
 * Source → forwarder → destination, with a "one signature" caption.
 */
function FlowVisual() {
  return (
    <div className="relative flex h-36 items-center justify-between gap-2 px-6 pb-6">
      <FlowNode label="Source" tone="primary" />
      <FlowArrow />
      <FlowNode label="Forwarder" tone="muted" />
      <FlowArrow />
      <FlowNode label="Destination" tone="primary" />

      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        one signature
      </span>
    </div>
  );
}

function FlowNode({ label, tone }: { label: string; tone: "primary" | "muted" }) {
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

/**
 * Two stacked surfaces: a small component card and a hook-call slip,
 * suggesting "same engine, two front doors."
 */
function HeadlessVisual() {
  return (
    <div className="relative mt-2 h-32 px-6 pb-6">
      <div className="absolute left-6 right-6 top-0">
        <div className="rounded-md border border-border bg-background/60 px-3 py-2 shadow-sm">
          <div className="text-[10px] font-mono text-muted-foreground">
            {"<WhiskSend />"}
          </div>
          <div className="mt-1 flex items-center gap-1">
            <span className="h-1 w-12 rounded-full bg-foreground/40" />
            <span className="ml-auto h-1.5 w-8 rounded-full bg-primary" />
          </div>
        </div>
      </div>
      <div className="absolute left-12 right-2 top-12">
        <div className="rounded-md border border-primary/40 bg-primary/8 px-3 py-2 shadow-sm">
          <div className="font-mono text-[11px] text-foreground/80">
            <span className="text-primary">const</span>{" { state, actions } ="}
            <br />
            {"  "}
            <span className="text-foreground">useWhisk</span>()
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * A small "pipeline" of resolver chips: input → address → ENS → custom →
 * resolved. Conveys composability without text-heavy explanation.
 */
function ResolverPipelineVisual() {
  const stops = [
    { label: "input", tone: "muted" as const },
    { label: "address", tone: "primary" as const },
    { label: "ENS", tone: "primary" as const },
    { label: "custom", tone: "primary" as const, dashed: true },
    { label: "match", tone: "muted" as const },
  ];
  return (
    <div className="px-6 pb-6 pt-2">
      <div className="flex items-center gap-1.5">
        {stops.map((s, i) => (
          <Fragment key={s.label}>
            <span
              className={cn(
                "inline-flex h-7 items-center rounded-full border px-2.5 text-[10px] font-medium",
                s.tone === "primary"
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border bg-muted/60 text-muted-foreground",
                s.dashed && "border-dashed",
              )}
            >
              {s.label}
            </span>
            {i < stops.length - 1 ? (
              <span
                aria-hidden="true"
                className="h-px flex-1 bg-gradient-to-r from-border to-primary/40"
              />
            ) : null}
          </Fragment>
        ))}
      </div>
      <p className="mt-3 font-mono text-[10px] text-muted-foreground">
        {"composeResolvers(addressResolver, ensResolver(), lensResolver())"}
      </p>
    </div>
  );
}

import { Fragment } from "react";
