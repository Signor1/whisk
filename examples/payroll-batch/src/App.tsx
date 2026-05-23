import { useState } from "react";
import { WhiskSend } from "@usewhisk/react";
import { Providers } from "./providers";

type Payee = {
  id: string;
  name: string;
  role: string;
  address: string;
  amount: string;
};

const PAYEES: Payee[] = [
  {
    id: "p1",
    name: "Ada Lovelace",
    role: "Senior engineer",
    address: "0x5B8ecaB7096F8aBED873D246629ef9f05f467605",
    amount: "1200",
  },
  {
    id: "p2",
    name: "Alan Turing",
    role: "Research lead",
    address: "0xbe03CE0Bb0fF87fC57E0B9a4F3E7E70b53e70Fe2",
    amount: "950",
  },
  {
    id: "p3",
    name: "Grace Hopper",
    role: "Compiler maintainer",
    address: "0xd9dB123456789AbcDef0123456789aBCdef0E645",
    amount: "880",
  },
];

export function App() {
  const [active, setActive] = useState<Payee | null>(null);
  // Track which payees have been paid this cycle. In a real app this
  // is server-state — paint by webhook receipts and persist in your DB.
  const [paid, setPaid] = useState<Record<string, string>>({});

  const handleSuccess = (id: string, txHash?: string) => {
    setPaid((p) => ({ ...p, [id]: txHash ?? "ok" }));
    setActive(null);
  };

  return (
    <Providers>
      <main className="page">
        <header className="page__header">
          <span className="page__brand">
            <span className="page__brand-dot" aria-hidden="true" />
            whisk · payroll
          </span>
          <span className="page__tag">vite + react</span>
        </header>

        <section className="page__intro">
          <h1>Pay your team in USDC</h1>
          <p>
            Click a row to load Whisk pre-filled with that payee. Confirm once
            per person — the dashboard ticks them off as the on-chain receipts
            come back.
          </p>
        </section>

        <section className="layout">
          <div className="payee-list">
            <header className="payee-list__head">
              <span>Payees · cycle 0509</span>
              <span>
                {Object.keys(paid).length}/{PAYEES.length} paid
              </span>
            </header>
            {PAYEES.map((p) => {
              const isPaid = Boolean(paid[p.id]);
              const isActive = active?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={
                    "payee" +
                    (isActive ? " payee--active" : "") +
                    (isPaid ? " payee--paid" : "")
                  }
                  onClick={() => !isPaid && setActive(p)}
                  disabled={isPaid}
                >
                  <span className="payee__avatar" aria-hidden="true">
                    {p.name
                      .split(" ")
                      .map((s) => s[0])
                      .join("")}
                  </span>
                  <span className="payee__main">
                    <span className="payee__name">{p.name}</span>
                    <span className="payee__role">{p.role}</span>
                  </span>
                  <span className="payee__amount">
                    {p.amount} <span>USDC</span>
                  </span>
                  {isPaid ? <span className="payee__badge">Paid</span> : null}
                </button>
              );
            })}
          </div>

          <div className="widget-slot">
            {active ? (
              <>
                <header className="widget-slot__head">
                  <h2>Pay {active.name}</h2>
                  <button
                    type="button"
                    className="widget-slot__cancel"
                    onClick={() => setActive(null)}
                  >
                    cancel
                  </button>
                </header>
                <WhiskSend
                  amount={active.amount}
                  recipient={active.address}
                  sourceChain="Arc_Testnet"
                  destinationChain="Arc_Testnet"
                  onSuccess={({ finalTxHash }) =>
                    handleSuccess(active.id, finalTxHash)
                  }
                />
              </>
            ) : (
              <div className="widget-slot__empty">
                Select a payee to load the widget.
              </div>
            )}
          </div>
        </section>
      </main>
    </Providers>
  );
}
