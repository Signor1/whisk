import { MAINNETS, TESTNETS, type ChainEntry } from "./chain-registry";

/**
 * Two-section card grid showing every chain Whisk routes through.
 * Used in `/docs/api/chains` so visitors can see the actual supported
 * set instead of imagining it from a paragraph of names.
 */
export function SupportedChainsGrid() {
  return (
    <div className="not-prose my-8 space-y-8">
      <ChainSection title="Mainnets" entries={MAINNETS} />
      <ChainSection title="Testnets" entries={TESTNETS} />
    </div>
  );
}

function ChainSection({
  title,
  entries,
}: {
  title: string;
  entries: ChainEntry[];
}) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground">
        {title}{" "}
        <span className="text-fd-foreground/60">· {entries.length}</span>
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {entries.map(({ id, label, Icon }) => (
          <div
            key={id}
            className="flex items-center gap-2.5 rounded-lg border border-fd-border bg-fd-card px-3 py-2.5"
          >
            <Icon
              size={20}
              variant="branded"
              aria-hidden="true"
              className="shrink-0"
            />
            <span className="text-sm font-medium text-fd-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
