import {
  levelHint,
  MATH_LEVELS,
  MATH_MODE_SYMBOLS,
  MATH_MODES,
  mathTexts,
  type MathLevel,
  type MathMode,
} from "@entities/math";
import { getTexts } from "@shared/i18n";

export interface MathSettings {
  mode: MathMode;
  level: MathLevel;
}

export const DEFAULT_MATH_SETTINGS: MathSettings = {
  mode: "plus",
  level: "makkelijk",
};

/** De soorten sommen met hun naam in de actieve taal. */
export function modeOptions() {
  const t = getTexts(mathTexts);
  return MATH_MODES.map((mode) => ({
    value: mode,
    label: t.modes[mode].label,
    hint: t.modes[mode].hint,
    symbol: MATH_MODE_SYMBOLS[mode],
  }));
}

export function levelOptionsFor(mode: MathMode) {
  const t = getTexts(mathTexts);
  return MATH_LEVELS.map((level) => ({
    value: level,
    label: t.levels[level],
    hint: levelHint(mode, level),
  }));
}

export function bestKey(mode: MathMode, level: MathLevel): string {
  return `${mode}:${level}`;
}
