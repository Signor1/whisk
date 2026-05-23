"use client";

import {
  Heart,
  Inbox,
  Leaf,
  Search,
  Settings2,
  ShoppingBag,
  TreePine,
  User,
} from "lucide-react";
import {
  Breadcrumb,
  Mark,
  ProgressBar,
  SiteNav,
  StatusPill,
} from "./site-chrome";
import { WidgetMock, type WidgetTheme } from "./widget-mock";

/**
 * Five recipe shells, each a self-contained mini-site. The Whisk
 * widget mock sits natively inside the host site's payment slot, with
 * its `--whisk-*` CSS variables retuned to match.
 *
 * Controlled props (`recipient`, `amount`, `sourceChain`,
 * `destinationChain`) lock the corresponding field — exactly like the
 * real `<WhiskSend>`. Setting `defaultAmount` / `defaultRecipient`
 * seeds a value without locking it.
 *
 * Nothing here is interactive — the canvases live inside the recipes
 * showcase tabs and read as screenshots of real product pages.
 */

/* ============================================================================
 * Per-recipe palettes — applied as `--whisk-*` CSS variables on a
 * `[data-whisk]` wrapper, mirroring how a real host site re-themes the
 * widget in its own stylesheet.
 * ========================================================================= */

const editorialTheme: WidgetTheme = {
  bg: "#faf5ec",
  card: "#ffffff",
  fg: "#2a221c",
  fgMuted: "#7a6a58",
  border: "#e2d6c1",
  primary: "#2a221c",
  primaryFg: "#faf5ec",
  fieldBg: "#faf5ec",
  radius: "0.5rem",
};

const ecoTheme: WidgetTheme = {
  bg: "#f5f8ee",
  card: "#ffffff",
  fg: "#1f3024",
  fgMuted: "#5a6b58",
  border: "#cfd9c2",
  primary: "#2f6f3c",
  primaryFg: "#f7fbef",
  fieldBg: "#eef4e2",
  radius: "0.75rem",
};

const steelTheme: WidgetTheme = {
  bg: "#0a1320",
  card: "#111d2e",
  fg: "#e6edf6",
  fgMuted: "#8aa0bc",
  border: "#22344e",
  primary: "#3eb8e5",
  primaryFg: "#0a1320",
  fieldBg: "#0e1a2c",
  radius: "0.5rem",
};

const corporateTheme: WidgetTheme = {
  bg: "#f7f9fb",
  card: "#ffffff",
  fg: "#142733",
  fgMuted: "#506678",
  border: "#d4dde5",
  primary: "#0e7c8a",
  primaryFg: "#f2fbfc",
  fieldBg: "#f3f6f9",
  radius: "0.625rem",
};

const studioTheme: WidgetTheme = {
  bg: "#f3ecd6",
  card: "#fbf6e8",
  fg: "#56363d",
  fgMuted: "#7a5c63",
  border: "#cdb2a4",
  primary: "#d65c3c",
  primaryFg: "#fbf8ee",
  fieldBg: "#ebe0c1",
  radius: "1rem",
};

/* ============================================================================
 * 1. E-commerce checkout — atelier-hibiscus.com/checkout
 *    Editorial DTC palette: warm sand + charcoal.
 *    Locks: recipient, amount, sourceChain, destinationChain.
 * ========================================================================= */

