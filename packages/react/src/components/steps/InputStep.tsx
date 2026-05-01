"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Lock } from "lucide-react";
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

  /* ----- Controlled props (host app pins the value) ----- */
  /** Lock the amount field. When set, user can't edit. */
  amount?: string;
  /** Lock the recipient field. When set, user can't edit. */
  recipient?: string;
  /** Lock the source chain selector. */
  sourceChain?: Chain;
  /** Lock the destination chain selector. */
  destinationChain?: Chain;

  /* ----- Uncontrolled defaults ----- */
  /** Initial amount value; user can still edit. Ignored if `amount` is set. */
  defaultAmount?: string;
  /** Initial recipient value. Ignored if `recipient` is set. */
  defaultRecipient?: string;

  /* ----- Change callbacks ----- */
  onAmountChange?: (value: string) => void;
  onRecipientChange?: (value: string) => void;
  onSourceChainChange?: (chain: Chain) => void;
  onDestinationChainChange?: (chain: Chain) => void;
};

/**
 * Compose-the-transfer step. From / To chain pickers, recipient field,
 * amount field, then a single CTA. Each field can be locked from the
 * outside via a controlled prop (host app pins it) or initialised via
 * `default*` props.
 */
export function InputStep({
  resolvedRecipient,
  busy,
  onResolve,
  onQuote,
  error,
  amount: amountProp,
  recipient: recipientProp,
  sourceChain: sourceChainProp,
  destinationChain: destinationChainProp,
  defaultAmount,
  defaultRecipient,
  onAmountChange,
  onRecipientChange,
  onSourceChainChange,
  onDestinationChainChange,
}: InputStepProps) {
  const { config } = useWhiskContext();

  const initialSource =
    sourceChainProp ?? config.defaultSourceChain ?? config.chains[0]!;
  const initialDest =
    destinationChainProp ?? config.defaultDestinationChain ?? initialSource;

  // Source / destination — controlled if prop given, else local state
  // initialised from defaults.
  const [sourceChainState, setSourceChainState] =
    useState<Chain>(initialSource);
  const [destChainState, setDestChainState] = useState<Chain>(initialDest);

  const sourceChain = sourceChainProp ?? sourceChainState;
  const destChain = destinationChainProp ?? destChainState;

  const sourceLocked = sourceChainProp !== undefined;
  const destLocked = destinationChainProp !== undefined;

  // Recipient — controlled if prop given, else local state initialised
  // from default.
  const [recipientState, setRecipientState] = useState(defaultRecipient ?? "");
  const recipientInput = recipientProp ?? recipientState;
  const recipientLocked = recipientProp !== undefined;

  // Amount — same pattern.
  const [amountState, setAmountState] = useState(defaultAmount ?? "");
  const amount = amountProp ?? amountState;
  const amountLocked = amountProp !== undefined;

  const destInfo = chainInfo(destChain);

  // If the destination chain changes after a recipient was resolved on
  // the previous one, drop the resolution — but only when the recipient
  // isn't locked by the host (locked recipients are the host's
  // responsibility to keep valid for the chosen chain).
  useEffect(() => {
    if (
      resolvedRecipient &&
      resolvedRecipient.chain !== destChain &&
      !recipientLocked
    ) {
      setRecipientState("");
    }
  }, [destChain, resolvedRecipient, recipientLocked]);

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

  const handleSourceChange = (chain: Chain) => {
    if (sourceLocked) return;
    setSourceChainState(chain);
    onSourceChainChange?.(chain);
  };
  const handleDestChange = (chain: Chain) => {
    if (destLocked) return;
    setDestChainState(chain);
    onDestinationChainChange?.(chain);
  };
  const handleRecipientChange = (value: string) => {
    if (recipientLocked) return;
    setRecipientState(value);
    onRecipientChange?.(value);
  };
  const handleAmountChange = (value: string) => {
    if (amountLocked) return;
    setAmountState(value);
    onAmountChange?.(value);
  };

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
          label={
            sourceLocked ? (
              <LockedLabel text="From" />
            ) : (
              "From"
            )
          }
          value={sourceChain}
          onChange={(e) => handleSourceChange(e.target.value as Chain)}
          disabled={busy || sourceLocked}
        >
          {config.chains.map((c) => (
            <option key={c} value={c}>
              {chainInfo(c).label}
            </option>
          ))}
        </FieldBoxSelect>
        <FieldBoxSelect
          label={destLocked ? <LockedLabel text="To" /> : "To"}
          value={destChain}
          onChange={(e) => handleDestChange(e.target.value as Chain)}
          disabled={busy || destLocked}
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
          recipientLocked ? (
            <LockedLabel text="Recipient" />
          ) : resolvedRecipient ? (
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
        onChange={(e) => handleRecipientChange(e.target.value)}
        disabled={busy || recipientLocked || Boolean(resolvedRecipient)}
        readOnly={recipientLocked}
      />
      {recipientInvalid ? (
        <div className="whisk-help whisk-help--error" style={{ marginTop: 0 }}>
          {error ?? `Doesn't look like a valid ${destInfo.label} address.`}
        </div>
      ) : null}

      <FieldBox
        label={amountLocked ? <LockedLabel text="Amount" /> : "Amount"}
        amount
        suffix="USDC"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={amount}
        onChange={(e) => handleAmountChange(e.target.value)}
        invalid={Boolean(amount && !amountValid)}
        disabled={busy || amountLocked}
        readOnly={amountLocked}
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

/**
 * Inline label decorator that signals "this field is locked by the host
 * app" with a tiny lock icon. Helps users understand the read-only state
 * isn't a bug.
 */
function LockedLabel({ text }: { text: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
      }}
    >
      <Lock size={9} strokeWidth={2.5} style={{ opacity: 0.7 }} />
      {text}
    </span>
  );
}
