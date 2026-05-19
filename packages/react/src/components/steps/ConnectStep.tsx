"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "../ui/Button.js";
import { ConnectModal } from "../ui/ConnectModal.js";

/**
 * Pre-connect surface. Shows a single, focused "Connect Wallet" CTA;
 * clicking opens the `ConnectModal` (Radix Dialog) with the actual
 * wallet list. The Reown / RainbowKit / ConnectKit shape — one entry
 * point, modal handles the choice. Putting wallet buttons inline floods
 * the user with options before they've engaged.
 */
export function ConnectStep() {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.875rem",
        alignItems: "stretch",
        textAlign: "center",
      }}
    >
      <header
        style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            marginBottom: "0.125rem",
          }}
        >
          <Wallet size={18} strokeWidth={2} />
          <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600 }}>
            Connect to continue
          </h2>
        </div>
        <p className="whisk-help" style={{ margin: 0 }}>
          Send, bridge, or swap USDC across the chains your dev configured.
          Whisk never holds your keys.
        </p>
      </header>

      <Button variant="primary" onClick={() => setOpen(true)}>
        Connect wallet
      </Button>

      <ConnectModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
