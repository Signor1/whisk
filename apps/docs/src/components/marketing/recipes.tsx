import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Recipes section — five cards, each mirroring one of the example
 * apps in `examples/`. Hover lifts the gradient + nudges the card
 * up; uses pure CSS transforms (no client JS needed).
 *
 * Cards are server-rendered links; the actual demo apps live in
 * `examples/*` and would be deployed alongside the playground.
 */

const RECIPES = [
  {
    name: "E-commerce checkout",
    summary:
      "Pinned amount + merchant address. Widget collapses to a \"confirm and pay\" surface.",
    gradient: "from-primary/60 to-foreground/60",
    glyph: "$",
    href: "https://github.com/Signor1/whisk/tree/main/examples/ecommerce-checkout",
  },
  {
    name: "Donate button",
    summary:
      "Recipient locked, amount free. Multi-chain donor flow with a public ledger of donations.",
    gradient: "from-emerald-500/60 to-primary/60",
    glyph: "♥",
    href: "https://github.com/Signor1/whisk/tree/main/examples/donate-button",
  },
  {
    name: "Themed SaaS dashboard",
    summary:
      "Full CSS-token override. Earth-tone palette swapped for corporate navy + teal. No fork.",
    gradient: "from-sky-500/60 to-primary/40",
    glyph: "◐",
    href: "https://github.com/Signor1/whisk/tree/main/examples/themed-saas",
  },
  {
    name: "Payroll batch",
    summary:
      "Admin tool. Single widget re-renders per-payee as the operator works down a list.",
    gradient: "from-amber-500/60 to-primary/60",
    glyph: "≡",
    href: "https://github.com/Signor1/whisk/tree/main/examples/payroll-batch",
  },
  {
    name: "Invoice payment link",
    summary:
      "URL-param pre-fill. Merchant shares /pay?to=&amount=&chain=; customer clicks and pays.",
    gradient: "from-primary/60 to-rose-500/40",
    glyph: "✉",
    href: "https://github.com/Signor1/whisk/tree/main/examples/invoice-link",
  },
];

export function Recipes({ className }: { className?: string }) {
  return (
    <section
      id="examples"
      className={cn(
        "border-b border-border/60 py-20 sm:py-24",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Recipes
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Real shapes, real codebases.
          </h2>
          <p className="mt-4 text-balance text-base text-muted-foreground">
            Five fully-runnable example apps in the monorepo. Clone one,
            point it at your treasury, ship.
          </p>
        </header>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {RECIPES.map((r) => (
            <a
              key={r.name}
              href={r.href}
              target="_blank"
              rel="noreferrer"
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-90 transition-opacity group-hover:opacity-100",
                    r.gradient,
                  )}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-7xl font-bold text-white/90">
                    {r.glyph}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-card/30 to-transparent" />
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold tracking-tight">
                    {r.name}
                  </h3>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {r.summary}
                </p>
              </div>
            </a>
          ))}

          {/* Last cell — "see all" CTA filling the gap on lg */}
          <a
            href="https://github.com/Signor1/whisk/tree/main/examples"
            target="_blank"
            rel="noreferrer"
            className="group relative hidden flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center transition-all hover:border-primary/60 hover:bg-card lg:flex"
          >
            <span className="text-3xl text-muted-foreground/60">+</span>
            <span className="text-sm font-medium text-foreground">
              See every example on GitHub
            </span>
            <span className="text-xs text-muted-foreground">
              Nine apps, every chain, every pattern.
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
