export function SiteNav({ cartCount }: { cartCount: number }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-line py-3">
      <div className="inline-flex items-center gap-2.5">
        <span
          aria-hidden
          className="h-[22px] w-[22px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, #f7e8c8 0%, #c98c66 55%, #6a3a1d 100%)",
            boxShadow:
              "inset 0 0 0 2px rgba(0,0,0,0.04), inset -2px -3px 6px rgba(255,240,220,0.6)",
          }}
        />
        <span className="flex flex-col leading-none">
          <span className="font-display text-[0.9rem] tracking-tight">
            Atelier Hibiscus
          </span>
          <span className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-charcoal-muted">
            EST · 2026
          </span>
        </span>
      </div>
      <nav className="hidden gap-6 text-[13px] text-charcoal-soft sm:inline-flex">
        <span>Shop</span>
        <span>Journal</span>
        <span>Stockists</span>
        <span>Account</span>
      </nav>
      <div className="inline-flex items-center gap-3 text-[13px]">
        <span className="text-charcoal-soft">⌕</span>
        <span className="rounded-full border border-line bg-paper px-3 py-1 tracking-wide">
          Cart · <strong className="text-tobacco-deep">{cartCount}</strong>
        </span>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4 text-xs text-charcoal-muted">
      <div className="inline-flex items-center gap-2.5">
        <span
          aria-hidden
          className="block h-3 w-3 rounded-full bg-tobacco/70"
        />
        <span>© Atelier Hibiscus · Built with Whisk</span>
      </div>
      <div className="inline-flex gap-5">
        <span>Shipping</span>
        <span>Returns</span>
        <span>Contact</span>
      </div>
    </footer>
  );
}
