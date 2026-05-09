"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Wallet, X } from "lucide-react";
import { useAccount, useConnect, type Connector } from "wagmi";
import { type Wallet as SolanaWallet } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";
import { Button } from "./Button.js";
import { safeUseWallet } from "../../hooks/internal/safeSolana.js";

export type ConnectModalProps = {
  /** Controls visibility. */
  open: boolean;
  /** Called when the dialog requests close (X click, ESC, outside click). */
  onOpenChange: (open: boolean) => void;
};

/**
 * Wallet selection modal — Radix Dialog hosting the connector list.
 *
 * Pattern is the one Reown / RainbowKit / ConnectKit settled on: a
 * single "Connect Wallet" CTA on the page, click → modal lists every
 * available wallet (EVM connectors + Solana Wallet-Standard wallets),
 * click a wallet → wagmi / wallet-adapter handle the actual handshake.
 *
 * Auto-closes on successful connection so the host UI doesn't have to
 * track the status separately.
 */
export function ConnectModal({ open, onOpenChange }: ConnectModalProps) {
  const { connectors, connect, status, error } = useConnect();
  const { isConnected: evmConnected } = useAccount();

  // Returns `undefined` when `solana()` isn't in the Whisk config (no
  // WalletProvider mounted). Wrapping the property reads via `safeUseWallet`
  // is the only reliable way — wallet-adapter's default context is a
  // sentinel whose property *getters* throw, so a try/catch around the
  // hook call doesn't help.
  const solana = safeUseWallet();

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

  // Auto-close on successful connection. The host doesn't need to wire
  // an effect to dismiss the modal — once a wallet returns, we drop.
  useEffect(() => {
    if (open && (evmConnected || solana?.connected)) {
      onOpenChange(false);
    }
  }, [evmConnected, solana?.connected, open, onOpenChange]);

  const onSolana = (w: SolanaWallet) => {
    if (!solana) return;
    setPendingSolana(w.adapter.name);
    solana.select(w.adapter.name);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/*
         * Radix portals render outside the WhiskProvider scope, which means
         * `[data-whisk]` styles wouldn't reach the modal. We re-establish
         * the scope here so the same CSS variables and component rules
         * apply to dialog content.
         */}
        <div data-whisk="">
          <Dialog.Overlay className="whisk-dialog__overlay" />
          <Dialog.Content
            className="whisk-dialog__content"
            aria-describedby={undefined}
          >
            <header className="whisk-dialog__header">
              <div className="whisk-dialog__title-wrap">
                <Wallet size={18} strokeWidth={2} />
                <Dialog.Title className="whisk-dialog__title">
                  Connect a wallet
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="whisk-dialog__close"
                  aria-label="Close"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </Dialog.Close>
            </header>

            <p className="whisk-help whisk-dialog__lede">
              Whisk never holds your keys. Connect to send, bridge or swap
              USDC across the chains your dev configured.
            </p>

            <div className="whisk-dialog__list">
              {connectors.map((c) => (
                <ConnectorButton
                  key={c.uid}
                  connector={c}
                  pending={evmPending}
                  disabled={isPending}
                  onConnect={() => connect({ connector: c })}
                />
              ))}

              {solana?.wallets?.map((w) => {
                const installed = w.readyState === "Installed";
                const thisPending = pendingSolana === w.adapter.name;
                return (
                  <Button
                    key={w.adapter.name}
                    variant="outline"
                    className="whisk-dialog__row"
                    onClick={() => onSolana(w)}
                    disabled={isPending || !installed}
                    title={
                      installed ? undefined : `${w.adapter.name} not installed`
                    }
                  >
                    <span className="whisk-dialog__row-main">
                      {w.adapter.icon ? (
                        // The wallet adapter's icon is a base64 SVG / PNG URL.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={w.adapter.icon}
                          alt=""
                          width={20}
                          height={20}
                          className="whisk-dialog__row-icon"
                        />
                      ) : null}
                      <span className="whisk-dialog__row-name">
                        {w.adapter.name}
                      </span>
                      <span className="whisk-dialog__row-tag">Solana</span>
                    </span>
                    {thisPending ? (
                      <span className="whisk-spinner" />
                    ) : !installed ? (
                      <span className="whisk-dialog__row-meta">
                        Not installed
                      </span>
                    ) : null}
                  </Button>
                );
              })}
            </div>

            {error ? (
              <div className="whisk-help whisk-help--error">
                {error.message}
              </div>
            ) : null}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ConnectorButton({
  connector,
  pending,
  disabled,
  onConnect,
}: {
  connector: Connector;
  pending: boolean;
  disabled: boolean;
  onConnect: () => void;
}) {
  return (
    <Button
      variant="outline"
      className="whisk-dialog__row"
      onClick={onConnect}
      disabled={disabled}
    >
      <span className="whisk-dialog__row-main">
        {connector.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={connector.icon}
            alt=""
            width={20}
            height={20}
            className="whisk-dialog__row-icon"
          />
        ) : null}
        <span className="whisk-dialog__row-name">{connector.name}</span>
      </span>
      {pending ? <span className="whisk-spinner" /> : null}
    </Button>
  );
}
