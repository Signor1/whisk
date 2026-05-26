export type Donor = {
  who: string;
  amount: number;
  trees: number;
  chain: string;
  when: string;
};

export const STATS = [
  { value: "84,219", label: "Trees in the ground" },
  { value: "1,204 ha", label: "Land restored" },
  { value: "37", label: "Active community partners" },
  { value: "Q2 '26", label: "Last public ledger audit" },
];

export const RECENT_DONORS: Donor[] = [
  {
    who: "alice.eth",
    amount: 100,
    trees: 30,
    chain: "Base Sepolia",
    when: "12m",
  },
  {
    who: "0xab12…f04c",
    amount: 25,
    trees: 6,
    chain: "Arc Testnet",
    when: "1h",
  },
  { who: "Anonymous", amount: 5, trees: 1, chain: "ETH Sepolia", when: "3h" },
  {
    who: "vitalik.eth",
    amount: 250,
    trees: 75,
    chain: "Arc Testnet",
    when: "1d",
  },
  { who: "remi.eth", amount: 50, trees: 12, chain: "OP Sepolia", when: "1d" },
  {
    who: "0x73e1…ab2c",
    amount: 10,
    trees: 2,
    chain: "Base Sepolia",
    when: "2d",
  },
];
