import type { SeekDifficulty, SeekTheme } from "@entities/hidden-object";
import { OptionPicker, SetupActions } from "@shared/ui";
import { cn } from "@shared/lib";
import { SEEK_DIFFICULTY_OPTIONS, SEEK_THEME_OPTIONS, type SeekSettings } from "../model/settings";

interface SeekSetupProps {
  settings: SeekSettings;
  hasActiveGame: boolean;
  onDifficultyChange: (difficulty: SeekDifficulty) => void;
  onThemeChange: (theme: SeekTheme) => void;
  onStart: () => void;
  onBack: () => void;
}

export function SeekSetup({
  settings,
  hasActiveGame,
  onDifficultyChange,
  onThemeChange,
  onStart,
  onBack,
}: SeekSetupProps) {
  return (
    <section className="game-panel animate-rise p-4 sm:p-6">
      <div className="mb-5">
        <h2 className="font-display text-2xl">Nieuw spel</h2>
        <p className="text-sm text-muted-foreground">
          Kies hoe druk het zoekveld is en waar je zoekt.
        </p>
      </div>

      <OptionPicker
        legend="Moeilijkheid"
        options={SEEK_DIFFICULTY_OPTIONS}
        selected={settings.difficulty}
        onSelect={onDifficultyChange}
      />

      <fieldset className="mt-5 space-y-2">
        <legend className="mb-2 text-sm font-semibold">Waar zoek je?</legend>
        <div className="grid grid-cols-2 gap-2">
          {SEEK_THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={settings.theme === option.value}
              className={cn(
                "flex min-h-16 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-bold transition active:scale-[0.99]",
                settings.theme === option.value
                  ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                  : "border-border bg-card hover:bg-muted/60",
              )}
              onClick={() => onThemeChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <SetupActions
        backLabel="Terug naar je zoekveld"
        onBack={hasActiveGame ? onBack : undefined}
        onStart={onStart}
      />
    </section>
  );
}
