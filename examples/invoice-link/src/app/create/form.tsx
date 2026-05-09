"use client";

import { useMemo, useState } from "react";
import { allChains, chainsByNetwork, type Chain } from "@strimz/whisk-react";

const CHAIN_OPTIONS: Chain[] = chainsByNetwork("testnet").map((c) => c.chain);

export function CreateForm() {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [chain, setChain] = useState<Chain>("Arc_Testnet");
  const [memo, setMemo] = useState("");

  const link = useMemo(() => {
    if (!to || !amount) return null;
    const params = new URLSearchParams();
    params.set("to", to.trim());
    params.set("amount", amount.trim());
    params.set("chain", chain);
    if (memo.trim()) params.set("memo", memo.trim());
    return `/?${params.toString()}`;
  }, [to, amount, chain, memo]);

  const fullUrl = useMemo(() => {
    if (!link) return null;
    if (typeof window === "undefined") return link;
    return `${window.location.origin}${link}`;
  }, [link]);

  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* noop */
    }
  };

  const isValid = Boolean(
    /^0x[a-fA-F0-9]{40}$/.test(to.trim()) && parseFloat(amount) > 0,
  );

  return (
    <article className="create">
      <header className="create__head">
        <span className="create__eyebrow">Create payment link</span>
        <h1>Compose an invoice link</h1>
        <p>
          Drop in your details. We encode them into a URL — share it
          and Whisk takes over on the customer's side.
        </p>
      </header>

      <div className="create__grid">
        <form className="create__form" onSubmit={(e) => e.preventDefault()}>
          <label className="create__field">
            <span>Recipient address</span>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="0x…"
              spellCheck={false}
            />
          </label>

          <div className="create__row">
            <label className="create__field">
              <span>Amount (USDC)</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="49.99"
                step="0.01"
                inputMode="decimal"
              />
            </label>
            <label className="create__field">
              <span>Chain</span>
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value as Chain)}
              >
                {CHAIN_OPTIONS.map((c) => {
                  const info = allChains().find((x) => x.chain === c)!;
                  return (
                    <option key={c} value={c}>
                      {info.label}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>

          <label className="create__field">
            <span>Memo (optional)</span>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Invoice #420"
              maxLength={120}
            />
          </label>
        </form>

        <aside className="create__preview">
          <span className="create__eyebrow">Generated link</span>
          {isValid && fullUrl ? (
            <>
              <code className="create__url">{fullUrl}</code>
              <div className="create__actions">
                <button
                  type="button"
                  className="chip chip--primary"
                  onClick={onCopy}
                >
                  {copied ? "Copied" : "Copy link"}
                </button>
                <a className="chip" href={link!}>
                  Open as customer →
                </a>
              </div>
              <p className="create__hint">
                Anyone with this link can pay the invoice — Whisk pins
                the recipient + amount on the customer's side.
              </p>
            </>
          ) : (
            <div className="create__placeholder">
              Enter a valid 0x address and a positive amount to generate
              a link.
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
