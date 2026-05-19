import { ClientGate } from "./client-gate";

export default function Page() {
  return (
    <main>
      <header className="storefront__nav">
        <span className="storefront__brand">
          <span className="storefront__brand-dot" aria-hidden="true" />
          <span>whisk · goods</span>
        </span>
        <nav className="storefront__nav-links">
          <a href="#shop">Shop</a>
          <a
            href="https://github.com/Signor1/whisk"
            target="_blank"
            rel="noreferrer"
          >
            Github
          </a>
        </nav>
      </header>

      <section className="storefront__hero" id="shop">
        <h1>Pay-with-USDC storefront, in production-shape.</h1>
        <p>
          A real e-commerce flow built around <code>&lt;WhiskSend /&gt;</code>.
          Pick a product, confirm, settle on Arc Testnet — no card form, no
          merchant gateway, no chargebacks.
        </p>
      </section>

      <section className="storefront__stage">
        <ClientGate />
      </section>

      <footer className="storefront__footer">
        Demo only · merchant address + <code>amount</code> are pinned via
        Whisk's controlled props
      </footer>
    </main>
  );
}
