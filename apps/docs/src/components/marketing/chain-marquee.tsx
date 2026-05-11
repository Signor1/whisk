"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Auto-scrolling marquee of the testnets Whisk ships with. Doubled
 * content + a linear `x` translate gives a seamless infinite loop
 * without `transform: translateX(-50%)` jank or pixel rounding glitches.
 *
 * Reduced-motion users get a static, paginated grid instead.
 */

const CHAINS = [
  "Arc Testnet",
  "Arbitrum Sepolia",
  "Avalanche Fuji",
  "Base Sepolia",
  "Codex Testnet",
  "Ethereum Sepolia",
  "HyperEVM Testnet",
  "Ink Sepolia",
  "Linea Sepolia",
  "Monad Testnet",
  "Optimism Sepolia",
  "Plume Testnet",
  "Polygon Amoy",
  "Sei Testnet",
  "Sonic Testnet",
  "Unichain Sepolia",
  "World Chain Sepolia",
];

export function ChainMarquee({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <section
        className={cn(
          "border-y border-border/60 bg-background/50 py-8",
          className,
        )}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Ships with 17 testnets out of the box
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {CHAINS.map((c) => (
              <ChainChip key={c} name={c} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "border-y border-border/60 bg-background/50 py-8",
        className,
      )}
    >
      <p className="mb-5 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Ships with 17 testnets out of the box
      </p>

      <div
        className="relative overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        }}
      >
        <motion.div
          className="flex w-max gap-3 will-change-transform"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 48,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {[...CHAINS, ...CHAINS].map((name, i) => (
            <ChainChip key={`${name}-${i}`} name={name} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ChainChip({ name }: { name: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground/80 shadow-sm">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/80" />
      {name}
    </span>
  );
}
