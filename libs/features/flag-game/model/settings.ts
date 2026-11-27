import {
  FLAG_LEVELS,
  FLAG_SCOPES,
  flagLevelLabel,
  flagScopeHint,
  flagScopeLabel,
  levelHint,
  type FlagLevel,
  type FlagScope,
} from "@entities/geography";
import type { Language } from "@shared/i18n";
import { flagTexts } from "./texts";

/** Vlaggenreis has two modes: the flag quiz and the map puzzle. */
export const FLAG_MODES = ["vlaggen", "kaartpuzzel"] as const;

export type FlagMode = (typeof FLAG_MODES)[number];

export interface FlagSettings {
  mode: FlagMode;
  scope: FlagScope;
  level: FlagLevel;
}

export const DEFAULT_FLAG_SETTINGS: FlagSettings = {
  mode: "vlaggen",
  scope: "europa",
  level: "makkelijk",
};

export function flagModeOptions(language: Language) {
  return FLAG_MODES.map((mode) => ({ value: mode, ...flagTexts[language].modes[mode] }));
}

export function flagScopeOptions(language: Language) {
  return FLAG_SCOPES.map((scope) => ({
    value: scope,
    label: flagScopeLabel(scope, language),
    hint: flagScopeHint(scope, language),
  }));
}

export function flagLevelOptions(scope: FlagScope, language: Language) {
  return FLAG_LEVELS.map((level) => ({
    value: level,
    label: flagLevelLabel(level, language),
    hint: levelHint(level, scope, language),
  }));
}

/** Best score key of the flag quiz; unchanged so existing scores survive. */
export function bestKey(scope: FlagScope, level: FlagLevel): string {
  return `${scope}:${level}`;
}

/** Best score key of the map puzzle. */
export function puzzleBestKey(scope: FlagScope, level: FlagLevel): string {
  return `kaartpuzzel:${scope}:${level}`;
}

export function scoreKey(mode: FlagMode, scope: FlagScope, level: FlagLevel): string {
  return mode === "vlaggen" ? bestKey(scope, level) : puzzleBestKey(scope, level);
}
