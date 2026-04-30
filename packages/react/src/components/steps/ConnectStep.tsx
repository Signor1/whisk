"use client";

import { Wallet } from "lucide-react";
import { useConnect } from "wagmi";
import { Button } from "../ui/Button.js";

/**
 * Pre-connect step. Lists every wagmi connector configured by `evm()`
 * with a single "connect" button per option. We don't pull in
 * RainbowKit / ConnectKit because we want the bundle small; the native
 * connector list is plenty for v0.1.
 */
export function ConnectStep() {
  const { connectors, connect, status, error } = useConnect();
  const isPending = status === "pending";

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

      <div
        style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
      >
        {connectors.map((connector) => (
          <Button
            key={connector.uid}
            variant="outline"
            onClick={() => connect({ connector })}
            disabled={isPending}
            style={{ justifyContent: "space-between" }}
          >
            <span>{connector.name}</span>
            {isPending ? <span className="whisk-spinner" /> : null}
          </Button>
        ))}
      </div>

      {error ? (
        <div className="whisk-help whisk-help--error">{error.message}</div>
      ) : null}
    </div>
  );
}
