import { useCallback, useState } from "react";
import type { Vendor } from "../data/vendors";

export type PayoutState =
  | { kind: "idle" }
  | { kind: "selected"; vendor: Vendor }
  | { kind: "confirmed"; vendor: Vendor; txHash?: string };

/**
 * Payout flow for the quick-send panel. Selecting a vendor primes the widget
 * with that vendor's amount + recipient; `confirm` flips into the receipt
 * state with the settlement tx. `reset` clears back to idle.
 */
export function usePayout() {
  const [state, setState] = useState<PayoutState>({ kind: "idle" });

  const select = useCallback((vendor: Vendor) => {
    setState({ kind: "selected", vendor });
  }, []);

  const confirm = useCallback((txHash?: string) => {
    setState((prev) => {
      if (prev.kind !== "selected") return prev;
      return { kind: "confirmed", vendor: prev.vendor, txHash };
    });
  }, []);

  const reset = useCallback(() => setState({ kind: "idle" }), []);

  return { state, select, confirm, reset };
}
