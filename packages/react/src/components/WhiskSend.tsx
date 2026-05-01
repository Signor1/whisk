"use client";

import { useEffect, useRef } from "react";
import type { Chain, Quote, WhiskState } from "@strimz/whisk-core";
import { useWhisk } from "../hooks/useWhisk.js";
import { Card } from "./ui/Card.js";
import { Footer } from "./ui/Footer.js";
import {
  ConnectStep,
  InputStep,
  ReviewStep,
  SendingStep,
  ResultStep,
} from "./steps/index.js";

export type WhiskSendProps = {
  /* ─── Lifecycle callbacks ─────────────────────────────────────────── */

  /** Fires when a transfer completes successfully. */
  onSuccess?: (result: { quote: Quote; finalTxHash?: string }) => void;
  /** Fires when a transfer fails terminally. */
  onError?: (error: Error) => void;
  /** Fires for every state-machine transition — useful for analytics. */
  onStateChange?: (state: WhiskState) => void;

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
 * Drop-in inline widget. Routes off the state machine in `useWhisk()`.
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
  showFooter = false,
  className,
}: WhiskSendProps) {
  const { state, actions, connected } = useWhisk();

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
    const target =
      destinationChain ??
      sourceChain ??
      undefined;
    // The `actions.resolve` signature requires a chain — fall back to
    // the user's destination prop or the current source.
    if (target) {
      void actions.resolve(recipient, target);
    }
  }, [connected, state.kind, recipient, destinationChain, sourceChain, actions]);

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
      {renderStep(state, actions, connected, {
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
      })}
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

function renderStep(
  state: WhiskState,
  actions: ReturnType<typeof useWhisk>["actions"],
  connected: boolean,
  fields: ControlledFieldProps,
) {
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
          onConfirm={actions.send}
          onBack={actions.back}
        />
      );
    case "sending":
      return (
        <SendingStep steps={state.steps} activeStep={state.currentStep} />
      );
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
    case "failed":
      return (
        <ResultStep
          kind="failure"
          error={state.error}
          steps={state.steps}
          onReset={actions.reset}
        />
      );
    default: {
      const _: never = state;
      return null;
    }
  }
}
