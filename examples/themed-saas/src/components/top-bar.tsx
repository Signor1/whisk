export function TopBar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-text-muted">Treasury</span>
        <span aria-hidden className="text-text-muted">
          /
        </span>
        <span className="text-[13px] text-text">Overview</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden rounded-md border border-line-strong px-2.5 py-1 text-[11px] uppercase tracking-wider text-text-soft sm:inline-flex">
          Q2 · 2026
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-foam/30 bg-foam/10 px-2.5 py-1 text-[11px] uppercase tracking-wider text-foam">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full bg-foam"
            style={{ animation: "sp-pulse 2s ease-in-out infinite" }}
          />
          Live
        </span>
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <section className="flex flex-col gap-3">
      <h1 className="m-0 font-display text-[2.2rem] leading-[1.1] tracking-tight sm:text-[2.7rem]">
        Pay every vendor. <span className="text-foam">Settle in seconds.</span>
      </h1>
      <p className="m-0 max-w-2xl text-[15px] leading-relaxed text-text-soft">
        Steelpath holds your treasury in USDC and dispatches payouts on the
        chain that's cheapest at execution time. Pick a vendor to fund — Whisk
        handles the routing.
      </p>
    </section>
  );
}
