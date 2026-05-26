import { STATS } from "../data/donors";

export function StatsRow() {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {STATS.map((stat) => (
        <article
          key={stat.label}
          className="rounded-xl border border-line bg-paper p-4 sm:p-5"
        >
          <p className="m-0 font-display text-[1.6rem] tracking-tight text-canopy sm:text-[2rem]">
            {stat.value}
          </p>
          <p className="m-0 text-[12px] uppercase tracking-[0.14em] text-ink-muted">
            {stat.label}
          </p>
        </article>
      ))}
    </section>
  );
}
