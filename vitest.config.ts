import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    testTimeout: 45_000
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname)
    }
  }
});
