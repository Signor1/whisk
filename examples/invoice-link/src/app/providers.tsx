"use client";

import { useMemo } from "react";
import {
  WhiskProvider,
  createWhiskConfig,
  evm,
  type Chain,
} from "@usewhisk/react";

const SUPPORTED: Chain[] = [
  "Arc_Testnet",
  "Base_Sepolia",
  "Ethereum_Sepolia",
  "Arbitrum_Sepolia",
  "Optimism_Sepolia",
];

export function Providers({ children }: { children: React.ReactNode }) {
  const config = useMemo(
    () =>
      createWhiskConfig({
        mode: "testnet",
        wallets: [
          evm({
            chains: SUPPORTED,
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
            appName: "Studio Hibiscus",
          }),
        ],
        chains: SUPPORTED,
        defaultSourceChain: "Arc_Testnet",
        defaultDestinationChain: "Arc_Testnet",
        appLabel: "whisk-example-invoice",
      }),
    [],
  );

  return <WhiskProvider config={config}>{children}</WhiskProvider>;
}
