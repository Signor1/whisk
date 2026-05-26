export const STATS = [
  {
    label: "Transferred this quarter",
    value: "$48,210",
    delta: "+12.4%",
    up: true,
  },
  { label: "Active payees", value: "23", delta: "+3 this week", up: true },
  { label: "Avg. settlement", value: "31s", delta: "-4s vs Q1", up: true },
  {
    label: "Treasury balance",
    value: "$184k USDC",
    delta: "Stable",
    up: false,
  },
];

export type Settlement = {
  name: string;
  amount: string;
  chain: string;
  when: string;
  status: "settled";
};

export const RECENT: Settlement[] = [
  {
    name: "Acme Studios",
    amount: "1,200",
    chain: "Arc Testnet",
    when: "2m",
    status: "settled",
  },
  {
    name: "Northwind Inc.",
    amount: "560",
    chain: "Base Sepolia",
    when: "1h",
    status: "settled",
  },
  {
    name: "Crypto Cafe",
    amount: "85",
    chain: "Arc Testnet",
    when: "3h",
    status: "settled",
  },
  {
    name: "Pixel Logistics",
    amount: "2,400",
    chain: "Base Sepolia",
    when: "yesterday",
    status: "settled",
  },
  {
    name: "Mercury Studio",
    amount: "850",
    chain: "OP Sepolia",
    when: "2d",
    status: "settled",
  },
];

export type ActivityEntry = {
  t: string;
  who: string;
  action: string;
  target: string;
};

export const ACTIVITY: ActivityEntry[] = [
  {
    t: "12:04",
    who: "remi@steelpath",
    action: "Approved batch run",
    target: "May payouts",
  },
  {
    t: "11:51",
    who: "alex@steelpath",
    action: "Added vendor",
    target: "Mercury Studio",
  },
  {
    t: "10:32",
    who: "system",
    action: "Quote refreshed",
    target: "$184,210.42 USDC",
  },
];
