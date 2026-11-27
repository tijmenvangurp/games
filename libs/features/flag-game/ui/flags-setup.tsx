import type { FlagLevel, FlagScope } from "@entities/geography";
import { useLanguage, useTexts } from "@shared/i18n";
import { OptionPicker, SetupPanel } from "@shared/ui";
import {
  flagLevelOptions,
  flagModeOptions,
  flagScopeOptions,
  scoreKey,
  type FlagMode,
  type FlagSettings,
} from "../model/settings";
import { flagTexts } from "../model/texts";

interface FlagsSetupProps {
  settings: FlagSettings;
  best: Record<string, number>;
  onModeChange: (mode: FlagMode) => void;
  onScopeChange: (scope: FlagScope) => void;
  onLevelChange: (level: FlagLevel) => void;
  onStart: () => void;
}

export function FlagsSetup({
  settings,
  best,
  onModeChange,
  onScopeChange,
  onLevelChange,
  onStart,
}: FlagsSetupProps) {
  const bestScore = best[scoreKey(settings.mode, settings.scope, settings.level)] ?? 0;
  const language = useLanguage();
  const t = useTexts(flagTexts);

  return (
    <SetupPanel note={bestScore > 0 ? t.bestScore(bestScore) : t.noScore} onStart={onStart}>
      <OptionPicker
        columns={2}
        legend={t.whatToPlay}
        options={flagModeOptions(language)}
        selected={settings.mode}
        onSelect={onModeChange}
      />

      <OptionPicker
        columns="2-3"
        legend={t.whereToPlay}
        options={flagScopeOptions(language)}
        selected={settings.scope}
        size="compact"
        onSelect={onScopeChange}
      />

      <OptionPicker
        legend={t.level}
        options={flagLevelOptions(settings.scope, language)}
        selected={settings.level}
        size="compact"
        onSelect={onLevelChange}
      />
    </SetupPanel>
  );
}
