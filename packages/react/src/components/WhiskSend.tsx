"use client";

import { useEffect } from "react";
import type { Quote, WhiskState } from "@strimz/whisk-core";
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
  /** Fires when a transfer completes successfully. */
  onSuccess?: (result: { quote: Quote; finalTxHash?: string }) => void;
  /** Fires when a transfer fails terminally. */
  onError?: (error: Error) => void;
  /** Fires for every state-machine transition — useful for analytics. */
  onStateChange?: (state: WhiskState) => void;
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
 * No persistent header on purpose: every step self-titles where context
 * is needed, and the form itself communicates state. This is the
 * Stripe / Privy pattern — let the content own the surface, keep brand
 * presence to the optional footer.
 */
export function WhiskSend({
  onSuccess,
  onError,
  onStateChange,
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
      {renderStep(state, actions, connected)}
      {showFooter ? <Footer /> : null}
    </Card>
  );
}

function renderStep(
  state: WhiskState,
  actions: ReturnType<typeof useWhisk>["actions"],
  connected: boolean,
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
        />
      );
    case "resolving":
      return (
        <InputStep busy onResolve={actions.resolve} onQuote={actions.quote} />
      );
    case "resolved":
      return (
        <InputStep
          busy={false}
          resolvedRecipient={state.recipient}
          onResolve={actions.resolve}
          onQuote={actions.quote}
        />
      );
    case "quoting":
      return (
        <InputStep
          busy
          resolvedRecipient={state.recipient}
          onResolve={actions.resolve}
          onQuote={actions.quote}
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
