import type { Chain } from "../types/chain.js";
import { cctpDomainFor } from "../chains/cctpDomain.js";
import { chainInfo } from "../chains/registry.js";

export const IRIS_MAINNET_URL = "https://iris-api.circle.com";
export const IRIS_SANDBOX_URL = "https://iris-api-sandbox.circle.com";

export type IrisStatus =
  | "pending_confirmations"
  | "complete"
  | "failed"
  | "not_found";

export type IrisMessage = {
  status: IrisStatus;
  message?: string;
  attestation?: string;
  eventNonce?: string;
};

export type FetchAttestationOptions = {
  baseUrl?: string;
  signal?: AbortSignal;
};

export type PollAttestationOptions = FetchAttestationOptions & {
  timeout?: number;
  pollingInterval?: number;
  onUpdate?: (msg: IrisMessage) => void;
};

export function getIrisBaseUrl(chain: Chain): string {
  return chainInfo(chain).network === "mainnet"
    ? IRIS_MAINNET_URL
    : IRIS_SANDBOX_URL;
}

/** Single-shot attestation lookup against Iris. */
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

/** Poll Iris until the attestation is terminal or the timeout elapses. */
export async function pollAttestation(
  sourceChain: Chain,
  burnTxHash: string,
  options: PollAttestationOptions = {},
): Promise<IrisMessage> {
  const timeout = options.timeout ?? 10 * 60 * 1000;
  const interval = options.pollingInterval ?? 3000;
  const deadline = Date.now() + timeout;

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
