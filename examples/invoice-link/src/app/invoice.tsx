"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { WhiskSend, allChains, type Chain } from "@signordev/whisk-react";

/**
 * The merchant generates a link like:
 *
 *     /pay?to=0x5B8e…7605&amount=49.99&chain=Arc_Testnet&memo=Invoice%20%23420
 *
 * This component reads the params, validates them, and pre-fills the
 * widget. The link is the entire integration — no JS on the merchant's
 * site, no SDK. Send a URL, get paid.
 */
export function ExampleInvoice() {
  const params = useSearchParams();

  const parsed = useMemo(() => {
    const to = params.get("to") ?? "";
    const amount = params.get("amount") ?? "";
    const chain = params.get("chain") ?? "";
    const memo = params.get("memo") ?? "";
    const validChain = allChains().find((c) => c.chain === chain)?.chain;
    return {
      to: to || undefined,
      amount: amount || undefined,
      chain: validChain as Chain | undefined,
      memo,
    };
  }, [params]);

  if (!parsed.to || !parsed.amount || !parsed.chain) {
    return (
      <div className="invoice invoice--empty">
        <h2>Invoice link required</h2>
        <p>
          This page expects URL params. Try one of these:
        </p>
        <ul className="invoice__samples">
          <li>
            <a href="/?to=0x5B8ecaB7096F8aBED873D246629ef9f05f467605&amount=49.99&chain=Arc_Testnet&memo=Invoice+%23420">
              Invoice #420 · 49.99 USDC · Arc Testnet
            </a>
          </li>
          <li>
            <a href="/?to=0x5B8ecaB7096F8aBED873D246629ef9f05f467605&amount=12&chain=Base_Sepolia&memo=Coffee+for+the+team">
              Coffee · 12 USDC · Base Sepolia
            </a>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className="invoice">
      <header className="invoice__head">
        <span className="invoice__from">From your friendly merchant</span>
        <h1>{parsed.memo || "Payment request"}</h1>
        <p className="invoice__total">
          <span>Total</span>
          <strong>${parsed.amount} USDC</strong>
        </p>
      </header>

      <WhiskSend
        amount={parsed.amount}
        recipient={parsed.to}
        sourceChain={parsed.chain}
        destinationChain={parsed.chain}
      />

      <p className="invoice__note">
        All four fields locked from the URL — no edits, no chain swap.
      </p>
    </div>
  );
}
