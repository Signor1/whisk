import { useMemo, type ReactNode } from "react";
import { WhiskProvider, createWhiskConfig, evm, solana } from "@usewhisk/react";

/**
 * Donors bring their own chain. Treasury is EVM-format so the destination
 * is pinned to Arc Testnet in <DonateCard>; sources include both EVM testnets
 * and Solana Devnet — CCTP bridges Solana → EVM cross-ecosystem.
 *
 * For production you'd narrow the chain list to whichever networks your
 * treasury actually monitors, and switch `mode: "mainnet"` once Whisk lifts
 * the testnet-only gate.
 */
export function Providers({ children }: { children: ReactNode }) {
  const config = useMemo(
    () =>
      createWhiskConfig({
        mode: "testnet",
        wallets: [
          evm({
            chains: ["Arc_Testnet", "Base_Sepolia", "Ethereum_Sepolia"],
            projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
            appName: "OpenForest",
          }),
          solana({ network: "devnet" }),
        ],
        chains: [
          "Arc_Testnet",
          "Base_Sepolia",
          "Ethereum_Sepolia",
          "Solana_Devnet",
        ],
        defaultSourceChain: "Arc_Testnet",
        defaultDestinationChain: "Arc_Testnet",
        appLabel: "whisk-example-donate",
      }),
    [],
  );

  return <WhiskProvider config={config}>{children}</WhiskProvider>;
}
