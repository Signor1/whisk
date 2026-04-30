import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    errors: "src/errors/index.ts",
    resolvers: "src/resolvers/index.ts",
    types: "src/types/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: "es2022",
});
