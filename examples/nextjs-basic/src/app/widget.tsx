"use client";

import { WhiskSend } from "@strimz/whisk-react";

/**
 * Pure showcase widget. Client component because `<WhiskSend />` uses
 * hooks (wagmi state, react-query, the Whisk reducer).
 *
 * Callbacks here log to the console; in a real app they'd push to your
 * analytics / toast / receipt-render flow.
 */
export function ExampleWidget() {
  return (
    <WhiskSend
      showFooter
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
