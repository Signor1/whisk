"use client";

import { useMemo } from "react";
import {
  WhiskProvider,
  createWhiskConfig,
  evm,
  type Chain,
} from "@signordev/whisk-react";

/**
 * The full set of EVM testnets App Kit supports. Listed explicitly so it
 * stays obvious which networks the demo widget exposes; trim the list in
 * production apps to only the chains your audience actually uses.
 *
 * Solana_Devnet is deferred to v0.2 — see `useWhiskAdapter.ts` for the
 * workaround we ship behind the flag.
 */
const TESTNET_CHAINS: Chain[] = [
  "Arc_Testnet",
  "Arbitrum_Sepolia",
  "Avalanche_Fuji",
  "Base_Sepolia",
  "Codex_Testnet",
  "Ethereum_Sepolia",
  "HyperEVM_Testnet",
  "Ink_Testnet",
  "Linea_Sepolia",
  "Monad_Testnet",
  "Optimism_Sepolia",
  "Plume_Testnet",
  "Polygon_Amoy_Testnet",
  "Sei_Testnet",
  "Sonic_Testnet",
  "Unichain_Sepolia",
  "World_Chain_Sepolia",
  "XDC_Apothem",
];

/**
 * Client boundary holding the Whisk + wagmi + react-query provider stack.
 *
 * The widget is configured with every testnet App Kit ships with, so the
 * chain picker mirrors the full Circle docs table. Set
 * `NEXT_PUBLIC_CIRCLE_KIT_KEY` in `.env.local` to enable the Swap tab —
 * Arc Testnet supports USDC ↔ EURC ↔ cirBTC swaps; the rest of the
 * testnets bridge / send via CCTP and don't surface a Swap option.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const config = useMemo(
    () =>
      createWhiskConfig({
        wallets: [
          evm({
            chains: TESTNET_CHAINS,
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
            appName: "Whisk Example",
          }),
        ],
        chains: TESTNET_CHAINS,
        defaultSourceChain: "Arc_Testnet",
        defaultDestinationChain: "Arc_Testnet",
        appLabel: "whisk-example-nextjs-basic",
      }),
    [],
  );

  return <WhiskProvider config={config}>{children}</WhiskProvider>;
}
