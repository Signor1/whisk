import { chainEntry } from "./chain-registry";

/**
 * Inline pill for prose: icon + chain name. Use inside MDX paragraphs
 * for cross-chain examples ("bridge from <ChainBadge chain='Base' />
 * to <ChainBadge chain='Arbitrum' />").
 *
 * Accepts the friendly label ("Base Sepolia") or the kebab id
 * ("base-sepolia").
 */
export function ChainBadge({ chain }: { chain: string }) {
  const entry = chainEntry(chain);
  if (!entry) return <code>{chain}</code>;
  const { Icon, label } = entry;
  return (
    <span className="not-prose inline-flex items-center gap-1.5 rounded-full border border-fd-border bg-fd-card px-2 py-0.5 align-middle text-[0.82em] font-medium text-fd-foreground">
      <Icon size={14} variant="branded" aria-hidden="true" />
      {label}
    </span>
  );
}
