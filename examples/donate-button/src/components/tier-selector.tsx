import { TIERS, type Tier } from "../data/tiers";
import type { DonationSelection } from "../hooks/use-donation";

export type TierSelectorProps = {
  selection: DonationSelection;
  onPickTier: (tier: Tier) => void;
  onPickCustom: () => void;
};

export function TierSelector({
  selection,
  onPickTier,
  onPickCustom,
}: TierSelectorProps) {
  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {TIERS.map((tier) => (
          <TierButton
            key={tier.amount}
            tier={tier}
            active={
              selection.kind === "tier" && selection.tier.amount === tier.amount
            }
            onSelect={() => onPickTier(tier)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onPickCustom}
        aria-pressed={selection.kind === "custom"}
        className={
          "mt-2 w-full rounded-xl border border-dashed py-2.5 text-[13px] transition-colors " +
          (selection.kind === "custom"
            ? "border-moss bg-mist text-canopy"
            : "border-line text-ink-muted hover:border-fern hover:text-canopy")
        }
      >
        + Choose your own amount
      </button>
    </>
  );
}

function TierButton({
  tier,
  active,
  onSelect,
}: {
  tier: Tier;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={
        "flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all " +
        (active
          ? "border-moss bg-moss text-paper shadow-[0_6px_22px_-10px_rgba(45,90,61,0.5)]"
          : "border-line bg-paper hover:-translate-y-0.5 hover:border-fern hover:shadow-[0_4px_18px_-12px_rgba(45,90,61,0.3)]")
      }
    >
      <span
        className={
          "text-[10px] uppercase tracking-[0.16em] " +
          (active ? "text-leaf" : "text-fern")
        }
      >
        {tier.label}
      </span>
      <span className="font-display text-[1.7rem] leading-none">
        ${tier.amount}
      </span>
      <span
        className={
          "mt-1 text-[12px] leading-snug " +
          (active ? "text-mist" : "text-ink-muted")
        }
      >
        {tier.caption}
      </span>
    </button>
  );
}
