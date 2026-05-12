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
    value: "0xbe03CEa7b91Fc60Ad7daEa7140cb89BD9BAe70Fe2",
    kind: "address",
  },
  {
    label: "Test recipient #2",
    value: "0xd9dB5BcC53dF9F88C5e83C24A03F4C4cE7E9E645",
    kind: "address",
  },
  {
    label: "Burn address",
    value: "0x000000000000000000000000000000000000dEaD",
    kind: "address",
  },
];
