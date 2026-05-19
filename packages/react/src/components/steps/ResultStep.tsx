"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ExternalLink,
  Wrench,
} from "lucide-react";
import type { Quote, Step, WhiskError } from "@signordev/whisk-core";
import type { ManualMintResult } from "../../hooks/useManualMint.js";
import { Badge } from "../ui/Badge.js";
import { Button } from "../ui/Button.js";
import { StepRail } from "../ui/StepRail.js";

export type ResultStepProps =
  | {
      kind: "success";
      quote: Quote;
      steps: ReadonlyArray<Step>;
      finalTxHash?: string;
      onReset: () => void;
    }
  | {
      kind: "failure";
      error: WhiskError;
      steps?: ReadonlyArray<Step>;
      onReset: () => void;
      /**
       * When set, the failure is recoverable — the burn succeeded but
       * the destination mint didn't. Surfacing a "Complete the mint"
       * action lets the user resume via `engine.retry` instead of
       * starting a fresh bridge (which would re-burn). Pre-burn
       * failures pass `undefined` and only the "Try again" reset CTA
       * shows.
       */
      onRetry?: () => void;
      /**
       * Direct-CCTP escape hatch — bypasses App Kit's retry path and
       * submits `MessageTransmitter.receiveMessage` ourselves. Only
       * pass when retry has been wired and we have the source burn
       * tx hash + destination chain (so the hook can poll Iris and
       * build the call). The user pays the same gas as a successful
       * retry would have cost — CCTP's nonce tracking on the
       * destination prevents a duplicate mint.
       */
      onManualMint?: () => Promise<ManualMintResult>;
    };

/**
 * Terminal state of the wizard — either succeeded or failed. The success
 * variant surfaces the destination tx hash; the failure variant surfaces a
 * typed `WhiskError` with a Reset CTA.
 */
export function ResultStep(props: ResultStepProps) {
  if (props.kind === "success") {
    return (
      <div
        style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}
      >
        <header>
          <Badge variant="success">
            <CheckCircle2 size={11} strokeWidth={2.5} /> Sent
          </Badge>
          <h2
            style={{
              margin: "0.5rem 0 0",
              fontSize: "1.0625rem",
              fontWeight: 600,
            }}
          >
            {props.quote.amountOut} {props.quote.token} delivered
          </h2>
          {props.finalTxHash ? (
            <p
              className="whisk-help"
              style={{ marginTop: "0.25rem", marginBottom: 0 }}
            >
              <span className="whisk-mono">
                {shortenHash(props.finalTxHash)}
              </span>
            </p>
          ) : null}
        </header>
        <StepRail steps={props.steps} />
        <Button variant="secondary" onClick={props.onReset}>
          <RotateCcw size={14} strokeWidth={2} />
          Send another
        </Button>
      </div>
    );
  }

  const canRetry = Boolean(props.onRetry);
  const canManualMint = Boolean(props.onManualMint);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      <header>
        <Badge variant={canRetry ? "warning" : "error"}>
          <XCircle size={11} strokeWidth={2.5} />
          {canRetry ? "Mid-flight" : "Failed"}
        </Badge>
        <h2
          style={{
            margin: "0.5rem 0 0",
            fontSize: "1.0625rem",
            fontWeight: 600,
          }}
        >
          {canRetry
            ? "Mint pending on destination"
            : "Transfer didn't go through"}
        </h2>
        <p
          className="whisk-help whisk-help--error"
          style={{ marginTop: "0.25rem", marginBottom: 0 }}
        >
          {canRetry
            ? "Your funds were burned on the source chain but the mint didn't land. Complete it now — you'll sign once on the destination. The burn isn't repeated."
            : props.error.message}
        </p>
      </header>
      {props.steps && props.steps.length > 0 ? (
        <StepRail steps={props.steps} />
      ) : null}
      {canRetry ? (
        <>
          <Button variant="primary" onClick={props.onRetry}>
            <RotateCcw size={14} strokeWidth={2} />
            Complete the mint
          </Button>
          {canManualMint ? (
            <ManualMintButton onManualMint={props.onManualMint!} />
          ) : null}
          <Button variant="ghost" onClick={props.onReset}>
            Cancel and reset
          </Button>
        </>
      ) : (
        <Button variant="secondary" onClick={props.onReset}>
          <RotateCcw size={14} strokeWidth={2} />
          Try again
        </Button>
      )}
    </div>
  );
}

/**
 * Direct-CCTP escape hatch button. Hidden by default beneath the
 * primary "Complete the mint" CTA — most users never need it. Surfaces
 * when the App Kit retry path keeps failing despite a healthy Iris
 * attestation; clicking submits `MessageTransmitter.receiveMessage`
 * directly from the user's wallet on the destination chain.
 *
 * Tracks the call lifecycle locally so the parent component doesn't
 * need to thread submitting/success/failure state through the step
 * machine — manual mint is intentionally side-channel, outside the
 * primary state-machine flow.
 */
function ManualMintButton({
  onManualMint,
}: {
  onManualMint: () => Promise<ManualMintResult>;
}) {
  const [phase, setPhase] = useState<
    | { kind: "idle" }
    | { kind: "submitting" }
    | { kind: "success"; txHash: string; explorerUrl?: string }
    | { kind: "failure"; message: string }
  >({ kind: "idle" });

  const handleClick = async () => {
    setPhase({ kind: "submitting" });
    try {
      const result = await onManualMint();
      if (result.kind === "success") {
        setPhase({
          kind: "success",
          txHash: result.txHash,
          explorerUrl: result.explorerUrl,
        });
      } else if (result.kind === "unsupported") {
        setPhase({
          kind: "failure",
          message:
            result.reason === "solana-destination"
              ? "Solana destinations aren't supported by the direct path yet. Use the standard retry button."
              : "No MessageTransmitter registered for this chain.",
        });
      } else {
        setPhase({ kind: "failure", message: result.message });
      }
    } catch (err) {
      setPhase({
        kind: "failure",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  if (phase.kind === "success") {
    return (
      <div className="whisk-help" style={{ marginTop: "-0.25rem" }}>
        Manual mint submitted:{" "}
        {phase.explorerUrl ? (
          <a
            href={phase.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <span className="whisk-mono">
              {phase.txHash.slice(0, 10)}…{phase.txHash.slice(-6)}
            </span>
            <ExternalLink size={11} strokeWidth={2.5} />
          </a>
        ) : (
          <span className="whisk-mono">
            {phase.txHash.slice(0, 10)}…{phase.txHash.slice(-6)}
          </span>
        )}
      </div>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={handleClick}
        disabled={phase.kind === "submitting"}
      >
        <Wrench size={14} strokeWidth={2} />
        {phase.kind === "submitting"
          ? "Submitting…"
          : "Submit manually (advanced)"}
      </Button>
      {phase.kind === "failure" ? (
        <p
          className="whisk-help whisk-help--error"
          style={{ marginTop: "-0.5rem", marginBottom: 0, fontSize: "0.75rem" }}
        >
          {phase.message}
        </p>
      ) : null}
    </>
  );
}

function shortenHash(h: string): string {
  if (h.length <= 14) return h;
  return `${h.slice(0, 8)}…${h.slice(-6)}`;
}

// Type-level reference so the import isn't tree-shaken away in headless
// builds where ExternalLink might end up unused after future edits.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _icon = ExternalLink;
