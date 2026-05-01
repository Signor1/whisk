"use client";

import { useMemo } from "react";
import {
  WhiskProvider,
  createWhiskConfig,
  evm,
  solana,
} from "@strimz/whisk-react";

/**
 * Client boundary holding the Whisk + wagmi + react-query provider stack.
 *
 * The Solana factory is included so the chain picker shows Solana Devnet
 * as a destination option; the engine still warns and ignores it at
 * mount time per the v0.1 stub. Once `solana()` is fully wired (v0.2)
 * this same call site keeps working without changes.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const config = useMemo(
    () =>
      createWhiskConfig({
        wallets: [
          evm({
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
            appName: "Whisk Example",
          }),
          solana(),
        ],
        chains: [
          "Arc_Testnet",
          "Base_Sepolia",
          "Ethereum_Sepolia",
          "Solana_Devnet",
        ],
        defaultSourceChain: "Arc_Testnet",
        defaultDestinationChain: "Arc_Testnet",
        appLabel: "whisk-example-nextjs-basic",
      }),
    [],
  );

  return <WhiskProvider config={config}>{children}</WhiskProvider>;
}
