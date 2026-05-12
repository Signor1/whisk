"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ComponentType, SVGAttributes } from "react";
import {
  NetworkArbitrumSepolia,
  NetworkArc,
  NetworkAvalancheFuji,
  NetworkBaseSepolia,
  NetworkCodex,
  NetworkHyperEvm,
  NetworkInk,
  NetworkLineaSepolia,
  NetworkMonadTestnet,
  NetworkOptimismSepolia,
  NetworkPlume,
  NetworkPolygonAmoy,
  NetworkSeiNetwork,
  NetworkSepolia,
  NetworkSonic,
  NetworkUnichain,
  NetworkWorld,
} from "@web3icons/react";
import { cn } from "@/lib/utils";

/**
 * Auto-scrolling marquee of the testnets Whisk ships with. Each chip
 * pairs the chain's display name with its `@web3icons/react` logo
 * (branded variant — full colour, no monochrome reduction). Doubled
 * content + a linear `x` translate gives a seamless infinite loop.
 *
 * Reduced-motion users get a static, paginated grid instead.
 */

type Web3Icon = ComponentType<
  SVGAttributes<SVGSVGElement> & {
    variant?: "branded" | "mono" | "background";
    size?: number | string;
  }
>;

const CHAINS: Array<{ name: string; Icon: Web3Icon }> = [
  { name: "Arc Testnet", Icon: NetworkArc },
  { name: "Arbitrum Sepolia", Icon: NetworkArbitrumSepolia },
  { name: "Avalanche Fuji", Icon: NetworkAvalancheFuji },
  { name: "Base Sepolia", Icon: NetworkBaseSepolia },
  { name: "Codex Testnet", Icon: NetworkCodex },
  { name: "Ethereum Sepolia", Icon: NetworkSepolia },
  { name: "HyperEVM Testnet", Icon: NetworkHyperEvm },
  { name: "Ink Sepolia", Icon: NetworkInk },
  { name: "Linea Sepolia", Icon: NetworkLineaSepolia },
  { name: "Monad Testnet", Icon: NetworkMonadTestnet },
  { name: "Optimism Sepolia", Icon: NetworkOptimismSepolia },
  { name: "Plume Testnet", Icon: NetworkPlume },
  { name: "Polygon Amoy", Icon: NetworkPolygonAmoy },
  { name: "Sei Testnet", Icon: NetworkSeiNetwork },
  { name: "Sonic Testnet", Icon: NetworkSonic },
  { name: "Unichain Sepolia", Icon: NetworkUnichain },
  { name: "World Chain Sepolia", Icon: NetworkWorld },
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Routes USDC across these testnets today
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {CHAINS.map(({ name, Icon }) => (
              <ChainChip key={name} name={name} Icon={Icon} />
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
        Routes USDC across these testnets today
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
          {[...CHAINS, ...CHAINS].map(({ name, Icon }, i) => (
            <ChainChip key={`${name}-${i}`} name={name} Icon={Icon} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ChainChip({ name, Icon }: { name: string; Icon: Web3Icon }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground/80 shadow-sm">
      <Icon
        variant="branded"
        size={18}
        aria-hidden="true"
        className="shrink-0"
      />
      {name}
    </span>
  );
}
