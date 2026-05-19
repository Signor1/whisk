/**
 * Direct Circle Iris (Attestation Service) client.
 *
 * Iris is Circle's hosted attestation service. After a CCTP `burn` on a
 * source chain, Circle's attestor observes the event and signs a
 * `Message + attestation` payload that can be submitted to the
 * destination chain's MessageTransmitter to complete the mint.
 *
 * App Kit polls Iris internally during the `wait` step, but its window
 * is bounded (~120s by default) and the polling logic can give up
 * before Iris actually responds — most commonly seen on chains where
 * attestation latency spikes (Polygon Amoy → Sei was one of the
 * failure modes that motivated this module).
 *
 * This client polls Iris *independently*, with a longer default window
 * and configurable backoff, so the widget can recover when App Kit's
 * built-in poll fails the user. It does **not** trigger any
 * on-chain action and **never costs the user gas** — it is a pure
 * read-only HTTP client.
 *
 * ## Replay safety
 *
 * Iris returns the same attestation payload as long as the source
 * burn's nonce is unconsumed on the destination. Once minted, the
 * destination's MessageTransmitter rejects further submissions of the
 * same nonce, so re-polling Iris after a successful mint is harmless.
 *
 * ## API surface
 *
 * `fetchAttestationOnce` — single shot. Returns the current attestation
 * state without polling.
 *
 * `pollAttestation` — loop until status is terminal (`complete` or
 * `failed`) or the timeout elapses. Returns the final state.
 */

import type { Chain } from "../types/chain.js";
import { cctpDomainFor } from "../chains/cctpDomain.js";
import { chainInfo } from "../chains/registry.js";

/** Iris production endpoint (CCTP mainnet attestations). */
export const IRIS_MAINNET_URL = "https://iris-api.circle.com";

/** Iris sandbox endpoint (CCTP testnet attestations). */
export const IRIS_SANDBOX_URL = "https://iris-api-sandbox.circle.com";

/**
 * Iris attestation lifecycle states. Per Circle's CCTP v2 docs:
 *
 * - `pending_confirmations` — Iris has seen the burn but not yet signed.
 *   Normal during the first ~10–60 seconds after a burn.
 * - `complete` — attestation is signed and ready. Caller can submit the
 *   `message + attestation` to the destination MessageTransmitter.
 * - `failed` — Iris observed the burn but refused to sign (rare; usually
 *   indicates a malformed source-side message). Recovery is impossible
 *   through this attestation.
 * - `not_found` — Iris hasn't seen the burn yet. Either the tx is still
 *   propagating or the source domain / txHash combination is wrong.
 */
export type IrisStatus =
  | "pending_confirmations"
  | "complete"
  | "failed"
  | "not_found";

export type IrisMessage = {
  status: IrisStatus;
  /** Hex-encoded CCTP message payload. Present once status === "complete". */
  message?: string;
  /** Hex-encoded attestor signature. Present once status === "complete". */
  attestation?: string;
  /** Unique nonce identifying this burn on the source domain. */
  eventNonce?: string;
};

export type FetchAttestationOptions = {
  /** Override the base URL — defaults to mainnet/sandbox based on chain network. */
  baseUrl?: string;
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
};

export type PollAttestationOptions = FetchAttestationOptions & {
  /**
   * Maximum total time to poll (ms). Defaults to 10 minutes — comfortably
   * longer than CCTP v2's typical fast-burn finality window so we don't
   * time out a perfectly healthy attestation.
   */
  timeout?: number;
  /**
   * Interval between polls (ms). Defaults to 3000. Iris recommends ≥1s
   * to avoid rate limiting; we use 3s to be a good citizen.
   */
  pollingInterval?: number;
  /**
   * Called with the latest IrisMessage on every poll. Lets the UI show
   * "Attestation pending… (Iris status: pending_confirmations)" without
   * the polling logic owning state.
   */
  onUpdate?: (msg: IrisMessage) => void;
};

