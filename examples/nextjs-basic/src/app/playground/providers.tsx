"use client";

import { useMemo } from "react";
import {
  WhiskProvider,
  createWhiskConfig,
  evm,
  type Chain,
} from "@signordev/whisk-react";

/**
 * Every testnet App Kit currently supports. The playground exposes
 * the full set so the chain picker mirrors what production apps will
 * see. Solana Devnet is intentionally absent — it's gated behind the
 * v0.2 signer fix; re-add it once `useWhiskAdapter` stops returning
 * a stub for SVM.
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

/** Re-exported so the controls panel can render a chain picker without
 *  duplicating the list. */
export const PLAYGROUND_CHAINS = TESTNET_CHAINS;

/**
 * Whisk's provider stack. `theme` is reactive — the WhiskProvider
 * only changes one DOM attribute (`data-whisk-theme`) when it flips,
 * so toggling theme from the controls panel does NOT remount wagmi
 * or react-query underneath. Wallet connection survives a theme
 * change.
 *
 * `config` is memoized with empty deps because it's static for the
 * lifetime of the playground — every adjustable knob lives on
 * `<WhiskSend>` props or the provider's `theme` prop, not on
 * `createWhiskConfig`.
 */
export function PlaygroundProviders({
  theme,
  children,
}: {
  theme: "system" | "light" | "dark";
  children: React.ReactNode;
}) {
  const config = useMemo(
    () =>
      createWhiskConfig({
        wallets: [
          evm({
            chains: TESTNET_CHAINS,
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
            appName: "Whisk Playground",
          }),
        ],
        chains: TESTNET_CHAINS,
        defaultSourceChain: "Arc_Testnet",
        defaultDestinationChain: "Base_Sepolia",
        appLabel: "whisk-playground",
      }),
    [],
  );

  return (
    <WhiskProvider config={config} theme={theme}>
      {children}
    </WhiskProvider>
  );
}
