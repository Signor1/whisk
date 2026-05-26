"use client";

export type LinkPreviewProps = {
  isValid: boolean;
  fullUrl: string | null;
  path: string | null;
  copied: boolean;
  onCopy: () => void;
};

export function LinkPreview({
  isValid,
  fullUrl,
  path,
  copied,
  onCopy,
}: LinkPreviewProps) {
  return (
    <aside className="flex flex-col gap-3 self-start rounded-2xl border border-line bg-cream-2/40 p-6 lg:sticky lg:top-5">
      <header className="flex items-center justify-between">
        <h2 className="m-0 font-display text-xl text-ink">Your link</h2>
        <span className="rounded-full border border-coral/30 bg-paper px-2.5 py-1 text-[11px] uppercase tracking-wider text-coral">
          Step 2 of 2
        </span>
      </header>

      {isValid && fullUrl && path ? (
        <ReadyPreview
          fullUrl={fullUrl}
          path={path}
          copied={copied}
          onCopy={onCopy}
        />
      ) : (
        <EmptyPreview />
      )}
    </aside>
  );
}

function ReadyPreview({
  fullUrl,
  path,
  copied,
  onCopy,
}: {
  fullUrl: string;
  path: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <>
      <div className="rounded-md border border-line bg-paper p-3">
        <p className="m-0 text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          Shareable URL
        </p>
        <code className="mt-1 block break-all font-mono text-[12px] text-coral-deep">
          {fullUrl}
        </code>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCopy}
          className="flex-1 rounded-lg bg-coral py-2.5 text-[13px] font-medium text-paper hover:bg-coral-deep"
        >
          {copied ? "✓ Copied" : "Copy link"}
        </button>
        <a
          href={path}
          className="flex-1 rounded-lg border border-line bg-paper py-2.5 text-center text-[13px] font-medium text-ink hover:border-coral hover:text-coral"
        >
          Preview →
        </a>
      </div>

      <Instructions />
    </>
  );
}

function Instructions() {
  return (
    <div className="mt-2 rounded-md bg-paper p-3 text-[12px] text-ink-soft">
      <p className="m-0 mb-1 text-[10px] uppercase tracking-[0.14em] text-ink-muted">
        How it works
      </p>
      <ol className="m-0 list-decimal space-y-1 pl-4">
        <li>Send the link to your client by email or DM.</li>
        <li>They open it on any device — no wallet install.</li>
        <li>Whisk pre-fills amount + chain. They tap Send.</li>
      </ol>
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-line-strong bg-paper p-6 text-center text-[13px] text-ink-muted">
      <span aria-hidden className="text-[2rem]">
        🌺
      </span>
      <p className="m-0">
        Fill in a valid 0x address and an amount — the link assembles itself.
      </p>
    </div>
  );
}
