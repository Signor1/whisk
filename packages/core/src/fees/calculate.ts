import type { FeeBreakdown, FeeEntry, FeePolicy } from "../types/fee.js";
import type { Token } from "../types/token.js";

/**
 * Shape of an entry returned by App Kit's `EstimateResult.fees` array. We
 * inline the type so we don't pull a dependency on App Kit's
 * `EstimateResult` interface into the public surface of `@whisk-core/fees`.
 */
export type AppKitEstimateFee = {
  type: "kit" | "provider" | "forwarder" | "gasFee";
  token: "USDC" | string;
  amount: string | null;
  error?: unknown;
};

/**
 * Convert a raw `FeePolicy` into the absolute USDC amount the host
 * collects on this transfer (Send and Bridge paths).
 *
 * Per Circle's App Kit policy, this whole amount is added on top of the
 * transfer; the platform splits 90/10 between the host's `recipient` and
 * Arc behind the scenes. Whisk reflects the split in `entries` so the UI
 * can display it accurately.
 */
export function buildCustomFeeEntries(
  policy: FeePolicy | undefined,
  token: Token,
): FeeEntry[] {
  if (!policy?.value || policy.value === "0") return [];
  const total = parseFloat(policy.value);
  if (Number.isNaN(total) || total <= 0) return [];
  // Split 90/10 — purely informational for the UI. The actual split is
  // performed on-chain by App Kit; we just describe what's happening.
  const hostShare = formatAmount(total * 0.9);
  const arcShare = formatAmount(total * 0.1);
  return [
    {
      kind: "custom",
      amount: hostShare,
      token,
      recipient: policy.recipient,
      description: "Host fee (90%)",
    },
    {
      kind: "custom",
      amount: arcShare,
      token,
      description: "Arc share (10%)",
    },
  ];
}

/**
 * Translate App Kit's `EstimateResult.fees` into Whisk's `FeeEntry[]`.
 *
 * App Kit's fee shape is `{ type: 'kit' | 'provider' | 'forwarder', token,
 * amount: string | null }`; Whisk normalises those into its own
 * `FeeEntryKind` so the React layer renders one unified breakdown. Entries
 * with `amount: null` (the SDK couldn't price them) are dropped — surfacing
 * "unknown" cells in the UI is more confusing than just omitting the row.
 */
export function fromAppKitFees(
  fees: ReadonlyArray<AppKitEstimateFee>,
  defaultToken: Token,
): FeeEntry[] {
  const entries: FeeEntry[] = [];
  for (const f of fees) {
    if (f.amount == null) continue;
    entries.push({
      kind: mapAppKitFeeType(f.type),
      amount: f.amount,
      token: (f.token as Token) ?? defaultToken,
    });
  }
  return entries;
}

function mapAppKitFeeType(
  type: AppKitEstimateFee["type"],
): FeeEntry["kind"] {
  switch (type) {
    case "provider":
      return "provider";
    case "gasFee":
      return "gas";
    case "forwarder":
      return "forwarder";
    case "kit":
      // App Kit's "kit" fees are SDK / kit overhead — bucket them as
      // protocol fees in the unified UI.
      return "protocol";
    default:
      return "protocol";
  }
}

/**
 * Sum a list of fee entries into a single `FeeBreakdown`. Only entries
 * denominated in `token` are summed; cross-token entries (e.g. native gas
 * paid in ETH) are still included in `entries` so the UI can list them
 * separately, but they don't roll into the USDC `total`.
 */
export function sumFees(entries: FeeEntry[], token: Token): FeeBreakdown {
  const total = entries
    .filter((e) => e.token === token)
    .reduce((acc, e) => acc + parseFloat(e.amount || "0"), 0);
  return {
    total: formatAmount(total),
    token,
    entries,
  };
}

function formatAmount(n: number): string {
  // Six decimal places (USDC's precision), trimmed of trailing zeros.
  const fixed = n.toFixed(6);
  return fixed.replace(/\.?0+$/, "") || "0";
}
