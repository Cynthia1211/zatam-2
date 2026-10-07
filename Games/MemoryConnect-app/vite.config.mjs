import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: appRoot,
  plugins: [react()],
  // Relative asset paths let this game work from a GitHub Pages project URL.
  base: "./",
  build: {
    outDir: resolve(appRoot, "../../dist/Games/MemoryConnect"),
    emptyOutDir: true
  }
});
