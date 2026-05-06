/**
 * Token aliases App Kit recognises out of the box. The widget passes
 * these strings directly to the SDK so they don't need translating.
 *
 * - `USDC` is the Whisk default and the only token Bridge / Unified
 *   Balance support.
 * - `EURC`, `USDT`, `USDe`, `DAI`, `PYUSD`, `cirBTC` are accepted by
 *   Send and Swap depending on the chain.
 * - `NATIVE` resolves to the chain's native token (ETH / SOL / AVAX /
 *   etc.) for Send and Swap.
 *
 * For tokens outside this list, use a token contract address string.
 */
export type Token =
  | "USDC"
  | "EURC"
  | "USDT"
  | "USDe"
  | "DAI"
  | "PYUSD"
  | "cirBTC"
  | "NATIVE";

/**
 * Default token used by the widget when nothing is specified.
 */
export const DEFAULT_TOKEN: Token = "USDC";
