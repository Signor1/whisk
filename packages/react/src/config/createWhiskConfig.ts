import { ConfigError } from "@usewhisk/core";
import type { CreateWhiskConfigOptions, WhiskClientConfig } from "./types.js";

export function createWhiskConfig(
  options: CreateWhiskConfigOptions,
): WhiskClientConfig {
  if (!options.wallets || options.wallets.length === 0) {
    throw new ConfigError(
      "createWhiskConfig: at least one wallet adapter (e.g. evm()) is required.",
    );
  }
  if (!options.chains || options.chains.length === 0) {
    throw new ConfigError("createWhiskConfig: at least one chain is required.");
  }
  if (
    options.defaultSourceChain &&
    !options.chains.includes(options.defaultSourceChain)
  ) {
    throw new ConfigError(
      `createWhiskConfig: defaultSourceChain "${options.defaultSourceChain}" is not in the chains list.`,
    );
  }
  if (
    options.defaultDestinationChain &&
    !options.chains.includes(options.defaultDestinationChain)
  ) {
    throw new ConfigError(
      `createWhiskConfig: defaultDestinationChain "${options.defaultDestinationChain}" is not in the chains list.`,
    );
  }
  return Object.freeze({ ...options });
}
