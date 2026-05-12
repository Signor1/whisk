import type { PlaygroundConfig } from "./store";

export type PresetId =
  | "default"
  | "checkout"
  | "donate"
  | "invoice"
  | "payroll";

export type Preset = {
  id: PresetId;
  name: string;
  description: string;
  /** Patch applied on top of INITIAL_CONFIG when the preset is picked. */
  config: Partial<PlaygroundConfig>;
};

/**
 * Sample test recipient. Pick a wallet you control so the destination
 * funds are recoverable. The default points at the demo address used
 * in the docs recipe pages.
 */
const SAMPLE_RECIPIENT = "0xbe03CEa7b91Fc60Ad7daEa7140cb89BD9BAe70Fe2";
const SAMPLE_PAYEE = "0xd9dB5BcC53dF9F88C5e83C24A03F4C4cE7E9E645";

/**
 * Five preset shapes mirroring the recipe pages in /docs/recipes.
 * Pick one from the controls panel to drop the playground into that
 * exact integration shape — locks, defaults, and chain selection
 * all flip at once.
 */
export const PRESETS: Preset[] = [
  {
    id: "default",
    name: "Open form",
    description: "Everything editable. The blank-slate integration.",
    config: {
      lockAmount: false,
      amount: "10",
      lockRecipient: false,
      recipient: "",
      lockSourceChain: false,
      lockDestinationChain: false,
    },
  },
  {
    id: "checkout",
    name: "E-commerce checkout",
    description:
      "Amount, recipient, and dest chain pinned. The buyer just confirms.",
    config: {
      lockAmount: true,
      amount: "49.99",
      lockRecipient: true,
      recipient: SAMPLE_RECIPIENT,
      lockDestinationChain: true,
      destinationChain: "Base_Sepolia",
    },
  },
  {
    id: "donate",
    name: "Donate button",
    description: "Recipient locked, amount nudged. Donor picks the rest.",
    config: {
      lockRecipient: true,
      recipient: SAMPLE_RECIPIENT,
      amount: "5",
      lockDestinationChain: true,
      destinationChain: "Arc_Testnet",
    },
  },
  {
    id: "invoice",
    name: "Invoice payment link",
    description: "URL-param shape. Everything locked, customer confirms.",
    config: {
      lockAmount: true,
      amount: "120.00",
      lockRecipient: true,
      recipient: SAMPLE_RECIPIENT,
      lockDestinationChain: true,
      destinationChain: "Base_Sepolia",
    },
  },
  {
    id: "payroll",
    name: "Payroll row",
    description: "First payee pinned. Operator advances row by row.",
    config: {
      lockAmount: true,
      amount: "1500",
      lockRecipient: true,
      recipient: SAMPLE_PAYEE,
      lockDestinationChain: true,
      destinationChain: "Arbitrum_Sepolia",
    },
  },
];
