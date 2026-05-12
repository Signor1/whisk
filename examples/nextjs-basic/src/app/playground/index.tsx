"use client";

import { PlaygroundProviders } from "./providers";
import { Controls } from "./controls";
import { Stage } from "./stage";
import { EventLog } from "./event-log";
import { usePlaygroundStore } from "./store";

/**
 * The composition root for the playground. Holds the single store
 * the panel + the stage + the log all read from / dispatch into, and
 * routes the current theme up to `<PlaygroundProviders>` so toggling
 * theme from the controls panel actually re-themes the widget below.
 *
 * Dynamically imported by `client-gate.tsx` with `ssr: false` so the
 * wagmi / IndexedDB stack never runs on the server.
 */
export function Playground() {
  const [state, dispatch] = usePlaygroundStore();

  return (
    <PlaygroundProviders theme={state.config.theme}>
      <div className="pg-layout">
        <Controls config={state.config} dispatch={dispatch} />
        <main className="pg-stage" aria-label="Widget stage">
          <Stage config={state.config} dispatch={dispatch} />
        </main>
        <EventLog events={state.events} dispatch={dispatch} />
      </div>
    </PlaygroundProviders>
  );
}
