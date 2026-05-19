/**
 * Curated chain → (icon, label) mapping for the docs MDX surfaces.
 *
 * Kept local to the docs app instead of imported from
 * `@signordev/whisk-core` so the docs can ship without pulling the
 * widget package into the MDX bundle. The list mirrors the engine
 * registry; if a chain lands there it should land here too.
 */

import type { ComponentType, SVGAttributes } from "react";
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

export type Web3Icon = ComponentType<
  SVGAttributes<SVGSVGElement> & {
    variant?: "branded" | "mono" | "background";
    size?: number | string;
  }
>;

export type ChainEntry = {
  id: string;
  label: string;
  Icon: Web3Icon;
  network: "mainnet" | "testnet";
};

export const MAINNETS: ChainEntry[] = [
  {
    id: "arbitrum",
    label: "Arbitrum",
    Icon: NetworkArbitrumOne,
    network: "mainnet",
  },
  {
    id: "avalanche",
    label: "Avalanche",
    Icon: NetworkAvalanche,
    network: "mainnet",
  },
  { id: "base", label: "Base", Icon: NetworkBase, network: "mainnet" },
  { id: "codex", label: "Codex", Icon: NetworkCodex, network: "mainnet" },
  {
    id: "ethereum",
    label: "Ethereum",
    Icon: NetworkEthereum,
    network: "mainnet",
  },
  {
    id: "hyperevm",
    label: "HyperEVM",
    Icon: NetworkHyperEvm,
    network: "mainnet",
  },
  { id: "ink", label: "Ink", Icon: NetworkInk, network: "mainnet" },
  { id: "linea", label: "Linea", Icon: NetworkLinea, network: "mainnet" },
  { id: "monad", label: "Monad", Icon: NetworkMonad, network: "mainnet" },
  {
    id: "optimism",
    label: "OP Mainnet",
    Icon: NetworkOptimism,
    network: "mainnet",
  },
  { id: "plume", label: "Plume", Icon: NetworkPlume, network: "mainnet" },
  { id: "polygon", label: "Polygon", Icon: NetworkPolygon, network: "mainnet" },
  { id: "sei", label: "Sei", Icon: NetworkSeiNetwork, network: "mainnet" },
  { id: "solana", label: "Solana", Icon: NetworkSolana, network: "mainnet" },
  { id: "sonic", label: "Sonic", Icon: NetworkSonic, network: "mainnet" },
  {
    id: "unichain",
    label: "Unichain",
    Icon: NetworkUnichain,
    network: "mainnet",
  },
  { id: "world", label: "World Chain", Icon: NetworkWorld, network: "mainnet" },
  { id: "xdc", label: "XDC", Icon: NetworkXdc, network: "mainnet" },
];

export const TESTNETS: ChainEntry[] = [
  {
    id: "arc-testnet",
    label: "Arc Testnet",
    Icon: NetworkArc,
    network: "testnet",
  },
  {
    id: "arbitrum-sepolia",
    label: "Arbitrum Sepolia",
    Icon: NetworkArbitrumSepolia,
    network: "testnet",
  },
  {
    id: "avalanche-fuji",
    label: "Avalanche Fuji",
    Icon: NetworkAvalancheFuji,
    network: "testnet",
  },
  {
    id: "base-sepolia",
    label: "Base Sepolia",
    Icon: NetworkBaseSepolia,
    network: "testnet",
  },
  {
    id: "codex-testnet",
    label: "Codex Testnet",
    Icon: NetworkCodex,
    network: "testnet",
  },
  {
    id: "ethereum-sepolia",
    label: "Ethereum Sepolia",
    Icon: NetworkSepolia,
    network: "testnet",
  },
  {
    id: "hyperevm-testnet",
    label: "HyperEVM Testnet",
    Icon: NetworkHyperEvm,
    network: "testnet",
  },
  {
    id: "ink-testnet",
    label: "Ink Testnet",
    Icon: NetworkInk,
    network: "testnet",
  },
  {
    id: "linea-sepolia",
    label: "Linea Sepolia",
    Icon: NetworkLineaSepolia,
    network: "testnet",
  },
  {
    id: "monad-testnet",
    label: "Monad Testnet",
    Icon: NetworkMonadTestnet,
    network: "testnet",
  },
  {
    id: "optimism-sepolia",
    label: "OP Sepolia",
    Icon: NetworkOptimismSepolia,
    network: "testnet",
  },
  {
    id: "plume-testnet",
    label: "Plume Testnet",
    Icon: NetworkPlume,
    network: "testnet",
  },
  {
    id: "polygon-amoy",
    label: "Polygon Amoy",
    Icon: NetworkPolygonAmoy,
    network: "testnet",
  },
  {
    id: "sei-testnet",
    label: "Sei Testnet",
    Icon: NetworkSeiNetwork,
    network: "testnet",
  },
  {
    id: "solana-devnet",
    label: "Solana Devnet",
    Icon: NetworkSolana,
    network: "testnet",
  },
  {
    id: "sonic-testnet",
    label: "Sonic Testnet",
    Icon: NetworkSonic,
    network: "testnet",
  },
  {
    id: "unichain-sepolia",
    label: "Unichain Sepolia",
    Icon: NetworkUnichain,
    network: "testnet",
  },
  {
    id: "world-chain-sepolia",
    label: "World Chain Sepolia",
    Icon: NetworkWorld,
    network: "testnet",
  },
  {
    id: "xdc-apothem",
    label: "XDC Apothem",
    Icon: NetworkXdc,
    network: "testnet",
  },
];

const BY_KEY = new Map<string, ChainEntry>([
  ...MAINNETS.map((c) => [c.id, c] as const),
  ...TESTNETS.map((c) => [c.id, c] as const),
  // Friendly aliases — let MDX authors say `chain="Base"` or
  // `chain="Base_Sepolia"` instead of the kebab id.
  ...MAINNETS.map((c) => [c.label, c] as const),
  ...TESTNETS.map((c) => [c.label, c] as const),
]);

export function chainEntry(idOrLabel: string): ChainEntry | undefined {
  return BY_KEY.get(idOrLabel);
}
