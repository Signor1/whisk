import { DEMO_INVOICES } from "../data/demo-invoices";

export function EmptyState() {
  return (
    <article className="mx-auto flex w-full max-w-[760px] flex-col gap-5 rounded-2xl border border-dashed border-line-strong bg-paper p-7 sm:p-10">
      <Header />
      <DemoLinks />
      <UrlExample />
      <a
        href="/create"
        className="self-start rounded-full bg-coral px-5 py-2.5 text-[13px] font-medium text-paper hover:bg-coral-deep"
      >
        Compose your own →
      </a>
    </article>
  );
}

function Header() {
  return (
    <header className="flex flex-col gap-2">
      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-peach/40 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-coral-deep">
        <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-coral" />
        No invoice loaded
      </span>
      <h1 className="m-0 font-display text-[2.4rem] leading-[1.05] tracking-tight text-ink sm:text-[2.8rem]">
        This page reads from the URL.
      </h1>
      <p className="m-0 max-w-xl text-[15px] leading-relaxed text-ink-soft">
        Customers land here from a shareable link with the amount, recipient,
        chain, and memo encoded as query params. Try one of these demo invoices
        to see how it looks:
      </p>
    </header>
  );
}

function DemoLinks() {
  return (
    <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-3">
      {DEMO_INVOICES.map((demo) => {
        const search = new URLSearchParams({
          to: demo.to,
          amount: demo.amount,
          chain: demo.chain,
          memo: demo.memo,
        }).toString();
        return (
          <li key={demo.memo}>
            <a
              href={`/?${search}`}
              className="flex h-full flex-col gap-1.5 rounded-xl border border-line bg-cream-2/40 p-4 transition-all hover:-translate-y-0.5 hover:border-coral hover:bg-paper hover:shadow-[0_8px_24px_-12px_rgba(232,90,61,0.25)]"
            >
              <span className="font-display text-[14px] text-ink">
                {demo.label}
              </span>
              <span className="font-display text-[1.4rem] text-coral-deep">
                ${Number(demo.amount).toLocaleString()}
              </span>
              <span className="mt-auto text-[11px] uppercase tracking-wider text-ink-muted">
                {demo.chain.replace("_", " ")}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function UrlExample() {
  return (
    <div className="rounded-md border border-line bg-cream-2/40 p-3 font-mono text-[12px] text-ink-soft">
      <span className="text-coral-deep">URL shape</span>{" "}
      <code>?to=0x…&amount=…&chain=Arc_Testnet&memo=…</code>
    </div>
  );
}
