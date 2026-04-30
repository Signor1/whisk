"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  chainInfo,
  type Chain,
  type ResolvedRecipient,
} from "@strimz/whisk-core";
import { useWhiskContext } from "../../hooks/useWhiskContext.js";
import { Button } from "../ui/Button.js";
import { FieldBox, FieldBoxSelect } from "../ui/FieldBox.js";

export type InputStepProps = {
  /** Optional pre-resolved recipient — when present, rendered as a chip. */
  resolvedRecipient?: ResolvedRecipient;
  /** Whether resolution / quoting is in flight. */
  busy: boolean;
  /** Called to resolve the recipient input on the chosen destination chain. */
  onResolve: (input: string, chain: Chain) => void;
  /** Called once both `resolvedRecipient` and amount are present. */
  onQuote: (recipient: ResolvedRecipient, amount: string) => void;
  /** Last user-facing error to render under the form (resolution etc.). */
  error?: string;
};

/**
 * Compose-the-transfer step. From / To chain pickers up top, recipient
 * field below, then a prominent amount field. Layout follows the
 * design-spec mockup: inset labels, hairline borders, generous spacing.
 *
 * Every transition out of this step (resolve, quote) is signalled
 * through props so the parent owns the engine plumbing.
 */
export function InputStep({
  resolvedRecipient,
  busy,
  onResolve,
  onQuote,
  error,
}: InputStepProps) {
  const { config } = useWhiskContext();

  const initialSource = config.defaultSourceChain ?? config.chains[0]!;
  const initialDest = config.defaultDestinationChain ?? initialSource;
  const [sourceChain, setSourceChain] = useState<Chain>(initialSource);
  const [destChain, setDestChain] = useState<Chain>(initialDest);
  const [recipientInput, setRecipientInput] = useState("");
  const [amount, setAmount] = useState("");

  const destInfo = chainInfo(destChain);

  // If the destination chain changes after a recipient was resolved on the
  // previous one, drop the resolution — addresses don't always cross
  // chains validly (EVM hex vs Solana base58).
  useEffect(() => {
    if (resolvedRecipient && resolvedRecipient.chain !== destChain) {
      setRecipientInput("");
    }
  }, [destChain, resolvedRecipient]);

  const recipientLooksValid = useMemo(
    () => destInfo.addressRegex.test(recipientInput.trim()),
    [destInfo, recipientInput],
  );

  const amountValue = parseFloat(amount);
  const amountValid = !Number.isNaN(amountValue) && amountValue > 0;

  const recipientInvalid = Boolean(
    error ?? (recipientInput && !recipientLooksValid && !resolvedRecipient),
  );

  const canResolve =
    !busy && recipientInput.trim().length > 0 && !resolvedRecipient;
  const canReview = !busy && Boolean(resolvedRecipient) && amountValid;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.5rem",
        }}
      >
        <FieldBoxSelect
          label="From"
          value={sourceChain}
          onChange={(e) => setSourceChain(e.target.value as Chain)}
          disabled={busy}
        >
          {config.chains.map((c) => (
            <option key={c} value={c}>
              {chainInfo(c).label}
            </option>
          ))}
        </FieldBoxSelect>
        <FieldBoxSelect
          label="To"
          value={destChain}
          onChange={(e) => setDestChain(e.target.value as Chain)}
          disabled={busy}
        >
          {config.chains.map((c) => (
            <option key={c} value={c}>
              {chainInfo(c).label}
            </option>
          ))}
        </FieldBoxSelect>
      </div>

      <FieldBox
        label={
          resolvedRecipient ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                color: "var(--whisk-success)",
              }}
            >
              <CheckCircle2 size={10} strokeWidth={2.5} /> Recipient resolved
            </span>
          ) : (
            "Recipient"
          )
        }
        mono
        invalid={recipientInvalid}
        placeholder={destInfo.addressHint}
        value={recipientInput}
        onChange={(e) => setRecipientInput(e.target.value)}
        disabled={busy || Boolean(resolvedRecipient)}
      />
      {recipientInvalid ? (
        <div className="whisk-help whisk-help--error" style={{ marginTop: 0 }}>
          {error ?? `Doesn't look like a valid ${destInfo.label} address.`}
        </div>
      ) : null}

      <FieldBox
        label="Amount"
        amount
        suffix="USDC"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        invalid={Boolean(amount && !amountValid)}
        disabled={busy}
      />

      <div style={{ marginTop: "0.5rem" }}>
        {!resolvedRecipient ? (
          <Button
            onClick={() => onResolve(recipientInput.trim(), destChain)}
            disabled={!canResolve}
            style={{ width: "100%" }}
          >
            {busy ? (
              <>
                <span className="whisk-spinner" /> Checking…
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={14} strokeWidth={2} />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => onQuote(resolvedRecipient, amount)}
            disabled={!canReview}
            style={{ width: "100%" }}
          >
            {busy ? (
              <>
                <span className="whisk-spinner" /> Quoting…
              </>
            ) : (
              <>
                Review
                <ArrowRight size={14} strokeWidth={2} />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
