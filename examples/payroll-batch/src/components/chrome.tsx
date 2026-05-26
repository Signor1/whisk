export function SiteNav() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
      <div className="inline-flex items-center gap-2.5">
        <span
          aria-hidden
          className="flex h-8 w-8 items-center justify-center rounded-full font-display italic text-ivory"
          style={{
            background:
              "linear-gradient(135deg, #5a1933 0%, #8a2a4a 60%, #c97a8a 100%)",
            fontSize: "13px",
          }}
        >
          ƒ
        </span>
        <span className="flex flex-col leading-none">
          <span className="font-display text-[16px] tracking-tight text-claret">
            Studio Fortune
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">
            Payroll · May 2026
          </span>
        </span>
      </div>
      <div className="inline-flex items-center gap-2 text-[12px] text-ink-soft">
        <span className="rounded-full bg-blush/40 px-2.5 py-1 text-claret">
          Treasury · $48,210 USDC
        </span>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-[12px] text-ink-muted">
      <span>© Studio Fortune · Payroll powered by Whisk</span>
      <span className="font-display italic">Made with attention.</span>
    </footer>
  );
}
