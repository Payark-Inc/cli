import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"], // Use ESM for modern node/bun environments
  clean: true, // Clean dist directory before build
  dts: true, // Generate declaration files
  shims: true, // Add shims for ESM/CJS compatibility
  splitting: false, // Don't split chunks (one file per entry point)
  sourcemap: true, // Generate sourcemaps for debugging
  noExternal: [
    // Bundle all dependencies
    "@payark/sdk",
    "ws",
    "inquirer",
    "ora",
    "chalk",
    "boxen",
    "commander",
    "conf",
  ],
});
