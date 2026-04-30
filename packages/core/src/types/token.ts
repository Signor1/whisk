/**
 * Tokens Whisk supports today. v1 ships with USDC; the type is intentionally
 * a superset so future EURC/USDT support drops in without breaking existing
 * users.
 *
 * For now, only `"USDC"` is wired through every operation.
 */
export type Token = "USDC" | "EURC" | "USDT";

/**
 * Default token used by the widget when nothing is specified.
 */
export const DEFAULT_TOKEN: Token = "USDC";
