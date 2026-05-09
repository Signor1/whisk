"use client";

import { useMemo } from "react";
import {
  WhiskProvider,
  createWhiskConfig,
  evm,
} from "@strimz/whisk-react";

export function Providers({ children }: { children: React.ReactNode }) {
  const config = useMemo(
    () =>
      createWhiskConfig({
        wallets: [
          evm({
            chains: ["Arc_Testnet", "Base_Sepolia"],
            appName: "Acme Treasury",
          }),
        ],
        chains: ["Arc_Testnet", "Base_Sepolia"],
        defaultSourceChain: "Arc_Testnet",
        defaultDestinationChain: "Arc_Testnet",
        appLabel: "whisk-example-themed-saas",
      }),
    [],
  );

  return <WhiskProvider config={config}>{children}</WhiskProvider>;
}
