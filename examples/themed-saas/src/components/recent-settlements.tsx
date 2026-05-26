import { RECENT } from "../data/stats";

export function RecentSettlements() {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-line bg-card/60 p-5 backdrop-blur-sm">
      <header className="flex items-center justify-between">
        <h2 className="m-0 font-display text-xl text-text">
          Recent settlements
        </h2>
        <span className="rounded-full border border-line-strong px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-text-muted">
          Last 7 days
        </span>
      </header>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {RECENT.map((row) => (
          <li
            key={row.name + row.when}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-md px-2 py-2.5 hover:bg-card-2/60"
          >
            <div className="flex items-center gap-2.5 text-[14px]">
              <span
                aria-hidden
                className="block h-1.5 w-1.5 rounded-full bg-pos"
                style={{ animation: "sp-pulse 2.4s ease-in-out infinite" }}
              />
              <span className="text-text">{row.name}</span>
            </div>
            <span className="text-[12px] tabular-nums text-text-soft">
              {row.amount} USDC · {row.chain}
            </span>
            <span className="text-[11px] text-text-muted">{row.when}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
