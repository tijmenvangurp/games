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
  {
    // "chess" is een onveranderlijk enkelvoud, maar pluralize ziet de -ss als meervoud.
    files: ["libs/entities/chess/**"],
    rules: {
      "fsd/inconsistent-naming": "off",
    },
  },
]);
