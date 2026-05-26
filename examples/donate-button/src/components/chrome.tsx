export function SiteNav() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-line pb-3">
      <div className="inline-flex items-center gap-2.5">
        <span
          aria-hidden
          className="h-6 w-6 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 25%, #e8b94c 0%, #7bb88a 35%, #1a3b2a 85%)",
          }}
        />
        <span className="flex flex-col leading-none">
          <span className="font-display text-[15px] tracking-tight text-canopy">
            OpenForest
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">
            501(c)(3) · est 2024
          </span>
        </span>
      </div>
      <nav className="hidden gap-6 text-[13px] text-ink-soft sm:inline-flex">
        <a href="#mission" className="hover:text-canopy">
          Mission
        </a>
        <a href="#donate" className="hover:text-canopy">
          Donate
        </a>
        <a href="#donors" className="hover:text-canopy">
          Donors
        </a>
        <a href="#projects" className="hover:text-canopy">
          Projects
        </a>
      </nav>
      <a
        href="#donate"
        className="rounded-full border border-canopy bg-canopy px-3.5 py-1.5 text-[12px] font-medium text-paper hover:bg-canopy-2"
      >
        Plant a tree →
      </a>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-[12px] text-ink-muted">
      <span>© 2026 OpenForest Foundation · Public ledger · Q4 audit</span>
      <span className="inline-flex items-center gap-1.5">
        Built with <strong className="text-canopy">Whisk</strong> on Circle App
        Kit
      </span>
    </footer>
  );
}
