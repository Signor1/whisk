export type Vendor = {
  id: string;
  name: string;
  handle: string;
  amount: string;
  cycle: "monthly" | "weekly" | "one-off";
  next: string;
  chain: string;
};

export const TREASURY = "0x5B8ecaB7096F8aBED873D246629ef9f05f467605";

export const VENDORS: Vendor[] = [
  {
    id: "v1",
    name: "Acme Studios",
    handle: "acme.eth",
    amount: "1200",
    cycle: "monthly",
    next: "Jun 1",
    chain: "Arc Testnet",
  },
  {
    id: "v2",
    name: "Northwind Inc.",
    handle: "northwind.eth",
    amount: "560",
    cycle: "weekly",
    next: "May 28",
    chain: "Base Sepolia",
  },
  {
    id: "v3",
    name: "Pixel Logistics",
    handle: "pixel.eth",
    amount: "2400",
    cycle: "monthly",
    next: "Jun 5",
    chain: "Arc Testnet",
  },
  {
    id: "v4",
    name: "Mercury Studio",
    handle: "mercury.eth",
    amount: "850",
    cycle: "monthly",
    next: "Jun 12",
    chain: "OP Sepolia",
  },
];
