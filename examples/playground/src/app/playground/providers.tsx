"use client";

import { useMemo } from "react";
import {
  WhiskProvider,
  createWhiskConfig,
  evm,
  solana,
  type Chain,
} from "@usewhisk/react";

/**
 * Every testnet App Kit currently supports. The playground exposes
 * the full set so the chain picker mirrors what production apps will
 * see. Solana Devnet rides on `useWhiskAdapter`'s hand-built
 * `TransactionPartialSigner` workaround for App Kit's sending-vs-
 * partial-signer mismatch; the workaround lives in
 * `packages/react/src/hooks/useWhiskAdapter.ts`.
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
  "Solana_Devnet",
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
            // Fallback RPC chain. Circle's public Arc Testnet RPC
            // rate-limits hard during testnet sweeps, which surfaced
            // as viem "Timed out while waiting for transaction
            // receipt" errors during swap approves. The list below
            // is tried in order and re-ranked by latency, so a stuck
            // primary transparently flips to the next.
            rpcUrls: {
              Arc_Testnet: [
                "https://rpc.testnet.arc.network",
                "https://arc-testnet.drpc.org",
                "https://rpc.blockdaemon.testnet.arc.network",
                "https://rpc.quicknode.testnet.arc.network",
              ],
            },
          }),
          // Solana Devnet support — the factory defaults to devnet, so
          // no options needed. Mounts `<ConnectionProvider>` +
          // `<WalletProvider>` only when this is present.
          solana(),
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
