"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Lock } from "lucide-react";
import {
  chainInfo,
  supportedTokensFor,
  type Chain,
  type ResolvedRecipient,
  type SupportedTokenAlias,
  type Token,
} from "@signordev/whisk-core";
import { useWhiskContext } from "../../hooks/useWhiskContext.js";
import { useWhiskAccount } from "../../hooks/useWhiskAccount.js";
import { useChainBalance } from "../../hooks/useChainBalance.js";

import { Banner } from "../ui/Banner.js";
import { BalanceLine } from "../ui/BalanceLine.js";
import { Button } from "../ui/Button.js";
import { ChainPicker } from "../ui/ChainPicker.js";
import { FieldBox } from "../ui/FieldBox.js";
import { TokenPicker } from "../ui/TokenPicker.js";

export type InputStepProps = {
  resolvedRecipient?: ResolvedRecipient;
  busy: boolean;
  onResolve: (input: string, chain: Chain) => void;
  onQuote: (
    recipient: ResolvedRecipient,
    amount: string,
    sourceChain: Chain,
    token?: Token,
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

  // Token choice. The picker offers only stablecoins the registry has
  // an address for on the active source chain — `supportedTokensFor`
  // checks `usdcAddress` / `eurcAddress` / `usdtAddress` and returns
  // the aliases that resolve. NATIVE is intentionally absent from
  // the Transfer flow (this is a stablecoin widget; NATIVE belongs in
  // Swap, where exchanging ETH/SOL for USDC is a legit use case).
  //
  // Cross-chain bridges always run on USDC (App Kit Bridge is USDC-
  // only) and the picker locks with a hint.
  const supportedTokens = useMemo<SupportedTokenAlias[]>(
    () => supportedTokensFor(sourceChain),
    [sourceChain],
  );
  const [token, setToken] = useState<Token>("USDC");
  // If the user picked EURC on Arc and switches to a chain that
  // doesn't have EURC, snap back to USDC.
  useEffect(() => {
    if (
      token !== "USDC" &&
      !supportedTokens.includes(token as SupportedTokenAlias)
    ) {
      setToken("USDC");
    }
  }, [supportedTokens, token]);

  const isBridge = sourceChain !== destChain;
  const effectiveToken: Token = isBridge ? "USDC" : token;

  const destInfo = chainInfo(destChain);

  // Show balance for the wallet matching the source chain's ecosystem
  // (EVM source → EVM wallet, Solana source → Solana wallet). When the
  // user hasn't connected the right wallet yet, balance hides. The
  // balance tracks whichever token is currently picked so the user
  // sees what they're actually about to spend.
  const sourceAccount = account.accountFor(sourceChain);
  const balance = useChainBalance(
    sourceChain,
    sourceAccount.address,
    effectiveToken === "USDC" ||
      effectiveToken === "EURC" ||
      effectiveToken === "USDT"
      ? effectiveToken
      : "USDC",
  );

  useEffect(() => {
    if (
      resolvedRecipient &&
      resolvedRecipient.chain !== destChain &&
      !recipientLocked
    ) {
      setRecipientState("");
    }
  }, [destChain, resolvedRecipient, recipientLocked]);

  // When we re-mount on `resolved` state (typically after Back from
  // review), seed the input field with the resolved address so the
  // user sees what they had — but the field itself is fully editable.
  useEffect(() => {
    if (
      resolvedRecipient &&
      !recipientLocked &&
      recipientState === "" &&
      recipientProp === undefined
    ) {
      setRecipientState(resolvedRecipient.address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedRecipient]);

  // Accept either a valid raw address for the destination chain OR
  // anything domain-shaped (`*.eth`, `*.com`, etc.) — the latter is
  // resolved by the ENS resolver on Continue. We only mark the input
  // visually invalid when it's neither.
  const recipientLooksValid = useMemo(() => {
    const trimmed = recipientInput.trim();
    if (!trimmed) return true;
    if (destInfo.addressRegex.test(trimmed)) return true;
    return /\.[a-z0-9]{2,}$/i.test(trimmed);
  }, [destInfo, recipientInput]);

  const amountValue = parseFloat(amount);
  const amountValid = !Number.isNaN(amountValue) && amountValue > 0;

  // The resolved recipient is only "still valid" while the input matches
  // its address. The moment the user starts editing — typically after
  // clicking Back from review — we treat the resolved tag as stale and
  // route the CTA back to "Continue" so they can re-resolve.
  const recipientMatchesResolved = Boolean(
    resolvedRecipient &&
      resolvedRecipient.address === recipientInput.trim(),
  );
  const recipientInvalid = Boolean(
    error ??
      (recipientInput && !recipientLooksValid && !recipientMatchesResolved),
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
    !recipientMatchesResolved;
  const canReview =
    !busy &&
    !wrongChain &&
    !wrongEcosystem &&
    recipientMatchesResolved &&
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
    if (amountLocked) return;
    const max = balance.selected?.formatted ?? balance.usdc?.formatted;
    if (!max) return;
    handleAmountChange(max);
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
        <ChainPicker
          label={sourceLocked ? "From (locked)" : "From"}
          value={sourceChain}
          options={[...config.chains]}
          onChange={handleSourceChange}
          disabled={busy || sourceLocked}
        />
        <ChainPicker
          label={destLocked ? "To (locked)" : "To"}
          value={destChain}
          options={[...config.chains]}
          onChange={handleDestChange}
          disabled={busy || destLocked}
        />
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

      {/* Recipient stays editable even when a previous resolution is on
          file. When the user hits Back from review, the field shouldn't
          freeze on them — they should be able to fix the address or
          amount and re-quote. The "Recipient resolved" tag still
          appears, but we drop it the moment the input diverges from the
          resolved address. */}
      <FieldBox
        label={
          recipientLocked ? (
            <LockedLabel text="Recipient" />
          ) : resolvedRecipient &&
            resolvedRecipient.address === recipientInput.trim() ? (
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
        disabled={busy || recipientLocked}
        readOnly={recipientLocked}
      />
      {recipientInvalid ? (
        <div className="whisk-help whisk-help--error" style={{ marginTop: 0 }}>
          {error ?? `Doesn't look like a valid ${destInfo.label} address.`}
        </div>
      ) : null}

      <div className="whisk-amount-row">
        <FieldBox
          className="whisk-amount-row__input"
          label={amountLocked ? <LockedLabel text="Amount" /> : "Amount"}
          amount
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
        <TokenPicker
          value={effectiveToken}
          options={supportedTokens as Token[]}
          onChange={setToken}
          disabled={busy || isBridge}
          hint={
            isBridge
              ? "Bridges support USDC only — choose a single chain to swap tokens."
              : undefined
          }
        />
      </div>
      {balance.selected ? (
        <BalanceLine
          balance={balance.selected.formatted}
          symbol={balance.selected.symbol}
          onMax={amountLocked ? undefined : handleMax}
          maxDisabled={busy}
        />
      ) : null}

      {balance.isLowGas && balance.gasSymbol ? (
        <Banner variant="warning">
          Low {balance.gasSymbol} for gas — top up before sending or the
          transaction will fail.
        </Banner>
      ) : null}

      <div style={{ marginTop: "0.5rem" }}>
        {!recipientMatchesResolved ? (
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
            onClick={() =>
              onQuote(resolvedRecipient!, amount, sourceChain, effectiveToken)
            }
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
