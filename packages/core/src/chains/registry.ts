import type { Chain, ChainKind, ChainNetwork } from "../types/chain.js";

/**
 * A single chain entry in Whisk's registry. Whisk only owns the data the
 * widget needs — App Kit owns the protocol/contract details.
 *
 * Adding a chain = adding one entry here. Every chain-aware module reads
 * from this registry via `chainInfo(chain)` rather than hard-coding chain
 * checks, which is what keeps the architecture modular.
 */
export type ChainInfo = {
  chain: Chain;
  // Display name shown in the picker.
  label: string;
  kind: ChainKind;
  network: ChainNetwork;
  // Native gas token symbol — informational.
  nativeSymbol: string;
  // Block-explorer base URL — `${explorerTxBase}<txHash>`.
  explorerTxBase: string;
  // Block-explorer base URL for an address.
  explorerAddressBase: string;
  /**
   * Solana clusters need an explicit `?cluster=...` query string on every
   * explorer link. Other chains leave this undefined.
   */
  explorerQuery?: string;
  /**
   * Address format validator. Pure regex — no chain RPC required so this
   * runs synchronously in onChange handlers.
   */
  addressRegex: RegExp;
  addressHint: string;
};

const EVM_RE = /^0x[a-fA-F0-9]{40}$/;
const SOL_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const EVM_HINT = "0x… (40 hex chars)";
const SOL_HINT = "Base58 (32–44 chars)";

const CHAINS: ReadonlyArray<ChainInfo> = [
  // Mainnets
  {
    chain: "Arbitrum",
    label: "Arbitrum",
    kind: "evm",
    network: "mainnet",
    nativeSymbol: "ETH",
    explorerTxBase: "https://arbiscan.io/tx/",
    explorerAddressBase: "https://arbiscan.io/address/",
    addressRegex: EVM_RE,
    addressHint: EVM_HINT,
  },
  {
    chain: "Avalanche",
    label: "Avalanche",
    kind: "evm",
    network: "mainnet",
    nativeSymbol: "AVAX",
    explorerTxBase: "https://snowtrace.io/tx/",
    explorerAddressBase: "https://snowtrace.io/address/",
    addressRegex: EVM_RE,
    addressHint: EVM_HINT,
  },
  {
    chain: "Base",
    label: "Base",
    kind: "evm",
    network: "mainnet",
    nativeSymbol: "ETH",
    explorerTxBase: "https://basescan.org/tx/",
    explorerAddressBase: "https://basescan.org/address/",
    addressRegex: EVM_RE,
    addressHint: EVM_HINT,
  },
  {
    chain: "Ethereum",
    label: "Ethereum",
    kind: "evm",
    network: "mainnet",
    nativeSymbol: "ETH",
    explorerTxBase: "https://etherscan.io/tx/",
    explorerAddressBase: "https://etherscan.io/address/",
    addressRegex: EVM_RE,
    addressHint: EVM_HINT,
  },
  {
    chain: "Optimism",
    label: "OP Mainnet",
    kind: "evm",
    network: "mainnet",
    nativeSymbol: "ETH",
    explorerTxBase: "https://optimistic.etherscan.io/tx/",
    explorerAddressBase: "https://optimistic.etherscan.io/address/",
    addressRegex: EVM_RE,
    addressHint: EVM_HINT,
  },
  {
    chain: "Polygon",
    label: "Polygon",
    kind: "evm",
    network: "mainnet",
    nativeSymbol: "MATIC",
    explorerTxBase: "https://polygonscan.com/tx/",
    explorerAddressBase: "https://polygonscan.com/address/",
    addressRegex: EVM_RE,
    addressHint: EVM_HINT,
  },
  {
    chain: "Solana",
    label: "Solana",
    kind: "solana",
    network: "mainnet",
    nativeSymbol: "SOL",
    explorerTxBase: "https://explorer.solana.com/tx/",
    explorerAddressBase: "https://explorer.solana.com/address/",
    addressRegex: SOL_RE,
    addressHint: SOL_HINT,
  },
  {
    chain: "Unichain",
    label: "Unichain",
    kind: "evm",
    network: "mainnet",
    nativeSymbol: "ETH",
    explorerTxBase: "https://uniscan.xyz/tx/",
    explorerAddressBase: "https://uniscan.xyz/address/",
    addressRegex: EVM_RE,
    addressHint: EVM_HINT,
  },

  // Testnets
  {
    chain: "Arbitrum_Sepolia",
    label: "Arbitrum Sepolia",
    kind: "evm",
    network: "testnet",
    nativeSymbol: "ETH",
    explorerTxBase: "https://sepolia.arbiscan.io/tx/",
    explorerAddressBase: "https://sepolia.arbiscan.io/address/",
    addressRegex: EVM_RE,
    addressHint: EVM_HINT,
  },
  {
    chain: "Arc_Testnet",
    label: "Arc Testnet",
    kind: "evm",
    network: "testnet",
    nativeSymbol: "ARC",
    explorerTxBase: "https://testnet.arcscan.app/tx/",
    explorerAddressBase: "https://testnet.arcscan.app/address/",
    addressRegex: EVM_RE,
    addressHint: EVM_HINT,
  },
  {
    chain: "Avalanche_Fuji",
    label: "Avalanche Fuji",
    kind: "evm",
    network: "testnet",
    nativeSymbol: "AVAX",
    explorerTxBase: "https://testnet.snowtrace.io/tx/",
    explorerAddressBase: "https://testnet.snowtrace.io/address/",
    addressRegex: EVM_RE,
    addressHint: EVM_HINT,
  },
  {
    chain: "Base_Sepolia",
    label: "Base Sepolia",
    kind: "evm",
    network: "testnet",
    nativeSymbol: "ETH",
    explorerTxBase: "https://sepolia.basescan.org/tx/",
    explorerAddressBase: "https://sepolia.basescan.org/address/",
    addressRegex: EVM_RE,
    addressHint: EVM_HINT,
  },
  {
    chain: "Ethereum_Sepolia",
    label: "Ethereum Sepolia",
    kind: "evm",
    network: "testnet",
    nativeSymbol: "ETH",
    explorerTxBase: "https://sepolia.etherscan.io/tx/",
    explorerAddressBase: "https://sepolia.etherscan.io/address/",
    addressRegex: EVM_RE,
    addressHint: EVM_HINT,
  },
  {
    chain: "Monad_Testnet",
    label: "Monad Testnet",
    kind: "evm",
    network: "testnet",
    nativeSymbol: "MON",
    explorerTxBase: "https://testnet.monadexplorer.com/tx/",
    explorerAddressBase: "https://testnet.monadexplorer.com/address/",
    addressRegex: EVM_RE,
    addressHint: EVM_HINT,
  },
  {
    chain: "Optimism_Sepolia",
    label: "Optimism Sepolia",
    kind: "evm",
    network: "testnet",
    nativeSymbol: "ETH",
    explorerTxBase: "https://sepolia-optimism.etherscan.io/tx/",
    explorerAddressBase: "https://sepolia-optimism.etherscan.io/address/",
    addressRegex: EVM_RE,
    addressHint: EVM_HINT,
  },
  {
    chain: "Polygon_Amoy_Testnet",
    label: "Polygon Amoy",
    kind: "evm",
    network: "testnet",
    nativeSymbol: "MATIC",
    explorerTxBase: "https://amoy.polygonscan.com/tx/",
    explorerAddressBase: "https://amoy.polygonscan.com/address/",
    addressRegex: EVM_RE,
    addressHint: EVM_HINT,
  },
  {
    chain: "Solana_Devnet",
    label: "Solana Devnet",
    kind: "solana",
    network: "testnet",
    nativeSymbol: "SOL",
    explorerTxBase: "https://explorer.solana.com/tx/",
    explorerAddressBase: "https://explorer.solana.com/address/",
    explorerQuery: "?cluster=devnet",
    addressRegex: SOL_RE,
    addressHint: SOL_HINT,
  },
  {
    chain: "Unichain_Sepolia",
    label: "Unichain Sepolia",
    kind: "evm",
    network: "testnet",
    nativeSymbol: "ETH",
    explorerTxBase: "https://sepolia.uniscan.xyz/tx/",
    explorerAddressBase: "https://sepolia.uniscan.xyz/address/",
    addressRegex: EVM_RE,
    addressHint: EVM_HINT,
  },
];

