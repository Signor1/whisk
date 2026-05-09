"use client";

import { WhiskSend } from "@strimz/whisk-react";

/**
 * Pure showcase widget. Client component because `<WhiskSend />` uses
 * hooks (wagmi state, react-query, the Whisk reducer).
 *
 * The Swap tab appears automatically when `NEXT_PUBLIC_CIRCLE_KIT_KEY` is
 * set in `.env.local`. Without it, only the Transfer tab renders — useful
 * for the bare-metal demo without forcing every visitor to register.
 *
 * Callbacks here log to the console; in a real app they'd push to your
 * analytics / toast / receipt-render flow.
 */
export function ExampleWidget() {
  return (
    <WhiskSend
      showFooter
      kitKey={process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY}
      swapDefaultChain="Arc_Testnet"
      swapDefaultTokenIn="USDC"
      swapDefaultTokenOut="EURC"
      onSuccess={(result) => {
        // eslint-disable-next-line no-console
        console.log("[whisk] sent:", result);
      }}
      onError={(error) => {
        // eslint-disable-next-line no-console
        console.error("[whisk] failed:", error);
      }}
      onStateChange={(state) => {
        // eslint-disable-next-line no-console
        console.debug("[whisk]", state.kind);
      }}
    />
  );
}
