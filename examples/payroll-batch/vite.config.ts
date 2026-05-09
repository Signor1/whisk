import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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
