/**
 * Placeholder landing page — Phase 1 ships the chrome (nav, theme
 * toggle, footer, brand tokens) only. The seven marketing sections
 * (hero, marquee, code-vs-mockup, bento, recipes, macbook scroll, CTA)
 * land in Phase 2.
 */
export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32">
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
        v0.0.1 · brand chrome in place
      </span>

      <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
        Send & bridge USDC across any chain,
        <br className="hidden sm:inline" />
        with one React component.
      </h1>

      <p className="mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
        Drop-in widget built on Circle App Kit. Multi-chain, type-safe,
        themable. MIT licensed.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a
          href="/docs"
          className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Read the docs
        </a>
        <a
          href="https://github.com/Signor1/whisk"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          GitHub
        </a>
      </div>

      <p className="mt-12 max-w-md text-balance text-xs text-muted-foreground">
        This page is the Phase&nbsp;1 scaffold. The full marketing
        sections (hero animation, feature bento, recipes carousel,
        live-feeling widget mockup) ship next.
      </p>
    </div>
  );
}
