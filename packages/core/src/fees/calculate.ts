import type {
  FeeBreakdown,
  FeeEntry,
  FeeEntryKind,
  FeePolicy,
} from "../types/fee.js";
import type { Token } from "../types/token.js";

export type AppKitEstimateFee = {
  type: "kit" | "provider" | "forwarder" | "gasFee";
  token: "USDC" | string;
  amount: string | null;
  error?: unknown;
};

/** Host 90% / Arc 10%. The actual split happens on-chain; entries are informational. */
export function buildCustomFeeEntries(
  policy: FeePolicy | undefined,
  token: Token,
): FeeEntry[] {
  if (!policy?.value || policy.value === "0") return [];
  const total = parseFloat(policy.value);
  if (Number.isNaN(total) || total <= 0) return [];
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

function mapAppKitFeeType(type: AppKitEstimateFee["type"]): FeeEntry["kind"] {
  switch (type) {
    case "provider":
      return "provider";
    case "gasFee":
      return "gas";
    case "forwarder":
      return "forwarder";
    case "kit":
      return "protocol";
    default:
      return "protocol";
  }
}

/**
 * Fee kinds deducted from the bridged USDC, i.e. the ones that reduce what the
 * recipient receives. Excludes `gas` (paid in the source chain's native token)
 * and `custom` (the host fee, added on top of the transfer).
 */
const DEDUCTED_FROM_TRANSFER: ReadonlyArray<FeeEntryKind> = [
  "provider",
  "forwarder",
  "protocol",
];

/**
 * Total of the fees deducted from the bridged amount, in the transfer token.
 * Used to gross up the burn when `feeBearer` is `"sender"` so the recipient
 * still nets the full amount.
 */
export function sumProtocolFees(entries: FeeEntry[], token: Token): number {
  return entries
    .filter((e) => e.token === token && DEDUCTED_FROM_TRANSFER.includes(e.kind))
    .reduce((acc, e) => acc + (parseFloat(e.amount || "0") || 0), 0);
}

/**
 * Just the Forwarding Service fee, in the transfer token. Isolated from the
 * other deducted fees because it's gas-priced at mint time, so it's the only
 * part the `"sender"` gross-up cushions against drift.
 */
export function sumForwarderFees(entries: FeeEntry[], token: Token): number {
  return entries
    .filter((e) => e.token === token && e.kind === "forwarder")
    .reduce((acc, e) => acc + (parseFloat(e.amount || "0") || 0), 0);
}

/** Cross-token entries (e.g. gas in ETH) stay in `entries` but don't roll into `total`. */
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
  // USDC precision (6 dp), trailing zeros stripped.
  const fixed = n.toFixed(6);
  return fixed.replace(/\.?0+$/, "") || "0";
}
