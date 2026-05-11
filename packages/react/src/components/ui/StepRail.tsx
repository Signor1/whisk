"use client";

import {
  Check,
  X,
  KeyRound,
  Send,
  Flame,
  ScrollText,
  Sparkles,
} from "lucide-react";
import type { Step, StepName } from "@signordev/whisk-core";
import { cn } from "../../lib/cn.js";

/**
 * User-facing labels for each lifecycle step.
 *
 * `approve` → "Authorize" rather than "Approve token". On EVM with
 * USDC the underlying call IS an ERC-20 approve, but on Solana the
 * step is a permit-style signature, and on permit-supporting chains
 * the call may actually be `permit` not `approve`. "Authorize" is the
 * neutral term that reads correctly for every backend path.
 *
 * `transfer` → "Submit" — generic, doesn't pretend the user is doing
 * anything beyond confirming the on-chain submission.
 */
const STEP_LABELS: Record<StepName, string> = {
  approve: "Authorize",
  transfer: "Submit",
  burn: "Burn on source",
  fetchAttestation: "Wait for confirmation",
  mint: "Mint on destination",
};

const STEP_ICONS: Record<StepName, typeof KeyRound> = {
  approve: KeyRound,
  transfer: Send,
  burn: Flame,
  fetchAttestation: ScrollText,
  mint: Sparkles,
};

export type StepRailProps = {
  steps: ReadonlyArray<Step>;
  /** Name of the step currently in flight. */
  activeStep?: Step["name"];
};

/**
 * Vertical list of bridge / send lifecycle steps with live state. Each
 * step gets a thematic icon when idle/active and switches to a check or
 * x once it lands in a terminal state.
 */
export function StepRail({ steps, activeStep }: StepRailProps) {
  return (
    <ol className="whisk-step-rail" aria-label="Transfer progress">
      {steps.map((step) => {
        const Icon = STEP_ICONS[step.name];
        const isActive =
          step.state === "pending" && activeStep === step.name;
        return (
          <li
            key={step.name}
            className={cn(
              "whisk-step",
              step.state === "success" && "whisk-step--success",
              step.state === "error" && "whisk-step--error",
              isActive && "whisk-step--active",
            )}
          >
            <span className="whisk-step__dot" aria-hidden="true">
              {step.state === "success" ? (
                <Check size={10} strokeWidth={3} />
              ) : step.state === "error" ? (
                <X size={10} strokeWidth={3} />
              ) : null}
            </span>
            <Icon
              size={14}
              strokeWidth={2}
              style={{ opacity: 0.7 }}
              aria-hidden="true"
            />
            <span style={{ flex: 1 }}>{STEP_LABELS[step.name]}</span>
            {step.txHash ? (
              <a
                href={step.explorerUrl ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="whisk-help"
                style={{
                  marginTop: 0,
                  textDecoration: "none",
                }}
              >
                tx ↗
              </a>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
