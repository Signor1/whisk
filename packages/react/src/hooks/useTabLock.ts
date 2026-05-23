"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Advisory cross-tab lock via `BroadcastChannel`. Falls back to a no-op
 * on SSR or browsers without `BroadcastChannel`.
 */
export type TabLockOptions = {
  channelName?: string;
  /** Default 3000. */
  heartbeatMs?: number;
  /** Default 15000 — five missed heartbeats. */
  staleAfterMs?: number;
};

export type TabLock = {
  acquire: () => boolean;
  release: () => void;
  isLockedByOther: boolean;
  tabId: string;
};

type LockMessage =
  | { type: "HELD"; scope: string; tabId: string; at: number }
  | { type: "RELEASE"; scope: string; tabId: string };

/** `scope` should be `${walletKind}:${address}:${sourceChain}`. Pass `undefined` to no-op. */
export function useTabLock(
  scope: string | undefined,
  options: TabLockOptions = {},
): TabLock {
  const channelName = options.channelName ?? "whisk-tab-lock";
  const heartbeatMs = options.heartbeatMs ?? 3000;
  const staleAfterMs = options.staleAfterMs ?? 15000;

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof BroadcastChannel === "undefined") return;
    if (!scope) return;

    const ch = new BroadcastChannel(channelName);
    channelRef.current = ch;

    const onMessage = (evt: MessageEvent<LockMessage>) => {
      const msg = evt.data;
      if (!msg || msg.scope !== scope) return;
      if (msg.tabId === tabId) return;

      if (msg.type === "HELD") {
        lastForeignSeen.current = { at: msg.at, tabId: msg.tabId };
        setIsLockedByOther(true);
      } else if (msg.type === "RELEASE") {
        if (lastForeignSeen.current?.tabId === msg.tabId) {
          lastForeignSeen.current = null;
          setIsLockedByOther(false);
        }
      }
    };
    ch.addEventListener("message", onMessage);

    // Stale sweep — a hard tab close mid-send would otherwise orphan the lock forever.
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

  const acquire = useCallback((): boolean => {
    if (!scope) return true;
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

  // Release on unmount so an interrupted send doesn't orphan the lock.
  useEffect(() => {
    return () => {
      if (holdingRef.current) {
        release();
      }
    };
  }, [release]);

  return { acquire, release, isLockedByOther, tabId };
}
