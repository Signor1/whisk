import { VENDORS, type Vendor } from "../data/vendors";

export type VendorTableProps = {
  onSelect: (vendor: Vendor) => void;
};

export function VendorTable({ onSelect }: VendorTableProps) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-line bg-card/60 p-5 backdrop-blur-sm">
      <Header />
      <table className="w-full table-auto border-collapse text-left text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.12em] text-text-muted">
            <th className="py-2 font-normal">Vendor</th>
            <th className="py-2 font-normal">Cycle</th>
            <th className="py-2 font-normal">Chain</th>
            <th className="py-2 text-right font-normal">Amount</th>
            <th className="py-2 text-right font-normal">Next</th>
          </tr>
        </thead>
        <tbody>
          {VENDORS.map((vendor) => (
            <VendorRow
              key={vendor.id}
              vendor={vendor}
              onSelect={() => onSelect(vendor)}
            />
          ))}
        </tbody>
      </table>
    </article>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h2 className="m-0 font-display text-xl text-text">
          Scheduled vendors
        </h2>
        <p className="m-0 mt-0.5 text-[12px] text-text-muted">
          Click any row to fund the upcoming payout via Whisk.
        </p>
      </div>
      <button
        type="button"
        className="rounded-md border border-line-strong px-3 py-1.5 text-[12px] text-text-soft hover:border-foam hover:text-foam"
      >
        + Add vendor
      </button>
    </header>
  );
}

function VendorRow({
  vendor,
  onSelect,
}: {
  vendor: Vendor;
  onSelect: () => void;
}) {
  return (
    <tr
      onClick={onSelect}
      className="cursor-pointer border-t border-line transition-colors hover:bg-card-2/70"
    >
      <td className="py-3">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="block h-7 w-7 rounded-full"
            style={avatarStyle(vendor.id)}
          />
          <div className="flex flex-col leading-tight">
            <span className="text-text">{vendor.name}</span>
            <span className="font-mono text-[11px] text-text-muted">
              {vendor.handle}
            </span>
          </div>
        </div>
      </td>
      <td className="py-3 text-[12px] capitalize text-text-soft">
        {vendor.cycle}
      </td>
      <td className="py-3 text-[12px] text-text-soft">{vendor.chain}</td>
      <td className="py-3 text-right font-medium tabular-nums">
        ${Number(vendor.amount).toLocaleString()}
      </td>
      <td className="py-3 text-right text-[12px] text-text-soft">
        {vendor.next}
      </td>
    </tr>
  );
}

function avatarStyle(id: string): React.CSSProperties {
  const h1 = (id.charCodeAt(1) * 31) % 360;
  const h2 = (id.charCodeAt(1) * 71) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${h1} 50% 55%), hsl(${h2} 60% 35%))`,
  };
}
