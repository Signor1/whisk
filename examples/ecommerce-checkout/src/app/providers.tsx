"use client";

import { useMemo } from "react";
import { WhiskProvider, createWhiskConfig, evm } from "@usewhisk/react";

/**
 * The merchant fixes a single chain (Arc Testnet here). The `chains`
 * array contains only that chain so the widget's pickers collapse to
 * a no-op — there's nothing to choose. In a real app you'd configure
 * whatever chain your back-office has settled on for receivables.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const config = useMemo(
    () =>
      createWhiskConfig({
        wallets: [
          evm({
            chains: ["Arc_Testnet"],
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
            appName: "Whisk Checkout Demo",
          }),
        ],
        chains: ["Arc_Testnet"],
        defaultSourceChain: "Arc_Testnet",
        defaultDestinationChain: "Arc_Testnet",
        appLabel: "whisk-example-ecommerce",
      }),
    [],
  );

  return <WhiskProvider config={config}>{children}</WhiskProvider>;
}
