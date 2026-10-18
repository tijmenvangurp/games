import {
  levelHint,
  MATH_LEVEL_INFO,
  MATH_LEVELS,
  MATH_MODE_INFO,
  MATH_MODES,
  type MathLevel,
  type MathMode,
} from "@entities/math";

export interface MathSettings {
  mode: MathMode;
  level: MathLevel;
}

export const DEFAULT_MATH_SETTINGS: MathSettings = {
  mode: "plus",
  level: "makkelijk",
};

export const MATH_MODE_OPTIONS = MATH_MODES.map((mode) => ({
  value: mode,
  label: MATH_MODE_INFO[mode].label,
  hint: MATH_MODE_INFO[mode].hint,
  emoji: MATH_MODE_INFO[mode].emoji,
}));

export function levelOptionsFor(mode: MathMode) {
  return MATH_LEVELS.map((level) => ({
    value: level,
    label: MATH_LEVEL_INFO[level].label,
    hint: levelHint(mode, level),
    emoji: MATH_LEVEL_INFO[level].emoji,
  }));
}

export function bestKey(mode: MathMode, level: MathLevel): string {
  return `${mode}:${level}`;
}
