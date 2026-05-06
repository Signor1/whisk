"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Lock } from "lucide-react";
import {
  chainInfo,
  type Chain,
  type ResolvedRecipient,
} from "@strimz/whisk-core";
import { useWhiskContext } from "../../hooks/useWhiskContext.js";
import { useWhiskAccount } from "../../hooks/useWhiskAccount.js";
import { useChainBalance } from "../../hooks/useChainBalance.js";

import { Banner } from "../ui/Banner.js";
import { BalanceLine } from "../ui/BalanceLine.js";
import { Button } from "../ui/Button.js";
import { FieldBox, FieldBoxSelect } from "../ui/FieldBox.js";

export type InputStepProps = {
  resolvedRecipient?: ResolvedRecipient;
  busy: boolean;
  onResolve: (input: string, chain: Chain) => void;
  onQuote: (
    recipient: ResolvedRecipient,
    amount: string,
    sourceChain: Chain,
  ) => void;
  error?: string;

  /* Controlled props */
  amount?: string;
  recipient?: string;
  sourceChain?: Chain;
  destinationChain?: Chain;

  /* Uncontrolled defaults */
  defaultAmount?: string;
  defaultRecipient?: string;

  /* Reactive callbacks */
  onAmountChange?: (value: string) => void;
  onRecipientChange?: (value: string) => void;
  onSourceChainChange?: (chain: Chain) => void;
  onDestinationChainChange?: (chain: Chain) => void;
};

/**
 * Compose-the-transfer step. Layout (top → bottom):
 *
 * 1. From / To chain pickers
 * 2. Chain-mismatch banner if wallet is on a different chain than `from`
 * 3. Recipient field
 * 4. Amount field + live balance line + low-gas warning
 * 5. Continue / Review CTA
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
  const account = useWhiskAccount();

  const initialSource =
    sourceChainProp ?? config.defaultSourceChain ?? config.chains[0]!;
  const initialDest =
    destinationChainProp ?? config.defaultDestinationChain ?? initialSource;

  const [sourceChainState, setSourceChainState] =
    useState<Chain>(initialSource);
  const [destChainState, setDestChainState] = useState<Chain>(initialDest);

  const sourceChain = sourceChainProp ?? sourceChainState;
  const destChain = destinationChainProp ?? destChainState;

  const sourceLocked = sourceChainProp !== undefined;
  const destLocked = destinationChainProp !== undefined;

  const [recipientState, setRecipientState] = useState(defaultRecipient ?? "");
  const recipientInput = recipientProp ?? recipientState;
  const recipientLocked = recipientProp !== undefined;

  const [amountState, setAmountState] = useState(defaultAmount ?? "");
  const amount = amountProp ?? amountState;
  const amountLocked = amountProp !== undefined;

  const destInfo = chainInfo(destChain);

  // Show balance for the wallet matching the source chain's ecosystem
  // (EVM source → EVM wallet, Solana source → Solana wallet). When the
  // user hasn't connected the right wallet yet, balance hides.
  const sourceAccount = account.accountFor(sourceChain);
  const balance = useChainBalance(sourceChain, sourceAccount.address);

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

  const wrongChain = account.isWrongChain(sourceChain);
  // Solana source chains need the Solana wallet, not the EVM one.
  const wrongEcosystem =
    chainInfo(sourceChain).kind === "solana" && !account.solana.isConnected;
  const canResolve =
    !busy &&
    !wrongChain &&
    !wrongEcosystem &&
    recipientInput.trim().length > 0 &&
    !resolvedRecipient;
  const canReview =
    !busy &&
    !wrongChain &&
    !wrongEcosystem &&
    Boolean(resolvedRecipient) &&
    amountValid;

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
  const handleMax = () => {
    if (amountLocked || !balance.usdc) return;
    handleAmountChange(balance.usdc.formatted);
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
          label={sourceLocked ? <LockedLabel text="From" /> : "From"}
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

      {wrongEcosystem ? (
        <Banner variant="warning">
          Sending from {chainInfo(sourceChain).label} needs a Solana wallet —
          connect Phantom / Solflare / Backpack from the wallet menu.
        </Banner>
      ) : wrongChain ? (
        <Banner
          variant="warning"
          action={{
            label: "Switch network",
            onClick: () => {
              void account.switchChain(sourceChain);
            },
          }}
        >
          Wallet is on{" "}
          <strong>{account.evm.chainName ?? "another chain"}</strong>. Switch
          to {chainInfo(sourceChain).label} to continue.
        </Banner>
      ) : null}

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

      <div>
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
        {balance.usdc ? (
          <BalanceLine
            balance={balance.usdc.formatted}
            symbol="USDC"
            onMax={amountLocked ? undefined : handleMax}
            maxDisabled={busy}
          />
        ) : null}
      </div>

      {balance.isLowGas && balance.native ? (
        <Banner variant="warning">
          Low {balance.native.symbol} for gas — top up before sending or the
          transaction will fail.
        </Banner>
      ) : null}

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
            onClick={() => onQuote(resolvedRecipient, amount, sourceChain)}
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
