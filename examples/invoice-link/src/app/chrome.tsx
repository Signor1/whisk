import Link from "next/link";

export function SiteNav({ active }: { active: "customer" | "create" }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
      <Link href="/" className="inline-flex items-center gap-2.5 no-underline">
        <span
          aria-hidden
          className="flex h-8 w-8 items-center justify-center rounded-full font-display italic text-paper"
          style={{
            background:
              "linear-gradient(135deg, #e85a3d 0%, #b8421e 60%, #7a8a6a 100%)",
            fontSize: "15px",
          }}
        >
          ✿
        </span>
        <span className="flex flex-col leading-none">
          <span className="font-display text-[15px] tracking-tight text-ink">
            Studio Hibiscus
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">
            Invoice links · powered by Whisk
          </span>
        </span>
      </Link>
      <nav className="inline-flex items-center gap-1.5 text-[12px]">
        <Link
          href="/"
          className={
            "rounded-full px-3 py-1.5 transition-colors no-underline " +
            (active === "customer"
              ? "bg-ink text-paper"
              : "text-ink-soft hover:bg-cream-2/60 hover:text-ink")
          }
        >
          Customer view
        </Link>
        <Link
          href="/create"
          className={
            "rounded-full px-3 py-1.5 transition-colors no-underline " +
            (active === "create"
              ? "bg-ink text-paper"
              : "text-ink-soft hover:bg-cream-2/60 hover:text-ink")
          }
        >
          Compose a link →
        </Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-[12px] text-ink-muted">
      <span>© Studio Hibiscus · A demo invoice flow on Whisk</span>
      <code className="rounded-md bg-cream-2/40 px-2 py-1 font-mono text-[11px] text-coral-deep">
        ?to=0x…&amount=…&chain=…&memo=…
      </code>
    </footer>
  );
}
