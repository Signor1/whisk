const NAV_ITEMS = [
  { label: "Overview", active: true },
  { label: "Vendors" },
  { label: "Batch runs" },
  { label: "Reports" },
  { label: "Wallets" },
];

export function Sidebar() {
  return (
    <aside className="hidden flex-col gap-4 border-r border-line bg-ink-2 p-5 lg:flex">
      <Brand />

      <nav className="mt-4 flex flex-col gap-0.5 text-[13px]">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.label}
            href="#"
            className={
              "rounded-md px-3 py-2 transition-colors " +
              (item.active
                ? "bg-foam/15 font-medium text-foam"
                : "text-text-soft hover:bg-card-2/60 hover:text-text")
            }
          >
            {item.label}
          </a>
        ))}
      </nav>

      <WorkspaceFooter />
    </aside>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-foam to-cobalt font-mono text-[13px] font-bold text-ink"
      >
        ⊳
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-display text-[15px] tracking-tight">
          Steelpath
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-text-muted">
          Cloud Treasury
        </span>
      </span>
    </div>
  );
}

function WorkspaceFooter() {
  return (
    <div className="mt-auto rounded-md border border-line bg-card/60 p-3 text-[11px] text-text-muted">
      <p className="m-0 text-text-soft">Workspace</p>
      <p className="m-0 mt-1">remi@steelpath.io · Admin</p>
    </div>
  );
}
