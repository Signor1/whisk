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
} from "@usewhisk/core";
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
  /* Initial chain seeds — used on mount, do NOT lock the picker. */
  initialSourceChain?: Chain;
  initialDestinationChain?: Chain;

  /* Reactive callbacks */
  onAmountChange?: (value: string) => void;
  onRecipientChange?: (value: string) => void;
  onSourceChainChange?: (chain: Chain) => void;
  onDestinationChainChange?: (chain: Chain) => void;
};

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
  initialSourceChain,
  initialDestinationChain,
  onAmountChange,
  onRecipientChange,
  onSourceChainChange,
  onDestinationChainChange,
}: InputStepProps) {
  const { config } = useWhiskContext();
  const account = useWhiskAccount();

  const initialSource =
    sourceChainProp ??
    initialSourceChain ??
    config.defaultSourceChain ??
    config.chains[0]!;
  const initialDest =
    destinationChainProp ??
    initialDestinationChain ??
    config.defaultDestinationChain ??
    initialSource;

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

  const supportedTokens = useMemo<SupportedTokenAlias[]>(
    () => supportedTokensFor(sourceChain),
    [sourceChain],
  );
  const [token, setToken] = useState<Token>("USDC");
  // Snap back to USDC if the chain switch dropped support for the picked token.
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

  // Swap field to the resolved address after resolve so the ENS input (eg. "vitalik.eth")
  // doesn't keep the Continue button stuck in "resolve" mode.
  useEffect(() => {
    if (
      resolvedRecipient &&
      !recipientLocked &&
      recipientProp === undefined &&
      recipientState !== resolvedRecipient.address
    ) {
      setRecipientState(resolvedRecipient.address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedRecipient]);

  // Locked-ENS preset: visibly swap the pinned name to the resolved address.
  // The host-facing `recipientInput` is unchanged; only the FieldBox display swaps.
  const displayedRecipient =
    recipientLocked &&
    resolvedRecipient &&
    resolvedRecipient.address !== recipientInput
      ? resolvedRecipient.address
      : recipientInput;

  const recipientLooksValid = useMemo(() => {
    const trimmed = recipientInput.trim();
    if (!trimmed) return true;
    if (destInfo.addressRegex.test(trimmed)) return true;
    return /\.[a-z0-9]{2,}$/i.test(trimmed);
  }, [destInfo, recipientInput]);

  const amountValue = parseFloat(amount);
  const amountValid = !Number.isNaN(amountValue) && amountValue > 0;

  // Locked recipient counts as matched by construction — covers locked-ENS where
  // input="vitalik.eth" never literal-matches the resolved 0x… address. The
  // chain must also match: the quote bridges to `resolvedRecipient.chain`, so a
  // resolution on a stale destination has to be redone before quoting.
  const recipientMatchesResolved = Boolean(
    resolvedRecipient &&
    resolvedRecipient.chain === destChain &&
    (recipientLocked || resolvedRecipient.address === recipientInput.trim()),
  );
  const recipientInvalid = Boolean(
    error ??
    (recipientInput && !recipientLooksValid && !recipientMatchesResolved),
  );

  const wrongChain = account.isWrongChain(sourceChain);
  const sourceKind = chainInfo(sourceChain).kind;
  const wrongEcosystem =
    (sourceKind === "solana" && !account.solana.isConnected) ||
    (sourceKind === "evm" && !account.evm.isConnected);
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
          // `minmax(0, 1fr)` — without explicit 0-min, long chain names overflow the card.
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
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
          {sourceKind === "solana"
            ? `Sending from ${chainInfo(sourceChain).label} needs a Solana wallet — connect Phantom / Solflare / Backpack from the wallet menu.`
            : `Sending from ${chainInfo(sourceChain).label} needs an EVM wallet — connect MetaMask / Coinbase / WalletConnect from the wallet menu.`}
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
          <strong>{account.evm.chainName ?? "another chain"}</strong>. Switch to{" "}
          {chainInfo(sourceChain).label} to continue.
        </Banner>
      ) : null}

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
        value={displayedRecipient}
        onChange={(e) => handleRecipientChange(e.target.value)}
        disabled={busy || recipientLocked}
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
        suffix={
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
        }
      />
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
