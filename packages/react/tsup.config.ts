import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    headless: "src/headless.ts",
    tailwind: "src/theme/tailwind.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: "es2022",
  external: ["react", "react-dom", "@tanstack/react-query"],
  loader: {
    ".css": "copy",
  },
  onSuccess:
    "cp src/styles.css dist/styles.css 2>/dev/null && cp src/fonts.css dist/fonts.css 2>/dev/null || true",
});
