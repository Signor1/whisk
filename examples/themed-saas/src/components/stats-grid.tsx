import { STATS } from "../data/stats";

export function StatsGrid() {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {STATS.map((s) => (
        <article
          key={s.label}
          className="flex flex-col gap-2 rounded-xl border border-line bg-card/60 p-4 backdrop-blur-sm"
        >
          <span className="text-[11px] uppercase tracking-[0.14em] text-text-muted">
            {s.label}
          </span>
          <span className="font-display text-[1.8rem] leading-none tracking-tight">
            {s.value}
          </span>
          <span
            className={"text-[12px] " + (s.up ? "text-pos" : "text-text-muted")}
          >
            {s.delta}
          </span>
        </article>
      ))}
    </section>
  );
}