/**
 * Pick the Iris base URL for the given source chain. Looks at
 * `chainInfo(chain).network`: `mainnet` chains use production Iris;
 * everything else (testnet / devnet / sepolia) uses the sandbox.
 */
export function getIrisBaseUrl(chain: Chain): string {
  const info = chainInfo(chain);
  return info.network === "mainnet" ? IRIS_MAINNET_URL : IRIS_SANDBOX_URL;
}

/**
 * One-shot attestation lookup. Returns the current Iris view of the
 * burn — `not_found` if Iris hasn't seen the tx yet, `complete` with
 * `message` + `attestation` when ready.
 *
 * Throws on transport errors (DNS, TLS, 5xx). 404 from Iris is mapped
 * to `{ status: "not_found" }` rather than an exception — it's the
 * expected state before Iris indexes the burn.
 */
export async function fetchAttestationOnce(
  sourceChain: Chain,
  burnTxHash: string,
  options: FetchAttestationOptions = {},
): Promise<IrisMessage> {
  const domain = cctpDomainFor(sourceChain);
  if (domain === undefined) {
    return { status: "not_found" };
  }
  const base = options.baseUrl ?? getIrisBaseUrl(sourceChain);
  const url = `${base}/v2/messages/${domain}/${burnTxHash}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: options.signal,
  });

  if (response.status === 404) {
    return { status: "not_found" };
  }
  if (!response.ok) {
    throw new Error(
      `Iris responded ${response.status} ${response.statusText} for ${burnTxHash}`,
    );
  }

  const data = (await response.json()) as { messages?: unknown[] };
  const entry = Array.isArray(data.messages) ? data.messages[0] : undefined;
  if (!entry || typeof entry !== "object") {
    return { status: "not_found" };
  }
  const e = entry as Record<string, unknown>;
  const status =
    typeof e.status === "string" ? (e.status as IrisStatus) : "not_found";
  return {
    status,
    message: typeof e.message === "string" ? e.message : undefined,
    attestation: typeof e.attestation === "string" ? e.attestation : undefined,
    eventNonce: typeof e.eventNonce === "string" ? e.eventNonce : undefined,
  };
}

/**
 * Poll Iris until the attestation is terminal (`complete` / `failed`)
 * or the timeout elapses. Read-only — never costs the user gas.
 *
 * Use cases:
 *
 *  - **Pre-retry gating**: before calling `engine.retry()`, confirm
 *    Iris has the attestation ready. Saves the user from a retry that
 *    would fail at the wait step anyway.
 *  - **Stuck-state recovery**: when App Kit's internal poll times out
 *    on a slow source chain, we keep polling and surface a clear
 *    "attestation now ready" signal to the UI.
 *  - **Diagnostic**: in the failure UI, show Iris's current view so
 *    the user can tell "still waiting for Circle" from "Iris saw it,
 *    we just couldn't submit the mint".
 *
 * Returns the final state. The caller is responsible for downstream
 * actions (retry, manual mint, etc.) — this function never signs
 * anything.
 */
export async function pollAttestation(
  sourceChain: Chain,
  burnTxHash: string,
  options: PollAttestationOptions = {},
): Promise<IrisMessage> {
  const timeout = options.timeout ?? 10 * 60 * 1000; // 10 min
  const interval = options.pollingInterval ?? 3000;
  const deadline = Date.now() + timeout;

  // First fetch outside the loop so callers always get at least one
  // poll attempt even with timeout: 0.
  let latest = await fetchAttestationOnce(sourceChain, burnTxHash, options);
  options.onUpdate?.(latest);
  if (latest.status === "complete" || latest.status === "failed") {
    return latest;
  }

  while (Date.now() < deadline) {
    if (options.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    await sleep(interval, options.signal);
    latest = await fetchAttestationOnce(sourceChain, burnTxHash, options);
    options.onUpdate?.(latest);
    if (latest.status === "complete" || latest.status === "failed") {
      return latest;
    }
  }
  return latest;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const id = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(id);
      reject(new DOMException("Aborted", "AbortError"));
    }
    signal?.addEventListener("abort", onAbort);
  });
}
