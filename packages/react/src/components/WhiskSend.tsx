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
  /* ─── Lifecycle callbacks ─────────────────────────────────────────── */

  /** Fires when a transfer completes successfully. */
  onSuccess?: (result: { quote: Quote; finalTxHash?: string }) => void;
  /** Fires when a transfer fails terminally. */
  onError?: (error: Error) => void;
  /** Fires for every transfer state-machine transition — useful for analytics. */
  onStateChange?: (state: WhiskState) => void;

  /**
   * Fires when a swap completes successfully. Only meaningful when the
   * Swap tab is enabled — Transfer-only widgets never invoke this.
   */
  onSwapSuccess?: (result: {
    txHash?: string;
    explorerUrl?: string;
    amountOut?: string;
  }) => void;
  /** Fires when a swap fails terminally. */
  onSwapError?: (error: Error) => void;
  /** Fires for every swap state-machine transition. */
  onSwapStateChange?: (state: SwapState) => void;

  /* ─── Controlled inputs (host app pins the value) ─────────────────── */

  /**
   * Lock the amount field. When set, user cannot edit. Use for
   * e-commerce checkout, fixed-price subscriptions, invoice payment,
   * etc. — anything where the host app derives the amount and the user
   * is just confirming the transfer.
   */
  amount?: string;
  /**
   * Lock the recipient field. When set, user cannot edit. Use for
   * merchant addresses, donation recipients, payroll vendor addresses,
   * etc.
   */
  recipient?: string;
  /** Lock the source chain selector. */
  sourceChain?: Chain;
  /** Lock the destination chain selector. */
  destinationChain?: Chain;

  /* ─── Uncontrolled defaults (initial value, user-editable) ────────── */

  /** Initial amount value; user can still edit unless `amount` is also set. */
  defaultAmount?: string;
  /** Initial recipient value; user can still edit unless `recipient` is set. */
  defaultRecipient?: string;

  /* ─── Reactive change callbacks ───────────────────────────────────── */

  onAmountChange?: (value: string) => void;
  onRecipientChange?: (value: string) => void;
  onSourceChainChange?: (chain: Chain) => void;
  onDestinationChainChange?: (chain: Chain) => void;

  /* ─── Tabs / Swap ─────────────────────────────────────────────────── */

  /**
   * Which tabs to render. Defaults to `["transfer", "swap"]` when
   * `kitKey` is supplied, otherwise just `["transfer"]`.
   */
  tabs?: WhiskSendTab[];
  /** Initial tab. Defaults to `"transfer"`. */
  defaultTab?: WhiskSendTab;
  /**
   * Required Circle Console kit key for swap operations. When omitted,
   * the Swap tab is hidden (or asks for a key inline if explicitly
   * included via `tabs`).
   */
  kitKey?: string;
  /** Pre-fill the swap chain. */
  swapDefaultChain?: Chain;
  /** Pre-fill the swap source token. */
  swapDefaultTokenIn?: Token;
  /** Pre-fill the swap destination token. */
  swapDefaultTokenOut?: Token;

  /* ─── Layout / branding ───────────────────────────────────────────── */

  /**
   * Show the "powered by whisk" wordmark in the card footer. Off by
   * default. Recommended when the host app is open-source / community-
   * facing; turn off for closed-product integrations.
   * @default false
   */
  showFooter?: boolean;
  /** Append to the outer card's class list. */
  className?: string;
};

/**
 * Drop-in inline widget. Routes off the state machine in `useWhisk()`
 * for the Transfer tab and `useWhiskSwap()` for the Swap tab.
 *
 * Supports four levels of host-app control over the input fields:
 *
 *  - Default (zero props): user enters everything from scratch.
 *  - `default*` props: pre-fill, user can still edit.
 *  - controlled props (`amount`, `recipient`, `sourceChain`, `destinationChain`):
 *    fields lock; useful for e-commerce, donations, payroll, etc.
 *  - Pure callback subscription via `on*Change` for reactive integration.
 *
 * No persistent header on purpose: every step self-titles where context
 * is needed, and the form itself communicates state.
 */
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
  // Resolved mode comes from the engine's baked-in config (see
  // `createWhisk` → `resolveMode`). Drives the visible "Testnet" pill
  // at the top of the card. Mainnet renders no pill — absence is the
  // safer signal that real money is moving.
  const mode = engine.config.mode ?? "testnet";

  // Pre-flight checks (P5): read-only inspection of balance, gas, and
  // wallet chain alignment. Runs while we have a `quote` in the
  // review state; results are forwarded to the Review step which renders
  // them inline and gates the Send button on any `blocking` check.
  const reviewQuote = state.kind === "review" ? state.quote : undefined;
  const preflight = usePreflight(reviewQuote, address);

  // Cross-tab single-flight (P7). Lock keyed on (address, sourceChain)
  // so a user with Whisk open in two tabs can't fire two CCTP burns
  // from the same wallet simultaneously. The owning tab proceeds
  // freely; observer tabs see `isLockedByOther` and their Send button
  // disables with a "Another tab is sending" notice.
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

  // Wrap `actions.send` so it acquires the cross-tab lock first.
  // Release happens reactively below via a state-watcher effect so we
  // cover both success and failure terminal states without the action
  // having to know it owns a lock.
  const guardedSend = useCallback(async () => {
    if (!tabLock.acquire()) {
      // Another tab beat us to it. The button is already disabled in
      // that case, so this is a belt-and-braces guard.
      return;
    }
    await actions.send();
  }, [tabLock, actions]);

  // Release the lock when we leave the sending state. `useEffect` fires
  // on every state change; we only act when state has moved off
  // `sending` AND we still hold the lock.
  const wasSendingRef = useRef(false);
  useEffect(() => {
    if (state.kind === "sending") {
      wasSendingRef.current = true;
    } else if (wasSendingRef.current) {
      // Terminal state (succeeded / failed / idle / disconnected after
      // a send) — release whatever lock we held.
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

  // Auto-resolve a host-pinned recipient. When the dev passes
  // `recipient="0x..."`, we don't want them to have to also click the
  // Continue button — the value is already final. We trigger resolve
  // once on first idle so the wizard advances to the resolved/quoting
  // path automatically.
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

  // Tab visibility — gated on kitKey so apps that don't pay for swap
  // never see a half-broken tab.
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
      {/*
       * Mode indicator. Visible from the moment the widget mounts —
       * users should know they're on testnet BEFORE they connect a
       * wallet, not after they've already considered the transfer
       * real. Mainnet renders nothing on purpose (no pill = real
       * money) so dismissal is impossible.
       */}
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
      // Mid-flight detection: burn already succeeded on source, but the
      // mint didn't land on destination. `state.raw` is preserved by
      // `mapAppKitBridgeResult` only on the bridge path, so this
      // implicitly excludes same-chain sends (which can't be
      // mid-flight). Surfacing `onRetry` only when all three signals
      // line up means a pre-burn failure stays a clean "Try again".
      const steps = state.steps ?? [];
      const burnStep = steps.find(
        (s) => s.name === "burn" && s.state === "success",
      );
      const mintedAlready = steps.some(
        (s) => s.name === "mint" && s.state === "success",
      );
      const canRetry =
        Boolean(burnStep) && !mintedAlready && state.raw !== undefined;

      // Manual-mint escape hatch (P3). Only offered when the retry
      // path is available AND we have the inputs we need:
      //   - burn tx hash (so Iris can be polled)
      //   - source + destination chains (for chain-switching + lookup)
      // This is the *direct* MessageTransmitter path — bypasses App
      // Kit entirely. Use it when retry keeps failing despite a
      // healthy Iris attestation.
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
