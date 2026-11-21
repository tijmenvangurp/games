import type { FlagLevel, FlagScope } from "@entities/geography";
import { OptionPicker, SetupPanel } from "@shared/ui";
import {
  flagLevelOptions,
  FLAG_MODE_OPTIONS,
  FLAG_SCOPE_OPTIONS,
  scoreKey,
  type FlagMode,
  type FlagSettings,
} from "../model/settings";

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

  return (
    <SetupPanel
      note={bestScore > 0 ? `Beste score: ${bestScore} sterren` : "Nog geen score"}
      onStart={onStart}
    >
      <OptionPicker
        columns={2}
        legend="Wat wil je spelen?"
        options={FLAG_MODE_OPTIONS}
        selected={settings.mode}
        onSelect={onModeChange}
      />

      <OptionPicker
        columns="2-3"
        legend="Waar wil je spelen?"
        options={FLAG_SCOPE_OPTIONS}
        selected={settings.scope}
        size="compact"
        onSelect={onScopeChange}
      />

      <OptionPicker
        legend="Niveau"
        options={flagLevelOptions(settings.scope)}
        selected={settings.level}
        size="compact"
        onSelect={onLevelChange}
      />
    </SetupPanel>
  );
}
