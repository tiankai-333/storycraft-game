import { defineConfig } from "vite";
import path from "path";

const projectRoot = path.resolve(__dirname, "../..");

export default defineConfig({
  root: ".",
  resolve: {
    alias: {
      "@game-runtime": path.resolve(projectRoot, "packages/game-runtime/src/index.ts"),
      "@shared": path.resolve(projectRoot, "packages/shared/src/index.ts"),
      "@ai-narrative": path.resolve(projectRoot, "packages/ai-narrative/src/index.ts")
    }
  },
  optimizeDeps: {
    exclude: ["@game-runtime", "@shared", "@ai-narrative"]
  },
  build: {
    outDir: "dist",
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
});
