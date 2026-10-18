import type { Difficulty, SudokuSize } from "@entities/sudoku";
import { OptionPicker, SetupActions } from "@shared/ui";
import { cn } from "@shared/lib";
import {
  DIFFICULTY_OPTIONS,
  MISTAKE_MODE_OPTIONS,
  SIZE_OPTIONS,
  symbolsFor,
  type MistakeMode,
  type SudokuSettings,
  type SymbolTheme,
} from "../model/settings";

interface SetupPanelProps {
  settings: SudokuSettings;
  hasActiveGame: boolean;
  isGenerating: boolean;
  onSizeChange: (size: SudokuSize) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onThemeChange: (theme: SymbolTheme) => void;
  onMistakeModeChange: (mode: MistakeMode) => void;
  onStart: () => void;
  onBack: () => void;
}

export function SetupPanel({
  settings,
  hasActiveGame,
  isGenerating,
  onSizeChange,
  onDifficultyChange,
  onThemeChange,
  onMistakeModeChange,
  onStart,
  onBack,
}: SetupPanelProps) {
  const preview = symbolsFor(settings.size, settings.theme);

  return (
    <section className="game-panel animate-rise p-4 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Nieuw spel</h2>
          <p className="text-sm text-muted-foreground">
            Kies een rooster en hoe moeilijk het mag zijn.
          </p>
        </div>
        <div
          className="flex items-center gap-1 rounded-2xl bg-muted px-3 py-2 text-lg"
          aria-hidden="true"
        >
          {preview.map((symbol) => (
            <span key={symbol}>{symbol}</span>
          ))}
        </div>
      </div>

      <OptionPicker
        legend="Grootte"
        onSelect={onSizeChange}
        options={SIZE_OPTIONS}
        selected={settings.size}
      />

      <fieldset className="mt-5 space-y-2">
        <legend className="mb-2 text-sm font-semibold">Moeilijkheid</legend>
        <div className="grid grid-cols-3 gap-2">
          {DIFFICULTY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={settings.difficulty === option.value}
              className={cn(
                "flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 px-2 text-sm font-bold transition active:scale-95",
                settings.difficulty === option.value
                  ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                  : "border-border bg-card hover:bg-muted",
              )}
              onClick={() => onDifficultyChange(option.value)}
            >
              <span aria-hidden="true">{option.emoji}</span>
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5 space-y-2">
        <legend className="mb-2 text-sm font-semibold">Fouten tonen</legend>
        <div className="grid grid-cols-2 gap-2">
          {MISTAKE_MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={settings.mistakeMode === option.value}
              className={cn(
                "flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 text-sm font-bold transition active:scale-95",
                settings.mistakeMode === option.value
                  ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                  : "border-border bg-card hover:bg-muted",
              )}
              onClick={() => onMistakeModeChange(option.value)}
            >
              <span aria-hidden="true">{option.emoji}</span>
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      {settings.size !== 9 ? (
        <fieldset className="mt-5 space-y-2">
          <legend className="mb-2 text-sm font-semibold">Symbolen</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { value: "numbers", label: "Cijfers", symbol: "123" },
                { value: "animals", label: "Dieren", symbol: "🐶" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={settings.theme === option.value}
                className={cn(
                  "flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 text-sm font-bold transition active:scale-95",
                  settings.theme === option.value
                    ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                    : "border-border bg-card hover:bg-muted",
                )}
                onClick={() => onThemeChange(option.value)}
              >
                <span aria-hidden="true">{option.symbol}</span>
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <SetupActions
        backLabel="Terug naar je puzzel"
        loading={isGenerating}
        onBack={hasActiveGame ? onBack : undefined}
        onStart={onStart}
      />
    </section>
  );
}
