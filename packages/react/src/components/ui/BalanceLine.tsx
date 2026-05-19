"use client";

export type BalanceLineProps = {
  /** Formatted token balance (already decimal-converted). */
  balance: string | undefined;
  /** Token symbol — usually `"USDC"`. */
  symbol?: string;
  /** Called when the user clicks Max. */
  onMax?: () => void;
  /** Disable Max (e.g. amount field is locked). */
  maxDisabled?: boolean;
};

/**
 * Renders under the Amount field. Shows live balance and a Max button
 * that pre-fills the field with the full balance value.
 */
export function BalanceLine({
  balance,
  symbol = "USDC",
  onMax,
  maxDisabled,
}: BalanceLineProps) {
  if (balance === undefined) return null;
  return (
    <div className="whisk-balance-line">
      <span>
        Balance:{" "}
        <span className="whisk-balance-line__amount">
          {formatBalance(balance)} {symbol}
        </span>
      </span>
      {onMax ? (
        <button
          type="button"
          className="whisk-balance-line__max"
          onClick={onMax}
          disabled={maxDisabled || balance === "0"}
        >
          Max
        </button>
      ) : null}
    </div>
  );
}

function formatBalance(raw: string): string {
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return raw;
  // Trim to 6 dp, drop trailing zeros, keep at least 2 dp for readability.
  const fixed = n.toFixed(6);
  const trimmed = fixed.replace(/\.?0+$/, "");
  if (!trimmed.includes(".")) return `${trimmed}.00`;
  const [whole, frac] = trimmed.split(".");
  return frac && frac.length < 2 ? `${whole}.${frac}0` : trimmed;
}
