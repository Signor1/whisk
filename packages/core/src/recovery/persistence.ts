/**
 * In-flight failure persistence.
 *
 * When a bridge fails after the burn step (USDC is gone from source but
 * the mint hasn't landed on destination), we save the failure snapshot
 * to `localStorage` so a browser refresh — or the user closing the tab
 * and re-opening it later — doesn't strand their funds. The widget's
 * mount path checks for a matching snapshot on every connect and
 * resurrects the failure state, lighting up the "Complete the mint"
 * retry CTA.
 *
 * Storage key shape:
 *
 *     whisk:inflight:${walletKind}:${address}:${sourceChain}
 *
 * Namespacing by `(walletKind, address, sourceChain)` so connecting a
 * different wallet doesn't see another wallet's pending recovery, and
 * so two simultaneous bridges from the same address on different
 * source chains each get their own slot.
 *
 * **Replay safety.** CCTP v2 messages carry a unique nonce; the
 * MessageTransmitter on the destination chain tracks consumed nonces
 * and reverts duplicate submissions. So even if a snapshot is
 * resurrected on a different machine, the attestation can only be
 * minted once at the protocol level.
 */

import type { Quote } from "../types/quote.js";
import type { Step } from "../types/step.js";
import type { WhiskErrorCategory, WhiskErrorCode } from "../errors/errors.js";
import { WhiskError } from "../errors/errors.js";
import type { StepName } from "../types/step.js";
import type { WhiskMode } from "../types/config.js";

/**
 * The wallet ecosystem the snapshot belongs to. Mirrors
 * `WhiskAdapter["kind"]` from the React package without taking a
 * dependency on it.
 */
export type WalletKind = "evm" | "solana";

/** TTL after which a saved snapshot is considered stale and cleared. */
export const INFLIGHT_TTL_MS = 48 * 60 * 60 * 1000; // 48h

/** Bump this when the snapshot shape changes incompatibly. */
const SNAPSHOT_VERSION = 1;

/** localStorage prefix. Public so consumers can clear all whisk state if needed. */
export const STORAGE_PREFIX = "whisk:inflight:";

/**
 * The serialised error fields we keep on the snapshot. Reconstructed
 * into a `WhiskError` on hydrate — losing the original `cause` (which
 * may be a non-serialisable App Kit error) but preserving everything
 * UI surfaces and `engine.retry()` reads.
 */
type SerializedError = {
  name: string;
  message: string;
  code: WhiskErrorCode;
  retryable: boolean;
  category?: WhiskErrorCategory;
  step?: StepName;
};

export type InflightSnapshot = {
  /** Schema version. Mismatched values are treated as no snapshot. */
  version: typeof SNAPSHOT_VERSION;
  /**
   * Operational mode the snapshot was captured under. Resurrection
   * requires the current mode to match — testnet recoveries can't
   * surface in a mainnet config (and vice versa). Belt-and-braces
   * against the consumer flipping a config flag and accidentally
   * routing a testnet retry to mainnet.
   */
  mode: WhiskMode;
  walletKind: WalletKind;
  walletAddress: string;
  sourceChain: string;
  destinationChain: string;
  quote: Quote;
  steps: Step[];
  error: SerializedError;
  /**
   * App Kit's original `BridgeResult`. Required for `engine.retry()` to
   * resume via `kit.retryBridge`. Carried as `unknown` so the core
   * package doesn't depend on App Kit's types directly.
   */
  raw: unknown;
  /** `Date.now()` at save time. */
  savedAt: number;
  /** `savedAt + INFLIGHT_TTL_MS`. Snapshots past this are discarded. */
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

/**
 * Best-effort access to localStorage. SSR safe (returns null on
 * server), private-browsing safe (returns null when `localStorage`
 * throws on read/write).
 */
function getStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    // Touch localStorage in a way that throws if blocked rather than
    // returning a no-op object (Safari private mode does this).
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
  // We reconstruct as a base WhiskError rather than trying to match
  // the original subclass — the UI only reads `message` / `code` /
  // `category` / `retryable`, and the retry path doesn't switch on
  // subclass either.
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

/**
 * Persist a mid-flight failure so a refresh can recover.
 *
 * Returns `true` on success, `false` if localStorage isn't available
 * (SSR, private browsing) or the snapshot couldn't be serialised. A
 * `false` return is non-fatal — the current session still has the
 * failure in memory; only cross-refresh recovery is lost.
 */
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
    // Serialize first so a circular `raw` throws synchronously rather
    // than corrupting storage with a half-written entry.
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

/**
 * Load and return the snapshot for this wallet + source chain if one
 * exists, isn't expired, and was written with a known version. Stale
 * or malformed entries are auto-cleared so they don't pile up.
 */
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
    // Mode mismatch is a hard reject. Should be impossible because
    // the key already includes mode, but defend against a future
    // refactor that reads keys some other way.
    if (snapshot.mode !== mode) {
      return null;
    }
    // Belt-and-braces: require the fields the retry path actually
    // reads. A snapshot missing `raw` or `steps` is useless.
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

/** Clear the snapshot for a specific (mode, wallet, source) tuple. */
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
    // ignore
  }
}

/**
 * Return every non-expired snapshot in storage. Useful for a "you have
 * N pending recoveries" surface, or for cleaning up stale entries on
 * app boot.
 */
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
      // ignore
    }
  }
  return out;
}
