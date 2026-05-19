import { CreateClientGate } from "./client-gate";

export default function CreatePage() {
  return (
    <main>
      <header className="page__header">
        <a href="/" className="page__brand">
          <span className="page__brand-dot" aria-hidden="true" />
          whisk · invoice
        </a>
        <span className="page__tag">merchant view</span>
      </header>

      <section className="page__stage">
        <CreateClientGate />
      </section>

      <footer className="page__footer">
        Compose a payment link, share it, get paid. Customers open the link and
        Whisk pre-fills.
      </footer>
    </main>
  );
}
