import type { FingerId } from "@entities/typepret";

/** Zachte, goed te onderscheiden kleuren; de vingernaam staat er altijd bij. */
export const FINGER_COLORS: Readonly<Record<FingerId, string>> = {
  "linker-pink": "oklch(0.86 0.09 20)",
  "linker-ringvinger": "oklch(0.88 0.1 75)",
  "linker-middelvinger": "oklch(0.9 0.1 120)",
  "linker-wijsvinger": "oklch(0.86 0.09 190)",
  "rechter-wijsvinger": "oklch(0.84 0.09 240)",
  "rechter-middelvinger": "oklch(0.84 0.1 285)",
  "rechter-ringvinger": "oklch(0.86 0.1 330)",
  "rechter-pink": "oklch(0.78 0.11 355)",
};
