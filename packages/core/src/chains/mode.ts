/**
 * Mode inference + resolved-mode helpers.
 *
 * `WhiskMode` is the user-facing label for "testnet" vs "mainnet"
 * operation. When the consumer passes it explicitly on
 * `createWhiskConfig({ mode })`, that value wins. When omitted, we
 * derive it from the chain list — most apps pass either all-testnet
 * or all-mainnet chains, so inference covers the common case without
 * extra ceremony.
 *
 * Mixed configs (some mainnet, some testnet) almost certainly indicate
 * a copy-paste mistake — we default to "testnet" for safety and log
 * a warning so the developer notices.
 */

import type { Chain } from "../types/chain.js";
import type { WhiskMode } from "../types/config.js";
import { chainInfo } from "./registry.js";

/**
 * Infer the widget's mode from a chain list. Pure — no side effects.
 *
 * @returns `"mainnet"` when every chain is mainnet, `"testnet"`
 * otherwise (including empty / mixed lists).
 */
export function inferMode(chains: ReadonlyArray<Chain>): WhiskMode {
  if (chains.length === 0) return "testnet";
  let sawMainnet = false;
  let sawTestnet = false;
  for (const chain of chains) {
    const network = chainInfo(chain).network;
    if (network === "mainnet") sawMainnet = true;
    else sawTestnet = true;
  }
  if (sawMainnet && !sawTestnet) return "mainnet";
  return "testnet";
}

/**
 * Resolve the final mode for a config. Honours `config.mode` when
 * present; otherwise infers from `chains`. When the explicit mode
 * disagrees with what the chain list looks like, logs a warning —
 * the explicit value wins (consumer knows best) but they probably
 * want to know.
 */
export function resolveMode(
  explicit: WhiskMode | undefined,
  chains: ReadonlyArray<Chain>,
): WhiskMode {
  const inferred = inferMode(chains);
  if (!explicit) return inferred;

  if (explicit !== inferred && chains.length > 0) {
    const mixed =
      inferred === "testnet" &&
      chains.some((c) => chainInfo(c).network === "mainnet");
    // Log only when there's a real mismatch (mode set to mainnet but
    // some chains are testnet, or vice versa). Empty chain lists
    // don't carry signal.
    // eslint-disable-next-line no-console
    console.warn(
      `[whisk] config.mode is "${explicit}" but the chain list looks like ${inferred} (${
        mixed ? "mixed" : "all " + inferred
      }). Mode wins, but double-check this is intentional.`,
    );
  }
  return explicit;
}
