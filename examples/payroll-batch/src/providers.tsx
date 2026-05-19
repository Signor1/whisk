import { useMemo, type ReactNode } from "react";
import { WhiskProvider, createWhiskConfig, evm } from "@signordev/whisk-react";

export function Providers({ children }: { children: ReactNode }) {
  const config = useMemo(
    () =>
      createWhiskConfig({
        wallets: [
          evm({
            chains: ["Arc_Testnet"],
            appName: "Whisk Payroll Demo",
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
