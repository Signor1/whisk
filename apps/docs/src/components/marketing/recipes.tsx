import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Recipes section — five cards mirroring the example apps in
 * `examples/`. Pure CSS hover transforms, no client JS.
 */

const RECIPES = [
  {
    name: "E-commerce checkout",
    summary:
      "Pin the cart total and merchant address. The widget collapses to a confirm-and-pay surface so the buyer can't fat-finger it.",
    gradient: "from-primary/60 to-foreground/60",
    glyph: "$",
    href: "https://github.com/Signor1/whisk/tree/main/examples/ecommerce-checkout",
  },
  {
    name: "Donate button",
    summary:
      "Lock the treasury address, let donors pick their amount. Surface recent donations to nudge social proof.",
    gradient: "from-emerald-500/60 to-primary/60",
    glyph: "♥",
    href: "https://github.com/Signor1/whisk/tree/main/examples/donate-button",
  },
  {
    name: "Themed SaaS dashboard",
    summary:
      "One CSS rule swaps the earth-tone palette for corporate navy and teal. No fork, no override file, no Tailwind plugin.",
    gradient: "from-sky-500/60 to-primary/40",
    glyph: "◐",
    href: "https://github.com/Signor1/whisk/tree/main/examples/themed-saas",
  },
  {
    name: "Payroll batch",
    summary:
      "An admin tool that walks a list of payees. The widget remounts per row, so each payment runs clean against the next vendor.",
    gradient: "from-amber-500/60 to-primary/60",
    glyph: "≡",
    href: "https://github.com/Signor1/whisk/tree/main/examples/payroll-batch",
  },
  {
    name: "Invoice payment link",
    summary:
      "A shareable URL that opens a pre-filled checkout. The merchant sends it; the customer clicks, signs once, and the invoice clears.",
    gradient: "from-primary/60 to-rose-500/40",
    glyph: "✉",
    href: "https://github.com/Signor1/whisk/tree/main/examples/invoice-link",
  },
];

export function Recipes({ className }: { className?: string }) {
  return (
    <section
      id="examples"
      className={cn("border-b border-border/60 py-20 sm:py-24", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Recipes
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Five shapes you can ship today.
          </h2>
          <p className="mt-4 text-balance text-base text-muted-foreground">
            Each example is a runnable Next.js app in the monorepo. Clone
            one, swap the addresses, and you have a working payment flow
            by lunch.
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

          <a
            href="https://github.com/Signor1/whisk/tree/main/examples"
            target="_blank"
            rel="noreferrer"
            className="group relative hidden flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center transition-all hover:border-primary/60 hover:bg-card lg:flex"
          >
            <span className="text-3xl text-muted-foreground/60">+</span>
            <span className="text-sm font-medium text-foreground">
              Browse every example
            </span>
            <span className="text-xs text-muted-foreground">
              On GitHub. Patterns, integrations, full apps.
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
