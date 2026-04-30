import type { Resolver } from "../types/resolver.js";
import { chainInfo } from "../chains/registry.js";

/**
 * Resolves raw addresses (EVM hex or Solana base58) directly. Always tried
 * first in the default resolver chain — if the user pasted an address we
 * just trust it without round-tripping ENS or any other lookup.
 *
 * Validates against the address-format regex registered for the target
 * chain so EVM addresses don't accidentally get accepted as Solana ones.
 */
export const addressResolver: Resolver = {
  name: "address",
  matches: (input) => {
    const trimmed = input.trim();
    // Cheap shape check — any of the formats the registry recognises.
    return (
      /^0x[a-fA-F0-9]{40}$/.test(trimmed) ||
      /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)
    );
  },
  resolve: async (input, { chain }) => {
    const trimmed = input.trim();
    const info = chainInfo(chain);
    if (!info.addressRegex.test(trimmed)) {
      // The input matched _an_ address format but not the one for the
      // selected chain. Returning null lets later resolvers try; if none
      // match, the engine surfaces InvalidAddressError to the UI.
      return null;
    }
    return {
      address: trimmed,
      chain,
    };
  },
};
