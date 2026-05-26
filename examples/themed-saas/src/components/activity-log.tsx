import { ACTIVITY } from "../data/stats";

export function ActivityLog() {
  return (
    <aside className="flex flex-col gap-3 rounded-xl border border-line bg-card/60 p-5 backdrop-blur-sm">
      <h2 className="m-0 font-display text-xl text-text">Activity</h2>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {ACTIVITY.map((entry, i) => (
          <li
            key={i}
            className="grid grid-cols-[42px_1fr] gap-3 border-l-2 border-foam/40 pl-3"
          >
            <span className="font-mono text-[11px] text-text-muted">
              {entry.t}
            </span>
            <div className="flex flex-col text-[12px]">
              <span className="text-text-soft">
                <strong className="font-mono text-foam">{entry.who}</strong>{" "}
                {entry.action}
              </span>
              <span className="text-text-muted">{entry.target}</span>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function DashboardFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-[11px] text-text-muted">
      <span>© 2026 Steelpath Cloud · Built on Whisk</span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-pos" /> All systems normal
      </span>
    </footer>
  );
}
