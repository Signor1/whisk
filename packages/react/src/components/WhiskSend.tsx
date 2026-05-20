"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import type { Chain, Quote, Token, WhiskState } from "@signordev/whisk-core";
import type { SwapState } from "../hooks/useWhiskSwap.js";
import { useWhisk } from "../hooks/useWhisk.js";
import { useWhiskContext } from "../hooks/useWhiskContext.js";
import { useManualMint } from "../hooks/useManualMint.js";
import { usePreflight } from "../hooks/usePreflight.js";
import { useTabLock } from "../hooks/useTabLock.js";
import { Badge } from "./ui/Badge.js";
import { FlaskConical } from "lucide-react";
import { AccountChip, NetworkPill } from "./ui/AccountChip.js";
import { Card } from "./ui/Card.js";
import { Footer } from "./ui/Footer.js";
import {
  ConnectStep,
  InputStep,
  ReviewStep,
  SendingStep,
  ResultStep,
} from "./steps/index.js";
import { SwapTab } from "./swap/SwapTab.js";

export type WhiskSendTab = "transfer" | "swap";

export type WhiskSendProps = {
  onSuccess?: (result: { quote: Quote; finalTxHash?: string }) => void;
  onError?: (error: Error) => void;
  onStateChange?: (state: WhiskState) => void;

  onSwapSuccess?: (result: {
    txHash?: string;
    explorerUrl?: string;
    amountOut?: string;
  }) => void;
  onSwapError?: (error: Error) => void;
  onSwapStateChange?: (state: SwapState) => void;

  // Setting any of these locks the corresponding field.
  amount?: string;
  recipient?: string;
  sourceChain?: Chain;
  destinationChain?: Chain;

  defaultAmount?: string;
  defaultRecipient?: string;

  onAmountChange?: (value: string) => void;
  onRecipientChange?: (value: string) => void;
  onSourceChainChange?: (chain: Chain) => void;
  onDestinationChainChange?: (chain: Chain) => void;

  /** Defaults to `["transfer", "swap"]` when `kitKey` is set, else `["transfer"]`. */
  tabs?: WhiskSendTab[];
  defaultTab?: WhiskSendTab;
  /** Circle Console key. Swap tab is hidden when omitted. */
  kitKey?: string;
  swapDefaultChain?: Chain;
  swapDefaultTokenIn?: Token;
  swapDefaultTokenOut?: Token;

  /** @default false */
  showFooter?: boolean;
  className?: string;
};

