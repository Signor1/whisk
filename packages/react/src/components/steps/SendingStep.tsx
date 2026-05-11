"use client";

import type { Step } from "@signordev/whisk-core";
import { StepRail } from "../ui/StepRail.js";

export type SendingStepProps = {
  steps: ReadonlyArray<Step>;
  activeStep: Step["name"];
};

/**
 * Live progress while a send / bridge is in flight. The state machine
 * advances `activeStep` as each App Kit lifecycle event fires; the rail
 * pulses on the current step and shows a "view tx" link as soon as a
 * transaction hash lands.
 */
export function SendingStep({ steps, activeStep }: SendingStepProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      <header>
        <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>
          Transfer in flight
        </h2>
        <p
          className="whisk-help"
          style={{ marginTop: "0.25rem", marginBottom: 0 }}
        >
          Keep this tab open. We'll update each step as it lands on chain.
        </p>
      </header>
      <StepRail steps={steps} activeStep={activeStep} />
    </div>
  );
}
