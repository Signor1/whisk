"use client";

import type { ComponentType, SVGAttributes } from "react";
import type { Chain } from "@signordev/whisk-core";

import {
  NetworkArbitrumOne,
  NetworkArbitrumSepolia,
  NetworkArc,
  NetworkAvalanche,
  NetworkAvalancheFuji,
  NetworkBase,
  NetworkBaseSepolia,
  NetworkCodex,
  NetworkEthereum,
  NetworkHyperEvm,
  NetworkInk,
  NetworkLinea,
  NetworkLineaSepolia,
  NetworkMonad,
  NetworkMonadTestnet,
  NetworkOptimism,
  NetworkOptimismSepolia,
  NetworkPlume,
  NetworkPolygon,
  NetworkPolygonAmoy,
  NetworkSeiNetwork,
  NetworkSepolia,
  NetworkSolana,
  NetworkSonic,
  NetworkUnichain,
  NetworkWorld,
  NetworkXdc,
} from "@web3icons/react";

/**
 * Per-chain branded logo, sourced from `@web3icons/react`.
 *
 * Mapping mainnet ↔ testnet:
 *   - Where the testnet has its own branded glyph (Base Sepolia,
 *     Arbitrum Sepolia, Monad Testnet, Polygon Amoy, Linea Sepolia,
 *     Optimism Sepolia, Ethereum Sepolia), we use the testnet-
 *     specific component so users can tell production from staging
 *     at a glance.
 *   - Where the package only ships one logo per ecosystem (Sei,
 *     Solana, HyperEVM, Ink, Plume, Sonic, Unichain, World, XDC,
 *     Codex), the testnet variant reuses the mainnet logo. Their
 *     brand sheets don't differentiate either.
 */

type IconComponent = ComponentType<
  SVGAttributes<SVGSVGElement> & {
    variant?: "branded" | "mono" | "background";
    size?: number | string;
  }
>;

const CHAIN_ICONS = {
  // ── Mainnets ──────────────────────────────────────────────────
  Arbitrum: NetworkArbitrumOne,
  Avalanche: NetworkAvalanche,
  Base: NetworkBase,
  Codex: NetworkCodex,
  Ethereum: NetworkEthereum,
  HyperEVM: NetworkHyperEvm,
  Ink: NetworkInk,
  Linea: NetworkLinea,
  Monad: NetworkMonad,
  Optimism: NetworkOptimism,
  Plume: NetworkPlume,
  Polygon: NetworkPolygon,
  Sei: NetworkSeiNetwork,
  Solana: NetworkSolana,
  Sonic: NetworkSonic,
  Unichain: NetworkUnichain,
  World_Chain: NetworkWorld,
  XDC: NetworkXdc,

  // ── Testnets (variant glyphs where available) ─────────────────
  Arbitrum_Sepolia: NetworkArbitrumSepolia,
  Arc_Testnet: NetworkArc,
  Avalanche_Fuji: NetworkAvalancheFuji,
  Base_Sepolia: NetworkBaseSepolia,
  Codex_Testnet: NetworkCodex,
  Ethereum_Sepolia: NetworkSepolia,
  HyperEVM_Testnet: NetworkHyperEvm,
  Ink_Testnet: NetworkInk,
  Linea_Sepolia: NetworkLineaSepolia,
  Monad_Testnet: NetworkMonadTestnet,
  Optimism_Sepolia: NetworkOptimismSepolia,
  Plume_Testnet: NetworkPlume,
  Polygon_Amoy_Testnet: NetworkPolygonAmoy,
  Sei_Testnet: NetworkSeiNetwork,
  Solana_Devnet: NetworkSolana,
  Sonic_Testnet: NetworkSonic,
  Unichain_Sepolia: NetworkUnichain,
  World_Chain_Sepolia: NetworkWorld,
  XDC_Apothem: NetworkXdc,
} as const satisfies Record<Chain, IconComponent>;

export type ChainIconProps = {
  chain: Chain;
  /** Pixel size of the glyph. Defaults to 16. */
  size?: number;
  /** Web3Icons stylistic variant. Defaults to `"branded"`. */
  variant?: "branded" | "mono" | "background";
  className?: string;
};

/**
 * The branded logo for a chain. Sized at 16px by default so it
 * drops cleanly into chips, select items, and pills.
 */
export function ChainIcon({
  chain,
  size = 16,
  variant = "branded",
  className,
}: ChainIconProps) {
  const Icon = CHAIN_ICONS[chain];
  return (
    <Icon
      size={size}
      variant={variant}
      aria-hidden="true"
      className={className}
    />
  );
}
