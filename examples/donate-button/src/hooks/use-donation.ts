import { useCallback, useState } from "react";
import type { Tier } from "../data/tiers";
import { TIERS } from "../data/tiers";

export type DonationSelection =
  | { kind: "tier"; tier: Tier }
  | { kind: "custom" };

export type ConfirmedDonation = {
  amount?: string;
  txHash?: string;
  /** Trees the donor's payment maps to. Null when custom mode (we don't know). */
  trees: number | null;
};

/**
 * Donation flow state. The tier-vs-custom split matters: tiers feed the widget
 * a controlled `amount` (locks the field), custom mode omits it entirely so
 * the donor types whatever they like.
 */
export function useDonation() {
  const [selection, setSelection] = useState<DonationSelection>({
    kind: "tier",
    tier: TIERS[1]!,
  });
  const [confirmed, setConfirmed] = useState<ConfirmedDonation | null>(null);

  const pickTier = useCallback((tier: Tier) => {
    setSelection({ kind: "tier", tier });
  }, []);

  const pickCustom = useCallback(() => {
    setSelection({ kind: "custom" });
  }, []);

  const confirm = useCallback(
    (paid: { amount?: string; txHash?: string }) => {
      setConfirmed({
        amount: paid.amount,
        txHash: paid.txHash,
        trees: selection.kind === "tier" ? selection.tier.trees : null,
      });
    },
    [selection],
  );

  const reset = useCallback(() => setConfirmed(null), []);

  /**
   * The widget receives `amount` (controlled, locks the input) when a tier is
   * selected. In custom mode it receives nothing — the donor types their own.
   */
  const widgetAmount =
    selection.kind === "tier" ? selection.tier.amount : undefined;

  return {
    selection,
    confirmed,
    widgetAmount,
    pickTier,
    pickCustom,
    confirm,
    reset,
  };
}
