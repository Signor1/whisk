import { ClientGate } from "./client-gate";

/**
 * Server component for the page chrome. The widget itself ships through
 * `<ClientGate />`, which is the client boundary that lazy-loads the
 * full wagmi + Whisk stack with `ssr: false`.
 */

export default function Page() {
  return (
    <main>
      <header className="example-header">
        <span className="example-brand">
          <span className="example-brand__dot" aria-hidden="true" />
          whisk · example
        </span>
        <a
          href="https://github.com/Signor1/whisk"
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: "0.75rem", opacity: 0.6, color: "inherit" }}
        >
          github ↗
        </a>
      </header>

      <section className="example-stage">
        <div>
          <div className="example-intro">
            <h1>Send & bridge USDC, one component.</h1>
            <p>
              Connect a wallet, pick chains, send. Bridge transfers run
              across CCTP under the hood.
            </p>
            <div className="example-meta">
              <span>Arc Testnet</span>
              <span>Base Sepolia</span>
              <span>Ethereum Sepolia</span>
              <span>Solana Devnet · v0.2</span>
            </div>
          </div>
          <ClientGate />
        </div>
      </section>

      <p className="example-footer">
        Powered by{" "}
        <a
          href="https://docs.arc.network/app-kit"
          target="_blank"
          rel="noreferrer"
        >
          Circle App Kit
        </a>
        {" · "}
        Open source on{" "}
        <a
          href="https://github.com/Signor1/whisk"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </p>
    </main>
  );
}
