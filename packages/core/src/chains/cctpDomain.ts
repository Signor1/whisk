/**
 * CCTP v2 source-domain IDs per chain.
 *
 * Circle's MessageTransmitter contracts identify chains by a stable
 * "domain" number rather than EVM chain id, so that the same Solana ↔
 * EVM message format works across ecosystems. Iris (Circle's
 * attestation API) keys lookups on `domain + burnTxHash`.
 *
 * Values mirror `@circle-fin/app-kit/chains`. Testnets share their
 * mainnet's domain — Iris distinguishes via the API host
 * (`iris-api.circle.com` for mainnet,
 * `iris-api-sandbox.circle.com` for testnet) rather than the domain
 * number.
 *
 * Add new entries here when bridge support lands for a new chain in
 * App Kit. A `cctpDomainFor` lookup that returns `undefined` is
 * non-fatal — the recovery path skips Iris polling and falls back to
 * App Kit's internal flow.
 */

import type { Chain } from "../types/chain.js";

const DOMAIN_MAP: Partial<Record<Chain, number>> = {
  // Domain 0
  Ethereum: 0,
  Ethereum_Sepolia: 0,
  // Domain 1
  Avalanche: 1,
  Avalanche_Fuji: 1,
  // Domain 2
  Optimism: 2,
  Optimism_Sepolia: 2,
  // Domain 3
  Arbitrum: 3,
  Arbitrum_Sepolia: 3,
  // Domain 5
  Solana: 5,
  Solana_Devnet: 5,
  // Domain 6
  Base: 6,
  Base_Sepolia: 6,
  // Domain 7
  Polygon: 7,
  Polygon_Amoy_Testnet: 7,
  // Domain 10
  Unichain: 10,
  Unichain_Sepolia: 10,
  // Domain 11
  Linea: 11,
  Linea_Sepolia: 11,
  // Domain 12
  Codex: 12,
  Codex_Testnet: 12,
  // Domain 13
  Sonic: 13,
  Sonic_Testnet: 13,
  // Domain 14
  World_Chain: 14,
  World_Chain_Sepolia: 14,
  // Domain 16
  Sei: 16,
  Sei_Testnet: 16,
  // Domain 18
  XDC: 18,
  XDC_Apothem: 18,
  // Domain 19
  HyperEVM: 19,
  HyperEVM_Testnet: 19,
  // Domain 21
  Ink: 21,
  Ink_Testnet: 21,
  // Domain 22
  Plume: 22,
  Plume_Testnet: 22,
  // Domain 26 — Arc Testnet only; Arc mainnet not yet in the Chain
  // union. When Whisk adds Arc mainnet, register it here too.
  Arc_Testnet: 26,
  // Monad: domain ID not yet published in App Kit's chains.d.ts.
  // Leaving unmapped is safe — recovery falls back to App Kit's
  // built-in polling for unmapped chains.
};

/**
 * Get the CCTP v2 source-domain ID for a chain. Returns `undefined`
 * when the chain isn't in CCTP's domain registry — callers should
 * treat that as "skip Iris polling, fall back to App Kit only".
 */
export function cctpDomainFor(chain: Chain): number | undefined {
  return DOMAIN_MAP[chain];
}

/**
 * Reverse lookup: find any chain with a given domain. Useful when
 * decoding an Iris message that names the destination by domain.
 * Returns the first match (mainnet preferred over testnet via the
 * iteration order above).
 */
export function chainForCctpDomain(domain: number): Chain | undefined {
  for (const [chain, id] of Object.entries(DOMAIN_MAP) as Array<
    [Chain, number]
  >) {
    if (id === domain) return chain;
  }
  return undefined;
}
