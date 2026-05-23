/** Token aliases App Kit recognises. For other tokens, pass a contract address string. */
export type Token =
  | "USDC"
  | "EURC"
  | "USDT"
  | "USDe"
  | "DAI"
  | "PYUSD"
  | "cirBTC"
  | "NATIVE";

export const DEFAULT_TOKEN: Token = "USDC";
