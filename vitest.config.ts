import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { defineConfig } from "vitest/config";
import { aliases } from "./tools/aliases.ts";

export default defineConfig({
  plugins: [vanillaExtractPlugin()],
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
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json"],
      include: ["apps/games/src/**/*.{ts,tsx}", "libs/**/*.{ts,tsx}"],
      // De MIT-engine in model/engine is 1:1 vendored (12.497 regels) en wordt via
      // de publieke API in tests/node/murdoku-*.test.ts getest; losse regels tellen
      // niet mee voor de dekking van ons eigen werk.
      exclude: [
        "apps/games/src/app/main.tsx",
        "libs/entities/sudoku/model/types.ts",
        "libs/entities/murdoku/model/engine/**",
        // 1:1 overgenomen MIT-renderlaag (8 bestanden, ~6.000 regels). Onze eigen
        // teksten, preview-fixture en componenten vallen hier bewust buiten.
        "libs/features/murdoku-game/lib/vendored/**",
        "**/*.d.ts",
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
