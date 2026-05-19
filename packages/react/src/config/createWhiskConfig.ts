import { ConfigError } from "@signordev/whisk-core";
import type { CreateWhiskConfigOptions, WhiskClientConfig } from "./types.js";

/**
 * Validate and freeze the options passed by the host app. The provider
 * reads from this object once on mount; misconfigurations surface
 * immediately at config time rather than at first send.
 *
 * Keeping the function tiny on purpose — most fields are pass-through.
 * The validations focus on combinations that produce confusing runtime
 * failures (empty chains, defaults not in the chain list, etc.).
 */
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
