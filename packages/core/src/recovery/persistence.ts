import type { Quote } from "../types/quote.js";
import type { Step } from "../types/step.js";
import type { WhiskErrorCategory, WhiskErrorCode } from "../errors/errors.js";
import { WhiskError } from "../errors/errors.js";
import type { StepName } from "../types/step.js";
import type { WhiskMode } from "../types/config.js";

export type WalletKind = "evm" | "solana";

export const INFLIGHT_TTL_MS = 48 * 60 * 60 * 1000;
export const STORAGE_PREFIX = "whisk:inflight:";

const SNAPSHOT_VERSION = 1;

type SerializedError = {
  name: string;
  message: string;
  code: WhiskErrorCode;
  retryable: boolean;
  category?: WhiskErrorCategory;
  step?: StepName;
};

export type InflightSnapshot = {
  version: typeof SNAPSHOT_VERSION;
  mode: WhiskMode;
  walletKind: WalletKind;
  walletAddress: string;
  sourceChain: string;
  destinationChain: string;
  quote: Quote;
  steps: Step[];
  error: SerializedError;
  raw: unknown;
  savedAt: number;
  expiresAt: number;
};

function storageKey(
  mode: WhiskMode,
  walletKind: WalletKind,
  address: string,
  sourceChain: string,
): string {
  return `${STORAGE_PREFIX}${mode}:${walletKind}:${address.toLowerCase()}:${sourceChain}`;
}

function getStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    // Probe-write detects Safari private mode, which returns a no-op
    // localStorage instead of throwing on the .setItem call.
    const probe = "__whisk_probe__";
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function serializeError(err: WhiskError): SerializedError {
  return {
    name: err.name,
    message: err.message,
    code: err.code,
    retryable: err.retryable,
    category: err.category,
    step: err.step,
  };
}

export function deserializeError(s: SerializedError): WhiskError {
  const err = new WhiskError({
    code: s.code,
    message: s.message,
    retryable: s.retryable,
    category: s.category,
    step: s.step,
  });
  err.name = s.name;
  return err;
}

/** Persist a mid-flight failure snapshot. Returns false on SSR or storage failure. */
export function saveInflight(
  input: Omit<InflightSnapshot, "version" | "savedAt" | "expiresAt">,
): boolean {
  const storage = getStorage();
  if (!storage) return false;

  const now = Date.now();
  const snapshot: InflightSnapshot = {
    version: SNAPSHOT_VERSION,
    ...input,
    savedAt: now,
    expiresAt: now + INFLIGHT_TTL_MS,
  };

  try {
    const serialized = JSON.stringify(snapshot);
    storage.setItem(
      storageKey(
        input.mode,
        input.walletKind,
        input.walletAddress,
        input.sourceChain,
      ),
      serialized,
    );
    return true;
  } catch {
    return false;
  }
}

/** Read a snapshot for the given (mode, wallet, source). Auto-clears stale entries. */
export function loadInflight(
  mode: WhiskMode,
  walletKind: WalletKind,
  address: string,
  sourceChain: string,
): InflightSnapshot | null {
  const storage = getStorage();
  if (!storage) return null;

  const key = storageKey(mode, walletKind, address, sourceChain);
  const raw = storage.getItem(key);
  if (!raw) return null;

  try {
    const snapshot = JSON.parse(raw) as Partial<InflightSnapshot>;
    if (snapshot.version !== SNAPSHOT_VERSION) {
      storage.removeItem(key);
      return null;
    }
    if (
      typeof snapshot.expiresAt !== "number" ||
      Date.now() > snapshot.expiresAt
    ) {
      storage.removeItem(key);
      return null;
    }
    if (snapshot.mode !== mode) {
      return null;
    }
    if (
      snapshot.raw === undefined ||
      !Array.isArray(snapshot.steps) ||
      !snapshot.quote ||
      !snapshot.error
    ) {
      storage.removeItem(key);
      return null;
    }
    return snapshot as InflightSnapshot;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

export function clearInflight(
  mode: WhiskMode,
  walletKind: WalletKind,
  address: string,
  sourceChain: string,
): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(storageKey(mode, walletKind, address, sourceChain));
  } catch {
    /* ignore */
  }
}

/** Every non-expired snapshot in storage. Clears stale entries as a side effect. */
export function listInflightSnapshots(): InflightSnapshot[] {
  const storage = getStorage();
  if (!storage) return [];

  const out: InflightSnapshot[] = [];
  const stale: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
    const raw = storage.getItem(key);
    if (!raw) continue;
    try {
      const snapshot = JSON.parse(raw) as Partial<InflightSnapshot>;
      if (snapshot.version !== SNAPSHOT_VERSION) {
        stale.push(key);
        continue;
      }
      if (
        typeof snapshot.expiresAt !== "number" ||
        Date.now() > snapshot.expiresAt
      ) {
        stale.push(key);
        continue;
      }
      out.push(snapshot as InflightSnapshot);
    } catch {
      stale.push(key);
    }
  }
  for (const key of stale) {
    try {
      storage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  return out;
}
