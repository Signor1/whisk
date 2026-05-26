import type { Chain } from "@usewhisk/react";

/**
 * Result of parsing the invoice query string. `valid: true` means every
 * required field is present and the chain resolved to a known network —
 * consumers can pass the resolved values straight into `<WhiskSend>`.
 */
export type InvoiceQuery =
  | {
      valid: true;
      to: string;
      amount: string;
      chain: Chain;
      chainLabel: string;
      memo: string;
    }
  | {
      valid: false;
      /** Why the parse failed, useful for surfacing to the merchant. */
      reason: "missing-to" | "missing-amount" | "unknown-chain" | "missing";
    };

export type DemoInvoice = {
  label: string;
  memo: string;
  amount: string;
  chain: string;
  to: string;
};
