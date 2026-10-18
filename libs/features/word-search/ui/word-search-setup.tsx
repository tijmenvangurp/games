import type { WordSearchDifficulty, WordSearchTheme } from "@entities/word-search";
import { OptionPicker, SetupActions } from "@shared/ui";
import { cn } from "@shared/lib";
import {
  WORD_SEARCH_DIFFICULTY_OPTIONS,
  WORD_SEARCH_THEME_OPTIONS,
  type WordSearchSettings,
} from "../model/settings";

interface WordSearchSetupProps {
  settings: WordSearchSettings;
  hasActiveGame: boolean;
  onThemeChange: (theme: WordSearchTheme) => void;
  onDifficultyChange: (difficulty: WordSearchDifficulty) => void;
  onStart: () => void;
  onBack: () => void;
}

export function WordSearchSetup({
  settings,
  hasActiveGame,
  onThemeChange,
  onDifficultyChange,
  onStart,
  onBack,
}: WordSearchSetupProps) {
  return (
    <section className="animate-rise rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-black">Nieuw spel</h2>
        <p className="text-sm text-muted-foreground">Kies een thema en hoe groot het bord is.</p>
      </div>

      <OptionPicker
        legend="Moeilijkheid"
        options={WORD_SEARCH_DIFFICULTY_OPTIONS}
        selected={settings.difficulty}
        onSelect={onDifficultyChange}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Makkelijk: → en ↓ · Gemiddeld: ook schuin · Moeilijk: alle kanten
      </p>

      <fieldset className="mt-5 space-y-2">
        <legend className="mb-2 text-sm font-semibold">Welk thema?</legend>
        <div className="grid grid-cols-3 gap-2">
          {WORD_SEARCH_THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={settings.theme === option.value}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 text-sm font-bold transition active:scale-95",
                settings.theme === option.value
                  ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                  : "border-border bg-card hover:bg-muted",
              )}
              onClick={() => onThemeChange(option.value)}
            >
              <span aria-hidden="true" className="text-2xl">
                {option.emoji}
              </span>
              {option.label}
              <span className="text-xs font-normal text-muted-foreground">{option.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <SetupActions
        backLabel="Terug naar je woordzoeker"
        onBack={hasActiveGame ? onBack : undefined}
        onStart={onStart}
      />
    </section>
  );
}
