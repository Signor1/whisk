import type { ConfirmedDonation } from "../hooks/use-donation";

export type ThankYouProps = {
  confirmed: ConfirmedDonation;
  onAgain: () => void;
};

export function ThankYou({ confirmed, onAgain }: ThankYouProps) {
  const { amount, txHash, trees } = confirmed;
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-xl bg-mist p-6 text-center"
      style={{ animation: "of-fade-in 360ms ease-out" }}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-moss text-[1.4rem] text-paper">
        🌱
      </span>
      <span className="text-[11px] uppercase tracking-[0.18em] text-moss">
        Confirmed · added to ledger
      </span>
      <h3 className="m-0 font-display text-2xl text-canopy">
        Thank you — that's {treeCopy(trees)} planted.
      </h3>
      <p className="m-0 max-w-sm text-[14px] leading-relaxed text-ink-soft">
        Your ${amount ?? ""} USDC will be tagged to a sapling in our next
        planting cycle. We email GPS coords within 48h.
      </p>
      {txHash && (
        <a
          href={`https://testnet.arcscan.app/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[12px] text-moss underline-offset-2 hover:underline"
        >
          {txHash.slice(0, 12)}…{txHash.slice(-6)} ↗
        </a>
      )}
      <button
        type="button"
        onClick={onAgain}
        className="mt-2 rounded-full border border-moss bg-transparent px-4 py-2 text-[13px] text-moss hover:bg-moss hover:text-paper"
      >
        Plant another →
      </button>
    </div>
  );
}

function treeCopy(trees: number | null): string {
  if (trees === null) return "your contribution";
  if (trees === 1) return "1 tree";
  return `${trees} trees`;
}
