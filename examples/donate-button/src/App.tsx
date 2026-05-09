import { useState } from "react";
import { WhiskSend } from "@strimz/whisk-react";
import { Providers } from "./providers";

const TREASURY_ADDRESS = "0x5B8ecaB7096F8aBED873D246629ef9f05f467605";

const SUGGESTED_AMOUNTS = ["5", "25", "100"];

const IMPACT = [
  { label: "Maintainers funded this year", value: "42" },
  { label: "Donations received", value: "$128k" },
  { label: "Countries represented", value: "9" },
  { label: "Avg. settlement", value: "31s" },
];

const RECENT_DONORS = [
  { who: "alice.eth", amount: "100", chain: "Base Sepolia", when: "12m ago" },
  { who: "0xab12…f04c", amount: "25", chain: "Arc Testnet", when: "1h ago" },
  { who: "Anonymous", amount: "5", chain: "Ethereum Sepolia", when: "3h ago" },
  { who: "vitalik.eth", amount: "250", chain: "Arc Testnet", when: "yesterday" },
];

export function App() {
  const [thanked, setThanked] = useState<{
    amount?: string;
    txHash?: string;
  } | null>(null);
  const [defaultAmount, setDefaultAmount] = useState<string | undefined>();

  return (
    <Providers>
      <main className="page">
        <header className="page__nav">
          <span className="page__brand">
            <span className="page__brand-dot" aria-hidden="true" />
            <span>wave · open source fund</span>
          </span>
          <nav className="page__nav-links">
            <a href="#mission">Mission</a>
            <a href="#donate">Donate</a>
            <a href="#donors">Donors</a>
          </nav>
        </header>

        <section className="hero" id="mission">
          <span className="hero__eyebrow">A non-profit · est. 2024</span>
          <h1>
            Open-source maintainers, paid in&nbsp;stablecoins.
          </h1>
          <p>
            Every dollar you contribute goes directly to a developer who
            keeps the protocols you depend on running. No platforms,
            no payment processors, no exchange fees — USDC on-chain,
            settled in seconds.
          </p>
        </section>

        <section className="impact">
          {IMPACT.map((stat) => (
            <article key={stat.label} className="impact__stat">
              <span className="impact__value">{stat.value}</span>
              <span className="impact__label">{stat.label}</span>
            </article>
          ))}
        </section>

        <section className="layout" id="donate">
          <article className="donation-card">
            <header>
              <span className="donation-card__eyebrow">Make a contribution</span>
              <h2>Pick an amount, send it on the chain that's cheapest for you.</h2>
              <p>
                Recipient address is pinned to our treasury — you control
                the chain and the amount.
              </p>
            </header>

            <div className="donation-card__shortcuts">
              {SUGGESTED_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={
                    "chip" +
                    (defaultAmount === value ? " chip--active" : "")
                  }
                  onClick={() => setDefaultAmount(value)}
                >
                  ${value}
                </button>
              ))}
              <button
                type="button"
                className={
                  "chip chip--ghost" +
                  (defaultAmount === undefined ? " chip--active" : "")
                }
                onClick={() => setDefaultAmount(undefined)}
              >
                custom
              </button>
            </div>

            {thanked ? (
              <div className="thanks">
                <span className="thanks__badge">Confirmed on-chain</span>
                <h3>Thank you 🧡</h3>
                <p>
                  Your contribution{" "}
                  {thanked.amount ? `of $${thanked.amount} ` : ""}
                  landed. We'll publish the funded grants this quarter
                  in our public ledger.
                </p>
                <button
                  type="button"
                  className="chip"
                  onClick={() => setThanked(null)}
                >
                  Send another
                </button>
              </div>
            ) : (
              <WhiskSend
                recipient={TREASURY_ADDRESS}
                defaultAmount={defaultAmount}
                onSuccess={({ quote, finalTxHash }) =>
                  setThanked({
                    amount: quote.amountIn,
                    txHash: finalTxHash,
                  })
                }
              />
            )}
          </article>

          <aside className="recent" id="donors">
            <header>
              <h2>Recent donations</h2>
              <span className="page__pill">Public ledger</span>
            </header>
            <ul>
              {RECENT_DONORS.map((d, i) => (
                <li key={i}>
                  <span className="recent__who">{d.who}</span>
                  <span className="recent__amount">
                    {d.amount} <span>USDC</span>
                  </span>
                  <span className="recent__meta">
                    {d.chain} · {d.when}
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <footer className="page__footer">
          Built with{" "}
          <a
            href="https://github.com/Signor1/whisk"
            target="_blank"
            rel="noreferrer"
          >
            whisk
          </a>
          . Recipient locked via the <code>recipient</code> prop.
        </footer>
      </main>
    </Providers>
  );
}
