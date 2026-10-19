import type { FlagLevel, FlagScope } from "@entities/geography";
import { cn } from "@shared/lib";
import { OptionPicker, SetupActions } from "@shared/ui";
import {
  bestKey,
  FLAG_LEVEL_OPTIONS,
  FLAG_SCOPE_OPTIONS,
  type FlagSettings,
} from "../model/settings";

interface ScopePickerProps {
  selected: FlagScope;
  onSelect: (scope: FlagScope) => void;
}

function ScopePicker({ selected, onSelect }: ScopePickerProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-semibold">Waar wil je spelen?</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {FLAG_SCOPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected === option.value}
            className={cn(
              "flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 text-sm font-bold transition active:scale-95",
              selected === option.value
                ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                : "border-border bg-card hover:bg-muted",
            )}
            onClick={() => onSelect(option.value)}
          >
            <span aria-hidden="true" className="text-2xl">
              {option.emoji}
            </span>
            <span className="truncate">{option.label}</span>
            <span className="text-xs font-normal text-muted-foreground">{option.hint}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

interface FlagsSetupProps {
  settings: FlagSettings;
  best: Record<string, number>;
  hasActiveGame: boolean;
  onScopeChange: (scope: FlagScope) => void;
  onLevelChange: (level: FlagLevel) => void;
  onStart: () => void;
  onBack: () => void;
}

export function FlagsSetup({
  settings,
  best,
  hasActiveGame,
  onScopeChange,
  onLevelChange,
  onStart,
  onBack,
}: FlagsSetupProps) {
  const bestScore = best[bestKey(settings.scope, settings.level)] ?? 0;

  return (
    <section className="animate-rise rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-black">Nieuw spel</h2>
        <p className="text-sm text-muted-foreground">
          Kies een gebied en een niveau. Je krijgt vlaggen én namen te zien.
        </p>
      </div>

      <ScopePicker selected={settings.scope} onSelect={onScopeChange} />

      <div className="mt-5">
        <OptionPicker
          legend="Niveau"
          options={FLAG_LEVEL_OPTIONS}
          selected={settings.level}
          onSelect={onLevelChange}
        />
      </div>

      <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
        {bestScore > 0 ? `Beste score: ${bestScore} van 10 sterren` : "Nog geen score"}
      </p>

      <SetupActions
        backLabel="Terug naar je spel"
        onBack={hasActiveGame ? onBack : undefined}
        onStart={onStart}
      />
    </section>
  );
}
