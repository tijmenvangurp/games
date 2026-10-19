import {
  FLAG_LEVEL_INFO,
  FLAG_LEVELS,
  FLAG_SCOPE_INFO,
  FLAG_SCOPES,
  levelHint,
  type FlagLevel,
  type FlagScope,
} from "@entities/geography";

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

const MODE_INFO: Record<FlagMode, { label: string; hint: string }> = {
  vlaggen: { label: "Vlaggen", hint: "Herken de vlag bij het land" },
  kaartpuzzel: { label: "Kaartpuzzel", hint: "Leg elk land op de kaart" },
};

export const FLAG_MODE_OPTIONS = FLAG_MODES.map((mode) => ({
  value: mode,
  label: MODE_INFO[mode].label,
  hint: MODE_INFO[mode].hint,
}));

export const FLAG_SCOPE_OPTIONS = FLAG_SCOPES.map((scope) => ({
  value: scope,
  label: FLAG_SCOPE_INFO[scope].label,
  hint: FLAG_SCOPE_INFO[scope].hint,
}));

export function flagLevelOptions(scope: FlagScope) {
  return FLAG_LEVELS.map((level) => ({
    value: level,
    label: FLAG_LEVEL_INFO[level].label,
    hint: levelHint(level, scope),
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
