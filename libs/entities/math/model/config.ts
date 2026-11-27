import { getTexts } from "@shared/i18n";
import { mathTexts } from "./texts";
import type { MathLevel, MathMode } from "./types";

/** Het rekenteken per soort som; de namen en uitleg staan per taal in `texts.ts`. */
export const MATH_MODE_SYMBOLS: Record<MathMode, string> = {
  plus: "+",
  min: "−",
  keer: "×",
  deel: "÷",
};

export function levelHint(mode: MathMode, level: MathLevel): string {
  const t = getTexts(mathTexts);
  return mode === "plus" || mode === "min" ? t.rangeHints[level] : t.tableHints[level];
}
