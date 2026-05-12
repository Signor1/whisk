import { ClientGate } from "./client-gate";

/**
 * Server component for the page chrome. The playground itself ships
 * through `<ClientGate />`, which is the client boundary that
 * dynamically loads the full wagmi + Whisk + controls + log stack
 * with `ssr: false`.
 */
export default function Page() {
  return (
    <div className="pg-shell">
      <header className="pg-header">
        <span className="pg-brand">
          <span className="pg-brand__dot" aria-hidden="true" />
          <strong>whisk</strong>
          <span className="pg-brand__sep" aria-hidden="true">
            ·
          </span>
          playground
        </span>
        <nav className="pg-header__nav">
          <a
            href="https://whisk.vercel.app/docs"
            target="_blank"
            rel="noreferrer"
          >
            Docs ↗
          </a>
          <a
            href="https://github.com/Signor1/whisk"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
          <a
            href="https://faucet.circle.com"
            target="_blank"
            rel="noreferrer"
          >
            USDC faucet ↗
          </a>
        </nav>
      </header>

      <ClientGate />

      <footer className="pg-footer">
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
      </footer>
    </div>
  );
}