const BY_CHAIN: ReadonlyMap<Chain, ChainInfo> = new Map(
  CHAINS.map((c) => [c.chain, c]),
);

/**
 * Get the metadata entry for a chain. Throws if the chain is not registered
 * — registry coverage is a hard requirement, not a runtime fallback.
 */
export function chainInfo(chain: Chain): ChainInfo {
  const info = BY_CHAIN.get(chain);
  if (!info) {
    throw new Error(`Whisk: chain "${chain}" is not in the registry.`);
  }
  return info;
}

/** All registered chains. Use this rather than re-listing literals. */
export function allChains(): ReadonlyArray<ChainInfo> {
  return CHAINS;
}

/** Filter helper — by network. */
export function chainsByNetwork(
  network: ChainNetwork,
): ReadonlyArray<ChainInfo> {
  return CHAINS.filter((c) => c.network === network);
}

/** Filter helper — by kind (EVM / Solana). */
export function chainsByKind(kind: ChainKind): ReadonlyArray<ChainInfo> {
  return CHAINS.filter((c) => c.kind === kind);
}

/**
 * Build an explorer URL for a transaction hash. Centralises the Solana
 * `?cluster=devnet` quirk so callers never need to know about it.
 */
export function explorerTxUrl(chain: Chain, txHash: string): string {
  const info = chainInfo(chain);
  return `${info.explorerTxBase}${txHash}${info.explorerQuery ?? ""}`;
}

export function explorerAddressUrl(chain: Chain, address: string): string {
  const info = chainInfo(chain);
  return `${info.explorerAddressBase}${address}${info.explorerQuery ?? ""}`;
}
