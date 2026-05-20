/**
 * Quick-pick recipients for the controls panel. Saves the tester from
 * typing the same address into 18 chains during the testnet sweep.
 *
 * Swap any entry for a wallet you control if you want the destination
 * funds to be recoverable.
 */
export type AddressEntry = {
  label: string;
  value: string;
  kind: "address" | "ens";
};

export const ADDRESS_BOOK: AddressEntry[] = [
  {
    label: "vitalik.eth",
    value: "vitalik.eth",
    kind: "ens",
  },
  {
    label: "Test recipient #1",
    value: "0xbe03CE9d6001D27BE41fc87e3E3f777d04e70Fe2",
    kind: "address",
  },
  {
    label: "Test recipient #2",
    value: "0xd9dBe0daa503Caa6e061f1902a7AF22af096E645",
    kind: "address",
  },
  {
    label: "Burn address",
    value: "0x000000000000000000000000000000000000dEaD",
    kind: "address",
  },
];
