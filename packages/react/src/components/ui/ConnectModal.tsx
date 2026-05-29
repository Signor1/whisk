"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ChevronRight, Wallet, X } from "lucide-react";
import { useAccount, useConnect, type Connector } from "wagmi";
import { type Wallet as SolanaWallet } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";
import { toWhiskError } from "@usewhisk/core";
import { Button } from "./Button.js";
import { WhiskScope } from "./WhiskScope.js";
import { safeUseWallet } from "../../hooks/internal/safeSolana.js";
import { useWhiskContext } from "../../hooks/useWhiskContext.js";

export type ConnectModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Ecosystem = "evm" | "solana";

export function ConnectModal({ open, onOpenChange }: ConnectModalProps) {
  const { config } = useWhiskContext();
  const { connectors, connect, status, error } = useConnect();
  const { isConnected: evmConnected } = useAccount();
  const solana = safeUseWallet();

  // Ecosystems this widget was configured for. Drives both the picker and the
  // auto-skip-when-only-one rule.
  const ecosystems = useMemo<Ecosystem[]>(() => {
    const out: Ecosystem[] = [];
    if (config.wallets.some((w) => w.kind === "evm")) out.push("evm");
    if (config.wallets.some((w) => w.kind === "solana")) out.push("solana");
    return out;
  }, [config.wallets]);

  const initialEco: Ecosystem | "pick" =
    ecosystems.length === 1 ? ecosystems[0]! : "pick";
  const [step, setStep] = useState<Ecosystem | "pick">(initialEco);

  // Reset the step whenever the modal closes so a re-open starts from scratch.
  useEffect(() => {
    if (!open) setStep(initialEco);
  }, [open, initialEco]);

  const [pendingSolana, setPendingSolana] = useState<WalletName | null>(null);
  const [solanaError, setSolanaError] = useState<string | null>(null);
  const evmPending = status === "pending";
  const isPending = evmPending || pendingSolana !== null;

  // After `select()`, the wallet context populates `wallet`; we then call `connect()`.
  useEffect(() => {
    if (!solana || !pendingSolana) return;
    if (solana.wallet?.adapter.name !== pendingSolana) return;
    if (solana.connecting || solana.connected) return;
    void solana
      .connect()
      .catch((err: unknown) => {
        setSolanaError(
          toWhiskError(err, "Solana wallet connect failed.").message,
        );
      })
      .finally(() => setPendingSolana(null));
  }, [solana, pendingSolana]);

  // Scope auto-close to the ecosystem the user picked. Otherwise wagmi's
  // auto-reconnect can fire `evmConnected` mid-Solana-flow and yank the modal
  // closed before the Solana adapter finishes.
  useEffect(() => {
    if (!open) return;
    const finished =
      step === "evm"
        ? evmConnected
        : step === "solana"
          ? solana?.connected
          : evmConnected || solana?.connected;
    if (finished) onOpenChange(false);
  }, [step, evmConnected, solana?.connected, open, onOpenChange]);

  // Clear Solana error when the user picks a different wallet or backs out.
  useEffect(() => {
    setSolanaError(null);
  }, [step, pendingSolana]);

  const onSolana = (w: SolanaWallet) => {
    if (!solana) return;
    setSolanaError(null);
    setPendingSolana(w.adapter.name);
    solana.select(w.adapter.name);
  };

  const canGoBack = step !== "pick" && ecosystems.length > 1;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <WhiskScope>
          <Dialog.Overlay className="whisk-dialog__overlay" />
          <Dialog.Content
            className="whisk-dialog__content"
            aria-describedby={undefined}
          >
            <header className="whisk-dialog__header">
              <div className="whisk-dialog__title-wrap">
                {canGoBack ? (
                  <button
                    type="button"
                    className="whisk-dialog__back"
                    onClick={() => setStep("pick")}
                    aria-label="Back to ecosystem picker"
                  >
                    <ArrowLeft size={14} strokeWidth={2.5} />
                  </button>
                ) : (
                  <Wallet size={18} strokeWidth={2} />
                )}
                <Dialog.Title className="whisk-dialog__title">
                  {step === "pick"
                    ? "Connect a wallet"
                    : step === "evm"
                      ? "EVM wallets"
                      : "Solana wallets"}
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

            {step === "pick" ? (
              <>
                <p className="whisk-help whisk-dialog__lede">
                  Pick the ecosystem you want to connect to. Whisk never holds
                  your keys.
                </p>
                <div className="whisk-dialog__eco-grid">
                  {ecosystems.includes("evm") ? (
                    <EcosystemCard
                      label="EVM"
                      description="Ethereum, Base, Arbitrum, Polygon, and more"
                      onClick={() => setStep("evm")}
                    />
                  ) : null}
                  {ecosystems.includes("solana") ? (
                    <EcosystemCard
                      label="Solana"
                      description="Phantom, Solflare, Backpack"
                      onClick={() => setStep("solana")}
                    />
                  ) : null}
                </div>
              </>
            ) : step === "evm" ? (
              <>
                <p className="whisk-help whisk-dialog__lede">
                  Choose an EVM wallet to connect.
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
                </div>
              </>
            ) : (
              <>
                <p className="whisk-help whisk-dialog__lede">
                  Choose a Solana wallet to connect.
                </p>
                <div className="whisk-dialog__list">
                  {solana?.wallets?.length ? (
                    solana.wallets.map((w) => {
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
                            installed
                              ? undefined
                              : `${w.adapter.name} not installed`
                          }
                        >
                          <span className="whisk-dialog__row-main">
                            {w.adapter.icon ? (
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
                    })
                  ) : (
                    <p className="whisk-help whisk-help--error">
                      No Solana wallets detected. Install Phantom, Solflare, or
                      Backpack and refresh.
                    </p>
                  )}
                </div>
              </>
            )}

            {step === "evm" && error ? (
              <div className="whisk-help whisk-help--error">
                {toWhiskError(error).message}
              </div>
            ) : null}
            {step === "solana" && solanaError ? (
              <div className="whisk-help whisk-help--error">{solanaError}</div>
            ) : null}
          </Dialog.Content>
        </WhiskScope>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function EcosystemCard({
  label,
  description,
  onClick,
}: {
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="whisk-dialog__eco-card" onClick={onClick}>
      <span className="whisk-dialog__eco-label">{label}</span>
      <span className="whisk-dialog__eco-desc">{description}</span>
      <ChevronRight
        size={14}
        strokeWidth={2.5}
        className="whisk-dialog__eco-chev"
      />
    </button>
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
