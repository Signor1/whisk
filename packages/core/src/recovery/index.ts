/**
 * Recovery primitives — surfaces that close fund-loss gaps when
 * something fails between source-side burn and destination-side mint.
 *
 * - `persistence` — localStorage-backed restore across browser refresh.
 * - `iris` — direct Circle Iris attestation polling, longer than App
 *   Kit's internal window. Read-only; never costs gas.
 *
 * Coming soon: `cctp` for direct MessageTransmitter mints when App
 * Kit's retry path is exhausted.
 */

export {
  saveInflight,
  loadInflight,
  clearInflight,
  listInflightSnapshots,
  serializeError,
  deserializeError,
  INFLIGHT_TTL_MS,
  STORAGE_PREFIX,
} from "./persistence.js";

export type { InflightSnapshot, WalletKind } from "./persistence.js";

export {
  fetchAttestationOnce,
  pollAttestation,
  getIrisBaseUrl,
  IRIS_MAINNET_URL,
  IRIS_SANDBOX_URL,
} from "./iris.js";

export type {
  IrisMessage,
  IrisStatus,
  FetchAttestationOptions,
  PollAttestationOptions,
} from "./iris.js";

// Manual mint recovery — submit MessageTransmitter.receiveMessage
// directly when App Kit's retry path is exhausted.
export {
  buildReceiveMessageCall,
  messageTransmitterAddress,
  manualMintExplorerUrl,
  RECEIVE_MESSAGE_ABI,
  EVM_MAINNET_MESSAGE_TRANSMITTER,
  EVM_TESTNET_MESSAGE_TRANSMITTER,
  SOLANA_MESSAGE_TRANSMITTER,
} from "./cctp.js";

export type { ReceiveMessageCall } from "./cctp.js";
