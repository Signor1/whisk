"use client";

import { CheckCircle2, XCircle, RotateCcw, ExternalLink } from "lucide-react";
import type { Quote, Step, WhiskError } from "@strimz/whisk-core";
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
    };

/**
 * Terminal state of the wizard — either succeeded or failed. The success
 * variant surfaces the destination tx hash; the failure variant surfaces a
 * typed `WhiskError` with a Reset CTA.
 */
export function ResultStep(props: ResultStepProps) {
  if (props.kind === "success") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      <header>
        <Badge variant="error">
          <XCircle size={11} strokeWidth={2.5} /> Failed
        </Badge>
        <h2
          style={{
            margin: "0.5rem 0 0",
            fontSize: "1.0625rem",
            fontWeight: 600,
          }}
        >
          Transfer didn't go through
        </h2>
        <p
          className="whisk-help whisk-help--error"
          style={{ marginTop: "0.25rem", marginBottom: 0 }}
        >
          {props.error.message}
        </p>
      </header>
      {props.steps && props.steps.length > 0 ? (
        <StepRail steps={props.steps} />
      ) : null}
      <Button variant="secondary" onClick={props.onReset}>
        <RotateCcw size={14} strokeWidth={2} />
        Try again
      </Button>
    </div>
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
