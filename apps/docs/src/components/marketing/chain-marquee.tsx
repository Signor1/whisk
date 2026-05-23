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
import { FramedSection } from "./framed-section";

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
      <FramedSection className={className} innerClassName="py-8">
        <p className="mb-4 text-center font-display text-xs font-medium uppercase tracking-[0.15em] text-primary/90">
          Routes USDC across these testnets today
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {CHAINS.map(({ name, Icon }) => (
            <ChainChip key={name} name={name} Icon={Icon} />
          ))}
        </div>
      </FramedSection>
    );
  }

  return (
    <FramedSection className={className} innerClassName="py-8">
      <p className="mb-5 text-center font-display text-xs font-medium uppercase tracking-[0.15em] text-primary/90">
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
    </FramedSection>
  );
}

function ChainChip({ name, Icon }: { name: string; Icon: Web3Icon }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-3 rounded-full border border-border/70 bg-card/80 py-1.5 pl-1.5 pr-5 text-[15px] font-medium text-foreground shadow-sm backdrop-blur-sm">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background/90 ring-1 ring-border/50">
        <Icon variant="branded" size={22} aria-hidden="true" />
      </span>
      {name}
    </span>
  );
}
