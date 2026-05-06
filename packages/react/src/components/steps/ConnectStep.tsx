"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { useConnect } from "wagmi";
import { useWallet, type Wallet as SolanaWallet } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";
import { Button } from "../ui/Button.js";

/**
 * Pre-connect step. Lists every wagmi connector (EVM) and every
 * Solana wallet-adapter wallet the host has configured / the Wallet
 * Standard auto-discovered (Phantom, Solflare, Backpack, ...).
 *
 * One button per option. We don't pull in RainbowKit / ConnectKit /
 * @solana/wallet-adapter-react-ui because we want the bundle small —
 * a flat list is plenty.
 */
export function ConnectStep() {
  const { connectors, connect, status, error } = useConnect();

  // Solana wallet-adapter context — try/catch in case `solana()` isn't
  // in the Whisk config (no ConnectionProvider mounted).
  let solana: ReturnType<typeof useWallet> | undefined;
  try {
    solana = useWallet();
  } catch {
    solana = undefined;
  }

  const [pendingSolana, setPendingSolana] = useState<WalletName | null>(null);
  const evmPending = status === "pending";
  const isPending = evmPending || pendingSolana !== null;

  // After `select()`, the wallet context populates `wallet`; we then
  // call `connect()`. Splitting them keeps select/connect race-free.
  useEffect(() => {
    if (!solana || !pendingSolana) return;
    if (solana.wallet?.adapter.name !== pendingSolana) return;
    if (solana.connecting || solana.connected) return;
    void solana
      .connect()
      .catch(() => {})
      .finally(() => setPendingSolana(null));
  }, [solana, pendingSolana]);

  const onSolana = (w: SolanaWallet) => {
    if (!solana) return;
    setPendingSolana(w.adapter.name);
    solana.select(w.adapter.name);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      <header>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.25rem",
          }}
        >
          <Wallet size={18} strokeWidth={2} />
          <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600 }}>
            Connect a wallet
          </h2>
        </div>
        <p
          className="whisk-help"
          style={{ marginTop: "0.125rem", marginBottom: 0 }}
        >
          Pick a wallet to send and bridge USDC. Whisk never holds your keys.
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {connectors.map((connector) => (
          <Button
            key={connector.uid}
            variant="outline"
            onClick={() => connect({ connector })}
            disabled={isPending}
            style={{ justifyContent: "space-between" }}
          >
            <span>{connector.name}</span>
            {evmPending ? <span className="whisk-spinner" /> : null}
          </Button>
        ))}

        {solana?.wallets?.map((w) => {
          const installed = w.readyState === "Installed";
          const thisPending = pendingSolana === w.adapter.name;
          return (
            <Button
              key={w.adapter.name}
              variant="outline"
              onClick={() => onSolana(w)}
              disabled={isPending || !installed}
              style={{ justifyContent: "space-between" }}
              title={installed ? undefined : `${w.adapter.name} not installed`}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                {w.adapter.icon ? (
                  // The wallet adapter's icon is a base64 SVG / PNG URL.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={w.adapter.icon}
                    alt=""
                    width={16}
                    height={16}
                    style={{ borderRadius: "0.25rem" }}
                  />
                ) : null}
                {w.adapter.name}
                <span
                  style={{
                    fontSize: "0.625rem",
                    color: "var(--whisk-fg-muted)",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  Solana
                </span>
              </span>
              {thisPending ? <span className="whisk-spinner" /> : null}
            </Button>
          );
        })}
      </div>

      {error ? (
        <div className="whisk-help whisk-help--error">{error.message}</div>
      ) : null}
    </div>
  );
}
