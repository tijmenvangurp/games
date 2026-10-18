import { defineConfig } from "vitest/config";
import { aliases } from "./tools/aliases.ts";

export default defineConfig({
  resolve: {
    alias: aliases,
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["tests/node/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "web",
          environment: "jsdom",
          include: ["tests/web/**/*.test.{ts,tsx}"],
          setupFiles: ["tests/web/setup.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "api",
          environment: "node",
          include: ["tests/api/**/*.test.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["apps/games/src/**/*.{ts,tsx}", "apps/api/src/**/*.ts", "libs/**/*.{ts,tsx}"],
      exclude: ["apps/games/src/app/main.tsx", "libs/entities/sudoku/model/types.ts", "**/*.d.ts"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
