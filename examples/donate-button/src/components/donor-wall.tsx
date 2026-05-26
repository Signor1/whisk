import { RECENT_DONORS } from "../data/donors";

export function DonorWall() {
  return (
    <aside
      className="flex flex-col gap-4 self-start rounded-2xl border border-line bg-cream/50 p-6 sm:p-7 lg:sticky lg:top-5"
      id="donors"
    >
      <header className="flex items-center justify-between gap-2">
        <h2 className="m-0 font-display text-xl text-canopy">
          Public donor wall
        </h2>
        <span className="rounded-full border border-leaf/40 bg-mist px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-moss">
          Live · on-chain
        </span>
      </header>
      <p className="m-0 -mt-2 text-[13px] text-ink-muted">
        Every donation is verifiable. Anonymous? Just don't connect a wallet
        with a public ENS.
      </p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {RECENT_DONORS.map((donor, i) => (
          <li
            key={i}
            className="grid grid-cols-[24px_1fr_auto] items-center gap-3 rounded-lg bg-paper px-3 py-2.5"
          >
            <span
              aria-hidden
              className="block h-6 w-6 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, #7bb88a 0%, #2d5a3d 100%)",
              }}
            />
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-canopy">
                {donor.who}
              </span>
              <span className="text-[11px] text-ink-muted">
                {donor.trees} {donor.trees === 1 ? "tree" : "trees"} ·{" "}
                {donor.chain} · {donor.when}
              </span>
            </div>
            <span className="font-display text-[15px] tabular-nums text-canopy">
              ${donor.amount}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
