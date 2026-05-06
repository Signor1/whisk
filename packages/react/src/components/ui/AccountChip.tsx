"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Copy, ExternalLink, LogOut } from "lucide-react";
import {
  explorerAddressUrl,
  type Chain,
} from "@strimz/whisk-core";
import { useWhiskAccount } from "../../hooks/useWhiskAccount.js";

function shorten(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Connected-wallet chip rendered at the top of the card. Click opens a
 * small menu with the connector name, "copy address", "view on explorer",
 * and "disconnect."
 */
export function AccountChip({
  /** Chain used for the explorer link in the menu. Defaults to current. */
  explorerChain,
}: {
  explorerChain?: Chain;
}) {
  const account = useWhiskAccount();
  const primary = account.primary;
  const address = primary?.address;
  const connectorName = primary?.connectorName;
  const currentChain = primary?.currentChain;
  const disconnect = primary?.disconnect ?? (async () => {});
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Click-outside dismiss.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!address) return null;

  const linkChain = explorerChain ?? currentChain;
  const explorer = linkChain
    ? explorerAddressUrl(linkChain, address)
    : undefined;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      // ignore — host can wire a toast via `onAccountAction` later
    }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="whisk-account-chip"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="whisk-account-chip__avatar" aria-hidden="true" />
        <span className="whisk-account-chip__address">{shorten(address)}</span>
        <ChevronDown size={12} strokeWidth={2.5} style={{ opacity: 0.6 }} />
      </button>
      {open ? (
        <div className="whisk-account-menu" role="menu">
          {connectorName ? (
            <div className="whisk-account-menu__meta">
              Connected via {connectorName}
            </div>
          ) : null}
          <button
            type="button"
            className="whisk-account-menu__row"
            onClick={() => {
              void onCopy();
              setOpen(false);
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <Copy size={12} strokeWidth={2} />
              Copy address
            </span>
          </button>
          {explorer ? (
            <a
              className="whisk-account-menu__row"
              role="menuitem"
              href={explorer}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "none" }}
              onClick={() => setOpen(false)}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                <ExternalLink size={12} strokeWidth={2} />
                View on explorer
              </span>
            </a>
          ) : null}
          <button
            type="button"
            className="whisk-account-menu__row"
            onClick={() => {
              void disconnect();
              setOpen(false);
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--whisk-destructive)" }}>
              <LogOut size={12} strokeWidth={2} />
              Disconnect
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Read-only network pill — shows the chain the wallet is currently on.
 * Pairs with `AccountChip` in the card header.
 */
export function NetworkPill() {
  const account = useWhiskAccount();
  const primary = account.primary;
  const chainName = primary?.chainName;
  const currentChain = primary?.currentChain;
  if (!chainName) return null;
  return (
    <span
      className="whisk-network-pill"
      data-whisk-chain={currentChain}
      title={`Wallet network: ${chainName}`}
    >
      <span className="whisk-network-pill__dot" aria-hidden="true" />
      {chainName}
    </span>
  );
}
