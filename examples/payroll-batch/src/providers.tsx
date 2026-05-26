import { useMemo, type ReactNode } from "react";
import { WhiskProvider, createWhiskConfig, evm } from "@usewhisk/react";

export function Providers({ children }: { children: ReactNode }) {
  const config = useMemo(
    () =>
      createWhiskConfig({
        mode: "testnet",
        wallets: [
          evm({
            chains: ["Arc_Testnet"],
            projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
            appName: "Studio Fortune",
          }),
        ],
        chains: ["Arc_Testnet"],
        defaultSourceChain: "Arc_Testnet",
        defaultDestinationChain: "Arc_Testnet",
        appLabel: "whisk-example-payroll",
      }),
    [],
  );

  return <WhiskProvider config={config}>{children}</WhiskProvider>;
}