export function WhiskSend({
  onSuccess,
  onError,
  onStateChange,
  onSwapSuccess,
  onSwapError,
  onSwapStateChange,
  amount,
  recipient,
  sourceChain,
  destinationChain,
  defaultAmount,
  defaultRecipient,
  onAmountChange,
  onRecipientChange,
  onSourceChainChange,
  onDestinationChainChange,
  tabs,
  defaultTab,
  kitKey,
  swapDefaultChain,
  swapDefaultTokenIn,
  swapDefaultTokenOut,
  showFooter = false,
  className,
}: WhiskSendProps) {
  const { state, actions, connected, address } = useWhisk();
  const { engine } = useWhiskContext();
  const { manualMint } = useManualMint();
  const mode = engine.config.mode ?? "testnet";

  const reviewQuote = state.kind === "review" ? state.quote : undefined;
  const preflight = usePreflight(reviewQuote, address);

  const sendingRoute =
    state.kind === "review"
      ? state.quote.route
      : state.kind === "sending"
        ? state.quote.route
        : undefined;
  const sendingSource =
    sendingRoute?.kind === "send"
      ? sendingRoute.chain
      : sendingRoute?.kind === "bridge"
        ? sendingRoute.sourceChain
        : undefined;
  const lockScope =
    address && sendingSource ? `${address}:${sendingSource}` : undefined;
  const tabLock = useTabLock(lockScope);

  const guardedSend = useCallback(async () => {
    if (!tabLock.acquire()) return;
    await actions.send();
  }, [tabLock, actions]);

  const wasSendingRef = useRef(false);
  useEffect(() => {
    if (state.kind === "sending") {
      wasSendingRef.current = true;
    } else if (wasSendingRef.current) {
      wasSendingRef.current = false;
      tabLock.release();
    }
  }, [state.kind, tabLock]);

  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  useEffect(() => {
    if (state.kind === "succeeded") {
      onSuccess?.({
        quote: state.quote,
        finalTxHash: state.finalTxHash,
      });
    } else if (state.kind === "failed") {
      onError?.(state.error);
    }
  }, [state, onSuccess, onError]);

  // Auto-resolve when `recipient` is host-pinned, so the user doesn't have to click Continue.
  const autoResolvedRef = useRef(false);
  useEffect(() => {
    if (!connected) return;
    if (autoResolvedRef.current) return;
    if (state.kind !== "idle") return;
    if (!recipient) return;
    autoResolvedRef.current = true;
    const target = destinationChain ?? sourceChain ?? undefined;
    if (target) {
      void actions.resolve(recipient, target);
    }
  }, [
    connected,
    state.kind,
    recipient,
    destinationChain,
    sourceChain,
    actions,
  ]);

  const visibleTabs: WhiskSendTab[] =
    tabs ?? (kitKey ? ["transfer", "swap"] : ["transfer"]);
  const showTabs = visibleTabs.length > 1;
  const initialTab: WhiskSendTab = defaultTab ?? visibleTabs[0] ?? "transfer";

  const transferContent = renderTransfer(
    state,
    actions,
    connected,
    manualMint,
    preflight,
    tabLock.isLockedByOther,
    guardedSend,
    {
      amount,
      recipient,
      sourceChain,
      destinationChain,
      defaultAmount,
      defaultRecipient,
      onAmountChange,
      onRecipientChange,
      onSourceChainChange,
      onDestinationChainChange,
    },
  );

  const swapContent = (
    <SwapTab
      kitKey={kitKey}
      defaultChain={swapDefaultChain}
      defaultTokenIn={swapDefaultTokenIn}
      defaultTokenOut={swapDefaultTokenOut}
      onStateChange={onSwapStateChange}
      onSuccess={onSwapSuccess}
      onError={onSwapError}
    />
  );

  return (
    <Card
      className={className}
      style={{
        maxWidth: "26rem",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      {/* Mainnet renders no pill on purpose — absence is the signal that real money is moving. */}
      {mode === "testnet" ? (
        <div className="whisk-mode-row" aria-label="Mode: testnet">
          <Badge variant="warning">
            <FlaskConical size={11} strokeWidth={2.5} />
            Testnet
          </Badge>
        </div>
      ) : null}

      {connected && state.kind !== "disconnected" ? (
        <div className="whisk-account-row">
          <NetworkPill />
          <AccountChip explorerChain={sourceChain} />
        </div>
      ) : null}

      {showTabs ? (
        <Tabs.Root defaultValue={initialTab} className="whisk-tabs">
          <Tabs.List className="whisk-tabs__list" aria-label="Whisk operations">
            {visibleTabs.includes("transfer") ? (
              <Tabs.Trigger value="transfer" className="whisk-tabs__trigger">
                Transfer
              </Tabs.Trigger>
            ) : null}
            {visibleTabs.includes("swap") ? (
              <Tabs.Trigger value="swap" className="whisk-tabs__trigger">
                Swap
              </Tabs.Trigger>
            ) : null}
          </Tabs.List>
          {visibleTabs.includes("transfer") ? (
            <Tabs.Content value="transfer" className="whisk-tabs__content">
              {transferContent}
            </Tabs.Content>
          ) : null}
          {visibleTabs.includes("swap") ? (
            <Tabs.Content value="swap" className="whisk-tabs__content">
              {swapContent}
            </Tabs.Content>
          ) : null}
        </Tabs.Root>
      ) : visibleTabs[0] === "swap" ? (
        swapContent
      ) : (
        transferContent
      )}

      {showFooter ? <Footer /> : null}
    </Card>
  );
}

type ControlledFieldProps = Pick<
  WhiskSendProps,
  | "amount"
  | "recipient"
  | "sourceChain"
  | "destinationChain"
  | "defaultAmount"
  | "defaultRecipient"
  | "onAmountChange"
  | "onRecipientChange"
  | "onSourceChainChange"
  | "onDestinationChainChange"
>;

function renderTransfer(
  state: WhiskState,
  actions: ReturnType<typeof useWhisk>["actions"],
  connected: boolean,
  manualMint: ReturnType<typeof useManualMint>["manualMint"],
  preflight: ReturnType<typeof usePreflight>,
  tabLockedByOther: boolean,
  guardedSend: () => Promise<void>,
  fields: ControlledFieldProps,
): ReactNode {
  if (!connected || state.kind === "disconnected") {
    return <ConnectStep />;
  }

  switch (state.kind) {
    case "idle":
      return (
        <InputStep
          busy={false}
          onResolve={actions.resolve}
          onQuote={actions.quote}
          {...fields}
        />
      );
    case "resolving":
      return (
        <InputStep
          busy
          onResolve={actions.resolve}
          onQuote={actions.quote}
          {...fields}
        />
      );
    case "resolved":
      return (
        <InputStep
          busy={false}
          resolvedRecipient={state.recipient}
          onResolve={actions.resolve}
          onQuote={actions.quote}
          {...fields}
        />
      );
    case "quoting":
      return (
        <InputStep
          busy
          resolvedRecipient={state.recipient}
          onResolve={actions.resolve}
          onQuote={actions.quote}
          {...fields}
        />
      );
    case "review":
      return (
        <ReviewStep
          quote={state.quote}
          busy={false}
          onConfirm={guardedSend}
          onBack={actions.back}
          preflight={preflight}
          tabLockedByOther={tabLockedByOther}
        />
      );
    case "sending":
      return <SendingStep steps={state.steps} activeStep={state.currentStep} />;
    case "succeeded":
      return (
        <ResultStep
          kind="success"
          quote={state.quote}
          steps={state.steps}
          finalTxHash={state.finalTxHash}
          onReset={actions.reset}
        />
      );
    case "failed": {
      // Mid-flight: burn ok, mint pending. `raw` is set only on bridge failures
      // (same-chain sends leave it undefined, which naturally excludes them).
      const steps = state.steps ?? [];
      const burnStep = steps.find(
        (s) => s.name === "burn" && s.state === "success",
      );
      const mintedAlready = steps.some(
        (s) => s.name === "mint" && s.state === "success",
      );
      const canRetry =
        Boolean(burnStep) && !mintedAlready && state.raw !== undefined;

      // Direct MessageTransmitter path — last-resort escape hatch when retry keeps failing.
      const route = state.quote?.route;
      const sourceChain =
        route?.kind === "bridge" ? route.sourceChain : undefined;
      const destinationChain =
        route?.kind === "bridge" ? route.destinationChain : undefined;
      const canManualMint =
        canRetry &&
        burnStep?.txHash !== undefined &&
        sourceChain !== undefined &&
        destinationChain !== undefined;

      const onManualMint = canManualMint
        ? () =>
            manualMint({
              destinationChain: destinationChain!,
              burnSourceChain: sourceChain!,
              burnTxHash: burnStep!.txHash!,
            })
        : undefined;

      return (
        <ResultStep
          kind="failure"
          error={state.error}
          steps={state.steps}
          onReset={actions.reset}
          onRetry={canRetry ? actions.retry : undefined}
          onManualMint={onManualMint}
        />
      );
    }
    default: {
      const _: never = state;
      return null;
    }
  }
}
