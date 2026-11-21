import type { FlagLevel, FlagScope } from "@entities/geography";
import { OptionPicker, Panel, SetupActions } from "@shared/ui";
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
    <Panel as="section" className="animate-rise" padding="lg">
      <h2 className="mb-5 font-display text-2xl tracking-tight">Nieuw spel</h2>

      <OptionPicker
        columns={2}
        legend="Wat wil je spelen?"
        options={FLAG_MODE_OPTIONS}
        selected={settings.mode}
        onSelect={onModeChange}
      />

      <div className="mt-5">
        <OptionPicker
          columns="2-3"
          legend="Waar wil je spelen?"
          options={FLAG_SCOPE_OPTIONS}
          selected={settings.scope}
          size="compact"
          onSelect={onScopeChange}
        />
      </div>

      <div className="mt-5">
        <OptionPicker
          legend="Niveau"
          options={flagLevelOptions(settings.scope)}
          selected={settings.level}
          size="compact"
          onSelect={onLevelChange}
        />
      </div>

      <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-center text-sm font-semibold tabular-nums text-muted-foreground">
        {bestScore > 0 ? `Beste score: ${bestScore} sterren` : "Nog geen score"}
      </p>

      <SetupActions onStart={onStart} />
    </Panel>
  );
}
