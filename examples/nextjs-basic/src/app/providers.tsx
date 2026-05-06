"use client";

import { useMemo } from "react";
import {
  WhiskProvider,
  createWhiskConfig,
  evm,
} from "@strimz/whisk-react";

/**
 * Client boundary holding the Whisk + wagmi + react-query provider stack.
 *
 * Solana support is deferred to v0.2. App Kit's `adapter-solana-kit`
 * factory wraps browser wallets as a `TransactionSendingSigner`, which
 * `@solana/signers`' `partiallySignTransactionMessageWithSigners`
 * explicitly excludes — so the fee-payer signature never gets attached
 * and the transaction reverts on submission. Whisk has the workaround
 * (a hand-built kit `TransactionPartialSigner` in `useWhiskAdapter.ts`),
 * but the underlying flow still hits transient RPC issues on Devnet
 * that are out of our control. We'll re-enable once App Kit ships a fix
 * for the signer-kind mismatch.
 *
 * Re-enabling later only needs `solana()` added back to `wallets` and
 * `Solana_Devnet` back into `chains` — no other code changes required.
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
        ],
        chains: ["Arc_Testnet", "Base_Sepolia", "Ethereum_Sepolia"],
        defaultSourceChain: "Arc_Testnet",
        defaultDestinationChain: "Arc_Testnet",
        appLabel: "whisk-example-nextjs-basic",
      }),
    [],
  );

  return <WhiskProvider config={config}>{children}</WhiskProvider>;
}
