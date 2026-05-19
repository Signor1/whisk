"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cross-tab coordination to prevent accidental double-burns when a
 * user has Whisk open in more than one tab on the same wallet.
 *
 * Uses the browser-native `BroadcastChannel` API to advertise an
 * active send across tabs. While one tab holds the lock for a given
 * `(walletAddress, sourceChain)` scope, every other tab's Whisk
 * widget disables its Send button and shows "Active send in another
 * tab" so the user can't accidentally fire two CCTP burns from the
 * same address simultaneously.
 *
 * ## Why this matters for fund safety
 *
 * Two tabs racing the same wallet doesn't cause an on-chain
 * double-spend (nonces save us there), but it can cause:
 *   - Confusing UX where one tab claims success and another claims
 *     failure for txs that share a nonce
 *   - User signing two approvals in sequence, paying twice for gas
 *   - Persistence layer (P1) restoring an in-flight snapshot in
 *     tab A while tab B is mid-burn
 *
 * The lock is *advisory* — it doesn't prevent the underlying wallet
 * from accepting two sign requests. It does ensure Whisk's UI in tab
 * B refuses to ask for one while tab A is asking.
 *
 * ## Lock lifecycle
 *
 * - `acquire()` — call before submitting. Broadcasts a HELD message
 *   and returns true on success. Returns false if another tab already
 *   holds the lock for this scope (caller should refuse to send).
 * - `release()` — call after success/failure/abort. Broadcasts a
 *   RELEASE and clears local state. Always call this in `finally`.
 * - `isLockedByOther` — true when *some other tab* holds the lock.
 *   The owning tab sees this as false (it knows it's the holder).
 *
 * ## SSR / unsupported browsers
 *
 * `BroadcastChannel` is widely supported (Chrome, Firefox, Safari,
 * Edge — all modern releases). On Node SSR or older browsers, the
 * hook degrades to a no-op: `acquire` always returns true,
 * `isLockedByOther` always returns false. Fund safety is only marginal
 * in those environments (no concurrent tabs to race anyway).
 */
export type TabLockOptions = {
  /**
   * Channel name. Defaults to `"whisk-tab-lock"`. Override if hosting
   * multiple Whisk instances in the same origin that shouldn't see
   * each other's locks.
   */
  channelName?: string;
  /**
   * Heartbeat interval (ms). The holder re-broadcasts HELD at this
   * cadence so newly-mounted tabs see the active lock even if they
   * missed the initial acquire. Defaults to 3000.
   */
  heartbeatMs?: number;
  /**
   * Stale timeout (ms). Locks last heard from longer than this are
   * presumed dead (tab crashed, network blip) and not enforced.
   * Defaults to 15000 — five missed heartbeats.
   */
  staleAfterMs?: number;
};

export type TabLock = {
  /**
   * Try to take the lock for `scope`. Returns true on success.
   * Returns false if another tab holds it — in that case the caller
   * MUST NOT submit, and should surface the `isLockedByOther` notice
   * to the user.
   */
  acquire: () => boolean;
  /** Release the lock. Idempotent. */
  release: () => void;
  /** True when *another* tab currently holds the lock for this scope. */
  isLockedByOther: boolean;
  /** Local tab ID — useful for debugging / telemetry. */
  tabId: string;
};

type LockMessage =
  | { type: "HELD"; scope: string; tabId: string; at: number }
  | { type: "RELEASE"; scope: string; tabId: string };

/**
 * Acquire a cross-tab lock for the given scope. `scope` should
 * uniquely identify the resource being locked — typically
 * `${walletKind}:${address}:${sourceChain}`. Pass `undefined` while
 * no scope is known yet (e.g. wallet not connected); the hook safely
 * no-ops.
 */
export function useTabLock(
  scope: string | undefined,
  options: TabLockOptions = {},
): TabLock {
  const channelName = options.channelName ?? "whisk-tab-lock";
  const heartbeatMs = options.heartbeatMs ?? 3000;
  const staleAfterMs = options.staleAfterMs ?? 15000;

  // Stable per-tab ID. Survives re-renders, distinct from other tabs.
  const tabIdRef = useRef<string | undefined>(undefined);
  if (!tabIdRef.current) {
    tabIdRef.current =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `tab-${Math.random().toString(36).slice(2, 10)}`;
  }
  const tabId = tabIdRef.current;

  const channelRef = useRef<BroadcastChannel | null>(null);
  const holdingRef = useRef<boolean>(false);
  const lastForeignSeen = useRef<{ at: number; tabId: string } | null>(null);

  const [isLockedByOther, setIsLockedByOther] = useState(false);

  /* ─── Channel setup ──────────────────────────────────────────────── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof BroadcastChannel === "undefined") return;
    if (!scope) return;

    const ch = new BroadcastChannel(channelName);
    channelRef.current = ch;

    const onMessage = (evt: MessageEvent<LockMessage>) => {
      const msg = evt.data;
      if (!msg || msg.scope !== scope) return;
      // Ignore our own broadcasts.
      if (msg.tabId === tabId) return;

      if (msg.type === "HELD") {
        lastForeignSeen.current = { at: msg.at, tabId: msg.tabId };
        setIsLockedByOther(true);
      } else if (msg.type === "RELEASE") {
        // Clear only if the releaser is the one we believed held it.
        if (lastForeignSeen.current?.tabId === msg.tabId) {
          lastForeignSeen.current = null;
          setIsLockedByOther(false);
        }
      }
    };
    ch.addEventListener("message", onMessage);

    // Stale-lock sweeper. If we haven't heard a heartbeat from the
    // holding tab in `staleAfterMs`, treat the lock as dead (the
    // holding tab probably crashed or was closed). Without this, a
    // hard tab close mid-send would leave every other tab thinking
    // the lock is permanent.
    const sweep = setInterval(
      () => {
        const seen = lastForeignSeen.current;
        if (seen && Date.now() - seen.at > staleAfterMs) {
          lastForeignSeen.current = null;
          setIsLockedByOther(false);
        }
      },
      Math.min(staleAfterMs / 3, 2000),
    );

    return () => {
      clearInterval(sweep);
      ch.removeEventListener("message", onMessage);
      ch.close();
      channelRef.current = null;
    };
  }, [channelName, scope, staleAfterMs, tabId]);

  /* ─── Heartbeat (only while holding) ─────────────────────────────── */
  useEffect(() => {
    if (!scope) return;
    if (typeof window === "undefined") return;
    const beat = setInterval(() => {
      if (holdingRef.current && channelRef.current) {
        const msg: LockMessage = {
          type: "HELD",
          scope,
          tabId,
          at: Date.now(),
        };
        channelRef.current.postMessage(msg);
      }
    }, heartbeatMs);
    return () => clearInterval(beat);
  }, [scope, heartbeatMs, tabId]);

  /* ─── API ────────────────────────────────────────────────────────── */
  const acquire = useCallback((): boolean => {
    if (!scope) return true; // no-op when no scope
    if (isLockedByOther) return false;
    holdingRef.current = true;
    const msg: LockMessage = {
      type: "HELD",
      scope,
      tabId,
      at: Date.now(),
    };
    channelRef.current?.postMessage(msg);
    return true;
  }, [scope, isLockedByOther, tabId]);

  const release = useCallback(() => {
    if (!scope) return;
    if (!holdingRef.current) return;
    holdingRef.current = false;
    const msg: LockMessage = { type: "RELEASE", scope, tabId };
    channelRef.current?.postMessage(msg);
  }, [scope, tabId]);

  // Release on unmount so a refresh / unmount mid-send doesn't strand
  // the lock and orphan all other tabs.
  useEffect(() => {
    return () => {
      if (holdingRef.current) {
        release();
      }
    };
  }, [release]);

  return { acquire, release, isLockedByOther, tabId };
}
