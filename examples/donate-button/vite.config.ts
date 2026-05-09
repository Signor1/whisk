import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Vite config for a Whisk SPA. The two `optimizeDeps.exclude` entries
 * stub out wagmi's transitive deps that don't ship a browser build —
 * same fix the Next.js config applies via webpack `resolve.fallback`.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@react-native-async-storage/async-storage": "/src/stub-empty.ts",
      "pino-pretty": "/src/stub-empty.ts",
    },
  },
  optimizeDeps: {
    exclude: ["@react-native-async-storage/async-storage", "pino-pretty"],
  },
});
