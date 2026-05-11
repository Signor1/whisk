"use client";

import { WhiskSend } from "@signordev/whisk-react";

const STATS = [
  { label: "Total transferred", value: "$48,210", delta: "+12.4%" },
  { label: "Active payees", value: "23", delta: "+3" },
  { label: "Avg. settlement", value: "31s", delta: "−4s" },
];

export function Dashboard() {
  return (
    <div className="dashboard">
      <header className="dashboard__top">
        <div>
          <h1>Treasury</h1>
          <p>Send USDC to vendors and contractors. Settles in seconds.</p>
        </div>
        <div className="dashboard__top-meta">
          <span className="dashboard__pill">Q2 · 2026</span>
          <span className="dashboard__pill dashboard__pill--accent">Live</span>
        </div>
      </header>

      <section className="dashboard__stats">
        {STATS.map((s) => (
          <article key={s.label} className="dashboard__stat">
            <span className="dashboard__stat-label">{s.label}</span>
            <span className="dashboard__stat-value">{s.value}</span>
            <span className="dashboard__stat-delta">{s.delta}</span>
          </article>
        ))}
      </section>

      <section className="dashboard__main">
        <article className="dashboard__panel">
          <header>
            <h2>Recent settlements</h2>
            <span className="dashboard__pill">Last 7 days</span>
          </header>
          <ul className="dashboard__rows">
            {RECENT.map((r) => (
              <li key={r.tx} className="dashboard__row">
                <span className="dashboard__row-name">{r.name}</span>
                <span className="dashboard__row-meta">
                  {r.amount} USDC · {r.chain}
                </span>
                <span className="dashboard__row-time">{r.when}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="dashboard__panel dashboard__panel--accent">
          <header>
            <h2>Quick send</h2>
          </header>
          <WhiskSend showFooter={false} />
        </article>
      </section>
    </div>
  );
}

const RECENT = [
  { tx: "0x1", name: "Acme Studios", amount: "1,200", chain: "Arc Testnet", when: "2m ago" },
  { tx: "0x2", name: "Northwind Inc.", amount: "560", chain: "Base Sepolia", when: "1h ago" },
  { tx: "0x3", name: "Crypto Cafe", amount: "85", chain: "Arc Testnet", when: "3h ago" },
  { tx: "0x4", name: "Pixel Logistics", amount: "2,400", chain: "Base Sepolia", when: "yesterday" },
];
