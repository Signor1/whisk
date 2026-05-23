"use client";

import { useEffect } from "react";
import { PlaygroundProviders } from "./providers";
import { Controls } from "./controls";
import { Stage } from "./stage";
import { EventLog } from "./event-log";
import { usePlaygroundStore, type Palette } from "./store";

const PALETTE_STORAGE_KEY = "whisk-playground-palette";

export function Playground() {
  const [state, dispatch] = usePlaygroundStore();
  const { palette } = state.config;

  // Restore persisted palette on first mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(
      PALETTE_STORAGE_KEY,
    ) as Palette | null;
    if (stored && stored !== palette && isValidPalette(stored)) {
      dispatch({ type: "SET_CONFIG", patch: { palette: stored } });
    }
    // Intentionally first-mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect the chosen palette onto <html> so the [data-palette="…"]
  // selectors in globals.css retune both --pg-* and --whisk-* variables.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.palette = palette;
    try {
      window.localStorage.setItem(PALETTE_STORAGE_KEY, palette);
    } catch {
      /* ignore quota / private-mode failures */
    }
  }, [palette]);

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

function isValidPalette(value: string): value is Palette {
  return (
    value === "wine" ||
    value === "indigo" ||
    value === "emerald" ||
    value === "amber"
  );
}
