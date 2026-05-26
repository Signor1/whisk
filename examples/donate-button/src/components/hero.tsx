import { ANNUAL_GOAL, RAISED } from "../data/tiers";

export function Hero() {
  const progressPct = (RAISED / ANNUAL_GOAL) * 100;

  return (
    <section
      id="mission"
      className="grid items-center gap-8 lg:grid-cols-[1.3fr_1fr]"
    >
      <div className="flex flex-col gap-4">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-fern/30 bg-mist px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-moss">
          <span
            aria-hidden
            className="block h-1.5 w-1.5 rounded-full bg-fern"
          />
          250,000 trees by 2027
        </span>
        <h1 className="m-0 font-display text-[2.6rem] leading-[1.04] tracking-tight text-canopy sm:text-[3.4rem] md:text-[3.8rem]">
          Restore a forest.{" "}
          <span className="italic text-moss">One tree per donor.</span>
        </h1>
        <p className="max-w-xl text-[17px] leading-relaxed text-ink-soft">
          We partner with local communities in 7 countries to replant native
          forest at scale. Donate from your Phantom wallet or any EVM chain — we
          receive USDC from any chain. Every donation is tagged, photographed,
          and added to our public ledger within 48 hours.
        </p>

        <GoalProgress progressPct={progressPct} />
      </div>

      <HeroArt />
    </section>
  );
}

function GoalProgress({ progressPct }: { progressPct: number }) {
  return (
    <div className="mt-3 max-w-xl">
      <div className="mb-1.5 flex items-baseline justify-between text-[12px] text-ink-muted">
        <span>
          <strong className="text-canopy">${RAISED.toLocaleString()}</strong>{" "}
          raised this year
        </span>
        <span>Goal · ${ANNUAL_GOAL.toLocaleString()}</span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full"
          style={{
            width: `${progressPct}%`,
            background:
              "linear-gradient(90deg, #2d5a3d 0%, #4a8a5a 50%, #7bb88a 100%)",
          }}
        />
      </div>
      <p className="m-0 mt-1.5 text-[11px] text-ink-muted">
        {Math.round(progressPct)}% funded · 5 months until our Q4 audit
      </p>
    </div>
  );
}

function HeroArt() {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-canopy-2 shadow-[0_30px_60px_-30px_rgba(15,42,29,0.4)]">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #1a3b2a 0%, #2d5a3d 45%, #4a8a5a 100%)",
        }}
      />
      {Array.from({ length: 20 }).map((_, i) => (
        <Tree key={i} index={i} />
      ))}
      <span
        aria-hidden
        className="absolute right-6 top-6 h-14 w-14 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, #f8e9b8 0%, #e8b94c 60%, transparent 75%)",
          boxShadow: "0 0 60px rgba(232, 185, 76, 0.4)",
        }}
      />
    </div>
  );
}

function Tree({ index }: { index: number }) {
  const stops =
    index % 3 === 0
      ? ["#7bb88a", "#4a8a5a"]
      : index % 3 === 1
        ? ["#4a8a5a", "#1a3b2a"]
        : ["#2d5a3d", "#1a3b2a"];
  return (
    <span
      aria-hidden
      className="absolute bottom-0 origin-bottom"
      style={{
        left: `${(index * 5.2) % 100}%`,
        width: "3.5%",
        height: `${30 + ((index * 7) % 50)}%`,
        background: `linear-gradient(180deg, ${stops[0]} 0%, ${stops[1]} 100%)`,
        clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
        animation: `of-grow ${600 + index * 30}ms ease-out`,
      }}
    />
  );
}
