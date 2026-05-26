export type Tier = {
  amount: string;
  trees: number;
  label: string;
  caption: string;
};

export const TREASURY_ADDRESS = "0xbFc6981dE968C96058932963e5d2B7621DEa8f59";

export const ANNUAL_GOAL = 250_000;
export const RAISED = 187_420;

export const TIERS: Tier[] = [
  {
    amount: "5",
    trees: 1,
    label: "Seedling",
    caption: "1 native sapling, planted next season",
  },
  {
    amount: "25",
    trees: 6,
    label: "Grove",
    caption: "6 trees · marked with your name on the donor map",
  },
  {
    amount: "100",
    trees: 30,
    label: "Canopy",
    caption: "30 trees · annual GPS-tagged growth photos",
  },
];
