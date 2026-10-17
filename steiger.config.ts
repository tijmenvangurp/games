import { defineConfig } from "steiger";
import fsd from "@feature-sliced/steiger-plugin";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    ignores: ["**/.gitkeep"],
    rules: {
      "fsd/insignificant-slice": "off",
    },
  },
]);
