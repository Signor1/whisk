import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WidgetMockup } from "./widget-mockup";
import { ChainConstellation } from "./chain-constellation";
import { cn } from "@/lib/utils";

/**
 * Above-the-fold hero. Two-column on desktop (copy + mockup), stacked
 * on mobile. WidgetMockup is the only client component on this
 * surface; ChainConstellation is pure SVG with SMIL animations, so
 * the section still hydrates fast.
 */
export function Hero({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-border/60",
        className,
      )}
    >
      <ChainConstellation />

      <div className="mx-auto grid min-h-[36rem] max-w-7xl items-center gap-12 px-4 py-24 sm:px-6 sm:py-32 md:min-h-[44rem] lg:grid-cols-2 md:py-40 lg:gap-20">
        <div className="flex flex-col items-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/70" />
              <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live on testnets
            <span className="text-foreground/30">·</span>
            <span className="text-foreground/80">Mainnet soon</span>
          </span>

          <h1 className="mt-4 md:mt-6 max-w-3xl text-balance text-4xl font-extrabold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            One widget.{" "}
            <span className="bg-gradient-to-br from-primary via-primary to-foreground/70 bg-clip-text text-transparent">
              Every USDC payment shape.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
            Drop <code>{`<WhiskSend />`}</code> into your app and your users can
            send or bridge USDC across any chain App Kit supports. Wallet
            connect, ENS lookup, and CCTP bridging stay inside the widget so you
            stay out of the plumbing.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/docs/getting-started/install"
              className="inline-flex h-11 items-center gap-1.5 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Read the docs
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://whisk-playground.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center rounded-md border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Try the playground
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <WidgetMockup />
        </div>
      </div>
    </section>
  );
}
