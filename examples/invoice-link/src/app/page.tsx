import { ClientGate } from "./client-gate";

export default function Page() {
  return (
    <main>
      <header className="page__header">
        <span className="page__brand">
          <span className="page__brand-dot" aria-hidden="true" />
          whisk · invoice
        </span>
        <nav style={{ display: "flex", gap: "1rem", fontSize: "0.875rem" }}>
          <a href="/" style={{ opacity: 0.7 }}>
            customer view
          </a>
          <a href="/create" style={{ opacity: 0.7 }}>
            create link →
          </a>
        </nav>
      </header>

      <section className="page__stage">
        <ClientGate />
      </section>

      <footer className="page__footer">
        Pre-fill via URL params:{" "}
        <code>?to=0x…&amount=49.99&chain=Arc_Testnet&memo=…</code>
      </footer>
    </main>
  );
}