export function EcommerceShell() {
  return (
    <div className="flex h-full flex-col bg-[#f4ede1] text-[#2a221c]">
      <SiteNav
        brand={
          <>
            <Mark color="#2a221c" />
            <span className="tracking-tight">atelier hibiscus</span>
          </>
        }
        links={["Shop", "Journal", "Stockists", "Account"]}
        trailing={
          <span className="inline-flex items-center gap-1.5 font-display text-[11px]">
            <ShoppingBag className="h-3.5 w-3.5" />3 items
          </span>
        }
        tokens={{ fg: "#2a221c", fgMuted: "#7a6a58", border: "#e2d6c1" }}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-display text-[11px] uppercase tracking-[0.15em] text-[#7a6a58]">
            <span>Cart</span>
            <span aria-hidden>›</span>
            <span>Shipping</span>
            <span aria-hidden>›</span>
            <span className="text-[#2a221c]">Payment</span>
          </div>
          <span className="font-display text-[10.5px] uppercase tracking-[0.15em] text-[#7a6a58]">
            Order #AT-23184
          </span>
        </div>

        <div className="mt-5 grid gap-6 sm:grid-cols-[1.25fr_1fr]">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Your order
            </h2>
            <div className="mt-3 space-y-2">
              <CartLine
                name="Linen camp shirt"
                variant="Ecru · M"
                qty={1}
                price="48.00"
                tone="#caa97a"
              />
              <CartLine
                name="Tortoise reading glasses"
                variant="Amber"
                qty={1}
                price="29.00"
                tone="#a88154"
              />
              <CartLine
                name="Ceramic candle"
                variant="Fig · 8oz"
                qty={1}
                price="10.00"
                tone="#9b8d7b"
              />
            </div>
            <dl className="mt-4 space-y-1 border-t border-[#e2d6c1] pt-4 text-[12.5px]">
              <Row label="Subtotal" value="$87.00" />
              <Row label="Shipping (DHL Express)" value="Free over $50" />
              <Row label="Tax" value="$0.00" muted />
              <Row label="Total" value="$87.00 USDC" big />
            </dl>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Payment
              </h2>
              <div className="inline-flex rounded-full border border-[#e2d6c1] bg-white p-0.5 text-[11px]">
                <span className="px-2.5 py-0.5 text-[#7a6a58]">Card</span>
                <span className="rounded-full bg-[#2a221c] px-2.5 py-0.5 text-[#f4ede1]">
                  USDC
                </span>
              </div>
            </div>
            <div className="mt-3 flex justify-center">
              <WidgetMock
                theme={editorialTheme}
                recipient="0xAtel…3a8e"
                amount="87.00"
                sourceChain="Base"
                destinationChain="Base"
                balance="312.40"
                cta="Pay $87.00"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartLine({
  name,
  variant,
  qty,
  price,
  tone,
}: {
  name: string;
  variant: string;
  qty: number;
  price: string;
  tone: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 ring-1 ring-[#e2d6c1]">
      <div className="flex items-center gap-3">
        <span
          className="h-10 w-10 rounded-md"
          style={{ backgroundColor: tone }}
        />
        <div>
          <div className="font-display text-[13px] font-medium">{name}</div>
          <div className="text-[10.5px] text-[#7a6a58]">
            {variant} · Qty {qty}
          </div>
        </div>
      </div>
      <span className="font-display text-[13px] font-semibold">
        ${(Number(price) * qty).toFixed(2)}
      </span>
    </div>
  );
}

function Row({
  label,
  value,
  big,
  muted,
}: {
  label: string;
  value: string;
  big?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-[#7a6a58]/70" : "text-[#7a6a58]"}>
        {label}
      </span>
      <span
        className={
          big
            ? "font-display text-[15px] font-semibold text-[#2a221c]"
            : "font-medium text-[#2a221c]"
        }
      >
        {value}
      </span>
    </div>
  );
}

/* ============================================================================
 * 2. Donate — support.openforest.org/donate
 *    Forest green + cream. Donor picks the amount, so the widget gets
 *    `defaultAmount` (seeded but editable) instead of `amount` (locked).
 *    Recipient + chains are locked to the org wallet.
 *    Preset amount tiles are HOST-rendered above the widget — they set
 *    the seeded `defaultAmount` for the widget to display.
 * ========================================================================= */

export function DonateShell() {
  return (
    <div className="flex h-full flex-col bg-[#eef2e6] text-[#1f3024]">
      <SiteNav
        brand={
          <>
            <TreePine className="h-4 w-4 text-[#2f6f3c]" />
            <span className="tracking-tight">OpenForest</span>
          </>
        }
        links={["About", "Projects", "Impact", "Donate"]}
        tokens={{ fg: "#1f3024", fgMuted: "#5a6b58", border: "#cfd9c2" }}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6">
        <div className="grid h-full gap-6 sm:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col">
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#3e8b50]/12 px-2.5 py-0.5 font-display text-[10.5px] font-medium uppercase tracking-wider text-[#2f6f3c]">
              <Leaf className="h-3 w-3" />
              Active campaign
            </div>
            <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">
              Plant 10,000 trees in 2026
            </h1>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-[#3a4a3b]">
              Restoring native forest across the Bukit Tigapuluh corridor. Every
              USDC funds one native seedling, one acre, and a year of
              monitoring.
            </p>

            <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-[#cfd9c2]">
              <div className="flex items-end justify-between">
                <div>
                  <div className="font-display text-2xl font-semibold text-[#1f3024]">
                    $42,180
                  </div>
                  <div className="text-[11px] text-[#5a6b58]">
                    of $100,000 raised
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-base font-semibold text-[#2f6f3c]">
                    1,247
                  </div>
                  <div className="text-[10.5px] uppercase tracking-wider text-[#5a6b58]">
                    backers
                  </div>
                </div>
              </div>
              <div className="mt-3 text-[#2f6f3c]">
                <ProgressBar
                  value={42180}
                  max={100000}
                  trackColor="rgb(31 48 36 / 0.08)"
                />
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-[#5a6b58]">
                <span className="inline-flex items-center -space-x-1.5">
                  {["#a88154", "#7a8a5f", "#5a6b58", "#caa97a"].map((c, i) => (
                    <span
                      key={i}
                      className="inline-block h-5 w-5 rounded-full ring-2 ring-white"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </span>
                <span>
                  <span className="font-medium text-[#1f3024]">aliyu.eth</span>{" "}
                  · 3 others donated in the last hour
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            {/* Host-rendered preset tiles. The selected value flows into
                the widget via `defaultAmount` — donor can still edit. */}
            <div className="mb-3 flex flex-wrap items-center justify-center gap-1.5">
              <span className="mr-1 text-[10.5px] uppercase tracking-wider text-[#5a6b58]">
                Quick amount
              </span>
              {["10", "25", "50", "100"].map((v) => {
                const active = v === "25";
                return (
                  <span
                    key={v}
                    className="inline-flex h-7 items-center rounded-full border px-3 text-[11.5px] font-medium"
                    style={{
                      backgroundColor: active ? "#2f6f3c" : "transparent",
                      borderColor: active ? "#2f6f3c" : "#cfd9c2",
                      color: active ? "#f7fbef" : "#1f3024",
                    }}
                  >
                    ${v}
                  </span>
                );
              })}
            </div>
            <WidgetMock
              theme={ecoTheme}
              recipient="openforest.eth"
              defaultAmount="25.00"
              sourceChain="Optimism"
              destinationChain="Optimism"
              balance="184.50"
              cta="Donate $25"
            />
            <p className="mt-3 max-w-xs text-center text-[10.5px] text-[#5a6b58]">
              Donor picks any amount. Treasury wallet + chain are locked to the
              foundation's address.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 3. Themed SaaS billing — app.steelpath.cloud/billing/feb-2026
 *    Cyan-on-navy dashboard. Recipient + amount + both chains locked.
 * ========================================================================= */

export function SaasShell() {
  return (
    <div className="flex h-full bg-[#0a1320] text-[#e6edf6]">
      <aside className="hidden w-12 shrink-0 flex-col items-center gap-3 border-r border-[#22344e] py-4 sm:flex">
        <span className="h-6 w-6 rounded-md bg-[#3eb8e5]" />
        <Settings2 className="h-3.5 w-3.5 text-[#8aa0bc]" />
        <Inbox className="h-3.5 w-3.5 text-[#8aa0bc]" />
        <User className="h-3.5 w-3.5 text-[#8aa0bc]" />
      </aside>

      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#22344e] px-5 py-3">
          <Breadcrumb
            color="#8aa0bc"
            items={[
              { label: "Settings" },
              { label: "Billing" },
              { label: "February 2026", current: true },
            ]}
          />
          <div className="hidden items-center gap-3 text-[11px] text-[#8aa0bc] sm:flex">
            <Search className="h-3.5 w-3.5" />
            <span className="rounded-md bg-[#111d2e] px-2 py-0.5 font-mono">
              ⌘K
            </span>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-8 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-xl font-semibold tracking-tight">
                February invoice
              </h1>
              <p className="mt-0.5 text-[12px] text-[#8aa0bc]">
                Steelpath Cloud · Workspace tier · INV-2026-02
              </p>
            </div>
            <StatusPill label="Past due" tone="warn" />
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-[1.15fr_1fr]">
            <div className="rounded-xl border border-[#22344e] bg-[#111d2e] p-4">
              <table className="w-full text-[12.5px]">
                <thead className="text-[10.5px] uppercase tracking-wider text-[#8aa0bc]">
                  <tr>
                    <th className="text-left font-medium">Line item</th>
                    <th className="text-right font-medium">Qty</th>
                    <th className="text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  <LineItem name="Active seats" qty="42" amount="$420.00" />
                  <LineItem name="Storage (GB)" qty="180" amount="$216.00" />
                  <LineItem
                    name="Support · Standard"
                    qty="1"
                    amount="$120.00"
                  />
                  <LineItem name="Edge minutes" qty="3,400" amount="$84.00" />
                </tbody>
              </table>
              <div className="mt-3 space-y-1 border-t border-[#22344e] pt-3 text-[12.5px]">
                <SaasRow label="Subtotal" value="$840.00" />
                <SaasRow label="Tax" value="$0.00" muted />
                <SaasRow label="Amount due" value="$840.00 USDC" big />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <WidgetMock
                theme={steelTheme}
                recipient="0xStee…71d2"
                amount="840.00"
                sourceChain="Arbitrum"
                destinationChain="Base"
                balance="2,460.00"
                cta="Pay $840.00"
              />
              <p className="mt-3 max-w-xs text-center text-[10.5px] text-[#8aa0bc]">
                Customer pays from Arbitrum, treasury settles on Base. Whisk
                bridges through CCTP automatically. One signature.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LineItem({
  name,
  qty,
  amount,
}: {
  name: string;
  qty: string;
  amount: string;
}) {
  return (
    <tr className="border-b border-[#22344e]/60 last:border-0">
      <td className="py-2 font-sans text-[#e6edf6]">{name}</td>
      <td className="py-2 text-right text-[#8aa0bc]">{qty}</td>
      <td className="py-2 text-right text-[#e6edf6]">{amount}</td>
    </tr>
  );
}

function SaasRow({
  label,
  value,
  big,
  muted,
}: {
  label: string;
  value: string;
  big?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-[#8aa0bc]/70" : "text-[#8aa0bc]"}>
        {label}
      </span>
      <span
        className={
          big
            ? "font-display text-[15px] font-semibold text-[#e6edf6]"
            : "font-medium text-[#e6edf6]"
        }
      >
        {value}
      </span>
    </div>
  );
}

/* ============================================================================
 * 4. Payroll — payroll.studio-fortune.app/runs/feb-2026
 *    Teal + slate HR tool. Widget remounts per row with that row's
 *    recipient + amount + chains all locked.
 * ========================================================================= */

export function PayrollShell() {
  const rows = [
    {
      id: "1",
      name: "Adaeze Okeke",
      role: "Engineer",
      country: "Nigeria",
      amount: "4,200",
      address: "0xAdae…b4f1",
      status: "ready" as const,
      active: true,
    },
    {
      id: "2",
      name: "Yuki Tanaka",
      role: "Designer",
      country: "Japan",
      amount: "3,800",
      address: "0xYuki…9c02",
      status: "ready" as const,
    },
    {
      id: "3",
      name: "Sam Cooper",
      role: "PM",
      country: "UK",
      amount: "3,500",
      address: "0xSam…5e7a",
      status: "sent" as const,
    },
    {
      id: "4",
      name: "Lena Vogel",
      role: "Engineer",
      country: "Germany",
      amount: "4,200",
      address: "0xLena…12a3",
      status: "ready" as const,
    },
  ];
  const active = rows.find((r) => r.active)!;
  return (
    <div className="flex h-full flex-col bg-[#f1f4f7] text-[#142733]">
      <SiteNav
        brand={
          <>
            <Mark shape="diamond" color="#0e7c8a" />
            <span className="tracking-tight">Studio Fortune · Payroll</span>
          </>
        }
        links={["Runs", "People", "Reports", "Settings"]}
        trailing={<User className="h-4 w-4 text-[#506678]" />}
        tokens={{ fg: "#142733", fgMuted: "#506678", border: "#d4dde5" }}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6">
        <div className="flex items-center justify-between">
          <Breadcrumb
            color="#506678"
            items={[
              { label: "Pay runs" },
              { label: "February 2026", current: true },
            ]}
          />
          <StatusPill label="1 of 4 sent" tone="primary" />
        </div>

        <div className="mt-3 flex items-center gap-4 text-[11.5px] text-[#506678]">
          <span>
            <strong className="text-[#142733]">4 payees</strong> · $15,700 total
            · Base → Polygon · USDC
          </span>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-[1.4fr_1fr]">
          <div className="overflow-x-auto rounded-xl border border-[#d4dde5] bg-white">
            <table className="w-full min-w-[28rem] text-[12.5px]">
              <thead className="bg-[#f7f9fb] text-[10.5px] uppercase tracking-wider text-[#506678]">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Payee</th>
                  <th className="px-3 py-2 text-left font-medium">Role</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                  <th className="px-3 py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-[#d4dde5]/70"
                    style={{
                      backgroundColor: r.active
                        ? "rgb(14 124 138 / 0.07)"
                        : undefined,
                    }}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#d4dde5] font-display text-[10.5px] font-semibold text-[#142733]">
                          {r.name
                            .split(" ")
                            .map((s) => s[0])
                            .join("")}
                        </span>
                        <div>
                          <div className="font-medium text-[#142733]">
                            {r.name}
                          </div>
                          <div className="text-[10.5px] text-[#506678]">
                            {r.country} · {r.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[#506678]">{r.role}</td>
                    <td className="px-3 py-2.5 text-right font-display font-semibold">
                      ${r.amount}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {r.status === "sent" ? (
                        <StatusPill label="Sent" tone="good" />
                      ) : r.active ? (
                        <StatusPill label="Selected" tone="primary" />
                      ) : (
                        <StatusPill label="Ready" tone="neutral" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-[#d4dde5] bg-[#f7f9fb] px-3 py-2 text-[10.5px] text-[#506678]">
              Widget remounts per row · <code>key=&#123;row.id&#125;</code> ·
              each send is locked to that row's address + amount.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <WidgetMock
              theme={corporateTheme}
              recipient={active.address}
              amount={active.amount.replace(",", "") + ".00"}
              sourceChain="Base"
              destinationChain="Polygon"
              balance="48,200.00"
              cta={`Send $${active.amount}`}
            />
            <p className="mt-3 max-w-xs text-center text-[10.5px] text-[#506678]">
              Treasury holds USDC on Base. Each payee receives on Polygon for
              lower fees. Bridge runs inside the widget.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 5. Invoice link — pay.studiohibiscus.com/i/2026-014
 *    Studio wine + cream. Everything pinned to the invoice record.
 * ========================================================================= */

export function InvoiceShell() {
  return (
    <div className="flex h-full flex-col bg-[#e7dfc8] text-[#56363d]">
      <SiteNav
        brand={
          <>
            <Heart className="h-4 w-4 text-[#d65c3c]" />
            <span className="tracking-tight">Studio Hibiscus</span>
          </>
        }
        links={["Work", "Services", "About"]}
        tokens={{ fg: "#56363d", fgMuted: "#7a5c63", border: "#cdb2a4" }}
      />

      <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-4 sm:px-10 sm:py-6">
        <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-[1.05fr_1fr]">
          <div className="rounded-2xl bg-[#fbf6e8] p-6 ring-1 ring-[#cdb2a4]">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-[10.5px] font-medium uppercase tracking-[0.15em] text-[#7a5c63]">
                  Invoice
                </div>
                <div className="font-display text-xl font-semibold tracking-tight text-[#56363d]">
                  #2026-014
                </div>
              </div>
              <StatusPill label="Awaiting payment" tone="warn" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-[11.5px]">
              <Block label="Issued" value="Jan 28, 2026" />
              <Block label="Due" value="Feb 11, 2026" />
              <Block
                label="From"
                value="Studio Hibiscus · hello@studiohibiscus.com"
              />
              <Block label="Bill to" value="ACME Marketing · ben@acme.co" />
            </div>

            <div className="mt-4 space-y-1.5 text-[12.5px]">
              <InvoiceLine
                label="Brand identity engagement"
                meta="Jan 5 – Jan 27"
                value="$1,050.00"
              />
              <InvoiceLine
                label="Website refresh"
                meta="Discovery + handoff"
                value="$200.00"
              />
              <InvoiceLine
                label="Discount"
                meta="Returning client"
                value="−$50.00"
                muted
              />
              <div className="my-2 h-px bg-[#cdb2a4]/70" />
              <div className="flex items-center justify-between">
                <span className="font-display text-[11px] uppercase tracking-wider text-[#7a5c63]">
                  Amount due
                </span>
                <span className="font-display text-xl font-semibold text-[#56363d]">
                  $1,200.00 USDC
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            <WidgetMock
              theme={studioTheme}
              recipient="hibiscus.eth"
              amount="1200.00"
              sourceChain="Solana"
              destinationChain="Base"
              balance="3,200.00"
              cta="Pay $1,200.00"
            />
            <p className="mt-3 max-w-xs text-center text-[10.5px] text-[#7a5c63]">
              Client holds USDC on Solana; the studio collects on Base. Whisk
              bridges through CCTP and the studio gets paid in one click.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvoiceLine({
  label,
  meta,
  value,
  muted,
}: {
  label: string;
  meta: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className={muted ? "text-[#7a5c63]" : "text-[#56363d]"}>
          {label}
        </div>
        <div className="text-[10.5px] text-[#7a5c63]">{meta}</div>
      </div>
      <span
        className={
          muted
            ? "font-medium text-[#7a5c63]"
            : "font-display font-semibold text-[#56363d]"
        }
      >
        {value}
      </span>
    </div>
  );
}

function Block({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-[#cdb2a4]/60">
      <div className="text-[9.5px] uppercase tracking-wider text-[#7a5c63]">
        {label}
      </div>
      <div className="mt-0.5 truncate font-medium text-[#56363d]">{value}</div>
    </div>
  );
}
