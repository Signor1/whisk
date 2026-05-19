"use client";

import {
  ArrowRight,
  ArrowLeftRight,
  Clock3,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { chainInfo, type Quote } from "@signordev/whisk-core";
import type { PreflightResult } from "../../hooks/usePreflight.js";
import { Badge } from "../ui/Badge.js";
import { Button } from "../ui/Button.js";

export type ReviewStepProps = {
  quote: Quote;
  busy: boolean;
  onConfirm: () => void;
  onBack: () => void;
  /**
   * Pre-flight check results. When provided, blocking checks gate
   * the Send button and warning checks render as inline notices.
   * Omit to disable pre-flight UI entirely.
   */
  preflight?: PreflightResult;
  /**
   * Cross-tab single-flight signal (P7). True when another tab on the
   * same wallet + source chain is already mid-send. Disables Send and
   * surfaces an inline notice so the user can't accidentally fire a
   * second burn from a different tab.
   */
  tabLockedByOther?: boolean;
};

function shortenAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

/**
 * Final pre-send confirmation. Shows what the recipient gets, the route,
 * and an itemised fee breakdown. The full custom-fee split (90% host /
 * 10% Arc) is rendered as separate rows so users see exactly where every
 * cent goes.
 */
export function ReviewStep({
  quote,
  busy,
  onConfirm,
  onBack,
  preflight,
  tabLockedByOther,
}: ReviewStepProps) {
  const route = quote.route;
  const fromChain = route.kind === "send" ? route.chain : route.sourceChain;
  const toChain = route.kind === "send" ? route.chain : route.destinationChain;
  const blockedByPreflight = preflight?.hasBlocking ?? false;
  const blockedByTab = tabLockedByOther ?? false;
  const sendBlocked = blockedByPreflight || blockedByTab;

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
          <ArrowLeftRight size={18} strokeWidth={2} />
          <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600 }}>
            Review {route.kind === "bridge" ? "bridge" : "transfer"}
          </h2>
        </div>
        <p
          className="whisk-help"
          style={{ marginTop: "0.125rem", marginBottom: 0 }}
        >
          {route.kind === "bridge"
            ? "Crossing chains via Circle CCTP. Approve → burn → mint."
            : "One-step transfer on the same chain."}
        </p>
      </header>

      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "0.5rem 1rem",
          margin: 0,
          fontSize: "0.875rem",
        }}
      >
        <dt
          style={{
            margin: 0,
            color: "var(--whisk-fg-muted)",
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Recipient gets
        </dt>
        <dd style={{ margin: 0, fontWeight: 600, textAlign: "right" }}>
          {quote.amountOut} {quote.token}
        </dd>

        <dt
          style={{
            margin: 0,
            color: "var(--whisk-fg-muted)",
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Route
        </dt>
        <dd
          style={{
            margin: 0,
            textAlign: "right",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "0.375rem",
          }}
        >
          <span>{chainInfo(fromChain).label}</span>
          {fromChain !== toChain ? (
            <>
              <ArrowRight size={12} strokeWidth={2} style={{ opacity: 0.6 }} />
              <span>{chainInfo(toChain).label}</span>
            </>
          ) : null}
        </dd>

        <dt
          style={{
            margin: 0,
            color: "var(--whisk-fg-muted)",
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          To
        </dt>
        <dd
          className="whisk-mono"
          style={{ margin: 0, fontSize: "0.8125rem", textAlign: "right" }}
        >
          {shortenAddress(quote.recipient.address)}
        </dd>
      </dl>

      {/*
       * Fees + total. The dashed separator only renders when there are
       * actual fee entries above the "You pay" line — same-chain sends
       * with no custom fee return an empty `entries` array and the
       * separator would otherwise look like an empty divider above a
       * single value, which reads as a UI bug rather than a feature.
       */}
      <div
        style={{
          borderTop: "1px solid var(--whisk-border)",
          paddingTop: "0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.375rem",
        }}
      >
        {quote.fees.entries.map((fee, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.8125rem",
            }}
          >
            <span className="whisk-help" style={{ marginTop: 0 }}>
              {fee.description ?? labelForFee(fee.kind)}
            </span>
            <span className="whisk-mono">
              {fee.amount} {fee.token}
            </span>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 600,
            paddingTop: quote.fees.entries.length > 0 ? "0.5rem" : 0,
            borderTop:
              quote.fees.entries.length > 0
                ? "1px dashed var(--whisk-border)"
                : undefined,
          }}
        >
          <span>You pay</span>
          <span className="whisk-mono">
            {quote.amountIn} {quote.token}
          </span>
        </div>
      </div>

      {quote.estimatedDurationMs ? (
        <Badge variant="muted">
          <Clock3 size={11} strokeWidth={2.5} />~
          {Math.round(quote.estimatedDurationMs / 1000)}s
        </Badge>
      ) : null}

      {/*
       * Cross-tab single-flight notice (P7). Shown when another tab on
       * the same wallet + source chain is mid-send.
       */}
      {blockedByTab ? (
        <p
          className="whisk-help whisk-help--error"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.375rem",
            margin: 0,
            fontSize: "0.75rem",
          }}
        >
          <AlertCircle
            size={12}
            strokeWidth={2.5}
            style={{ flexShrink: 0, marginTop: 1 }}
          />
          <span>
            Another tab is already sending from this wallet on this chain. Wait
            for it to finish before sending here.
          </span>
        </p>
      ) : null}

      {/*
       * Pre-flight notices. Renders one line per check above the Send
       * button so the user sees "you'll fail this" warnings BEFORE they
       * sign. Blocking checks (red) gate Send; warnings (amber) inform
       * but don't block. Read-only — no extra gas to surface these.
       */}
      {preflight && preflight.checks.length > 0 ? (
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: "0.375rem",
          }}
        >
          {preflight.checks.map((c) => (
            <li
              key={c.id}
              className={
                c.status === "blocking"
                  ? "whisk-help whisk-help--error"
                  : "whisk-help"
              }
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.375rem",
                margin: 0,
                fontSize: "0.75rem",
              }}
            >
              {c.status === "blocking" ? (
                <AlertCircle
                  size={12}
                  strokeWidth={2.5}
                  style={{ flexShrink: 0, marginTop: 1 }}
                />
              ) : (
                <AlertTriangle
                  size={12}
                  strokeWidth={2.5}
                  style={{ flexShrink: 0, marginTop: 1, opacity: 0.7 }}
                />
              )}
              <span>{c.message}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button variant="ghost" onClick={onBack} disabled={busy}>
          Back
        </Button>
        <Button
          onClick={onConfirm}
          disabled={busy || sendBlocked}
          style={{ flex: 1 }}
        >
          {busy ? (
            <>
              <span className="whisk-spinner" /> Sending…
            </>
          ) : blockedByTab ? (
            <>Active send in another tab</>
          ) : blockedByPreflight ? (
            <>Resolve issues above</>
          ) : (
            <>
              Send {quote.amountIn} {quote.token}
              <ArrowRight size={14} strokeWidth={2} />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function labelForFee(kind: Quote["fees"]["entries"][number]["kind"]): string {
  switch (kind) {
    case "custom":
      return "Custom fee";
    case "protocol":
      return "Protocol fee";
    case "gas":
      return "Network gas";
    case "forwarder":
      return "Forwarding service";
    case "provider":
      return "Provider fee";
    default:
      return "Fee";
  }
}
