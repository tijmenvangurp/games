import {
  FLAG_LEVEL_INFO,
  FLAG_LEVELS,
  FLAG_SCOPE_INFO,
  FLAG_SCOPES,
  type FlagLevel,
  type FlagScope,
} from "@entities/flag";

export interface FlagSettings {
  scope: FlagScope;
  level: FlagLevel;
}

export const DEFAULT_FLAG_SETTINGS: FlagSettings = {
  scope: "europa",
  level: "makkelijk",
};

export const FLAG_SCOPE_OPTIONS = FLAG_SCOPES.map((scope) => ({
  value: scope,
  label: FLAG_SCOPE_INFO[scope].label,
  hint: FLAG_SCOPE_INFO[scope].hint,
  emoji: FLAG_SCOPE_INFO[scope].emoji,
}));

export const FLAG_LEVEL_OPTIONS = FLAG_LEVELS.map((level) => ({
  value: level,
  label: FLAG_LEVEL_INFO[level].label,
  hint: FLAG_LEVEL_INFO[level].hint,
  emoji: FLAG_LEVEL_INFO[level].emoji,
}));

export function bestKey(scope: FlagScope, level: FlagLevel): string {
  return `${scope}:${level}`;
}
