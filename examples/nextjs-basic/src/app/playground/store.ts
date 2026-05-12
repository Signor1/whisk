"use client";

import { useReducer } from "react";
import type { Chain } from "@signordev/whisk-react";

export type Theme = "system" | "light" | "dark";

export type EventKind = "state" | "success" | "error" | "info";

export type PlaygroundConfig = {
  /* Provider-level — drives <WhiskProvider theme=…> */
  theme: Theme;

  /* Surface toggles */
  showFooter: boolean;
  swapEnabled: boolean;

  /* Controlled / default inputs.
   *   - `lockX === true`  → passed as the controlled prop (locked).
   *   - `lockX === false` → passed as the `defaultX` prop (seeded).
   */
  lockAmount: boolean;
  amount: string;
  lockRecipient: boolean;
  recipient: string;
  lockSourceChain: boolean;
  sourceChain: Chain;
  lockDestinationChain: boolean;
  destinationChain: Chain;
};

export type PlaygroundEvent = {
  id: string;
  at: number;
  kind: EventKind;
  label: string;
  detail?: string;
};

export type PlaygroundState = {
  config: PlaygroundConfig;
  events: PlaygroundEvent[];
};

export type PlaygroundAction =
  | { type: "SET_CONFIG"; patch: Partial<PlaygroundConfig> }
  | { type: "APPLY_PRESET"; config: Partial<PlaygroundConfig> }
  | { type: "LOG_EVENT"; event: Omit<PlaygroundEvent, "id" | "at"> }
  | { type: "CLEAR_LOG" };

/* Initial config — open form, no locks, defaults at sensible testnet
 * starting points. Theme stays "system" so first paint matches the OS. */
export const INITIAL_CONFIG: PlaygroundConfig = {
  theme: "system",
  showFooter: true,
  swapEnabled: true,
  lockAmount: false,
  amount: "10",
  lockRecipient: false,
  recipient: "",
  lockSourceChain: false,
  sourceChain: "Arc_Testnet",
  lockDestinationChain: false,
  destinationChain: "Base_Sepolia",
};

const INITIAL_STATE: PlaygroundState = {
  config: INITIAL_CONFIG,
  events: [],
};

/* Last N events kept in memory. The log is a debugging aid, not a
 * permanent record; older entries roll off. */
const MAX_EVENTS = 30;

function reducer(
  state: PlaygroundState,
  action: PlaygroundAction,
): PlaygroundState {
  switch (action.type) {
    case "SET_CONFIG":
      return { ...state, config: { ...state.config, ...action.patch } };

    case "APPLY_PRESET":
      // Reset to initial first, then layer the preset — keeps the user
      // from inheriting stale locks from the previous preset. Theme is
      // preserved because it's a UI preference, not a payment shape.
      return {
        ...state,
        config: { ...INITIAL_CONFIG, theme: state.config.theme, ...action.config },
      };

    case "LOG_EVENT": {
      const event: PlaygroundEvent = {
        ...action.event,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: Date.now(),
      };
      return { ...state, events: [event, ...state.events].slice(0, MAX_EVENTS) };
    }

    case "CLEAR_LOG":
      return { ...state, events: [] };
  }
}

export function usePlaygroundStore() {
  return useReducer(reducer, INITIAL_STATE);
}
