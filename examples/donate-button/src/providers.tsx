import { useMemo, type ReactNode } from "react";
import { WhiskProvider, createWhiskConfig, evm } from "@signordev/whisk-react";

/**
 * The donor picks the chain — donations are accepted on every CCTP
 * testnet we ship with — and the amount. Only the recipient is locked
 * (see App.tsx). For a production donation page you'd narrow the chain
 * list to whichever networks your treasury actually monitors.
 */
export function Providers({ children }: { children: ReactNode }) {
  const config = useMemo(
    () =>
      createWhiskConfig({
        wallets: [
          evm({
            chains: ["Arc_Testnet", "Base_Sepolia", "Ethereum_Sepolia"],
            appName: "Whisk Donate Demo",
          }),
        ],
        chains: ["Arc_Testnet", "Base_Sepolia", "Ethereum_Sepolia"],
        defaultSourceChain: "Arc_Testnet",
        defaultDestinationChain: "Arc_Testnet",
        appLabel: "whisk-example-donate",
      }),
    [],
  );

  return <WhiskProvider config={config}>{children}</WhiskProvider>;
}
