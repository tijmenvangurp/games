import type { SeekDifficulty, SeekTheme } from "@entities/hidden-object";
import { ArrowLeft, Button, Play } from "@shared/ui";
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
    <section className="animate-rise rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-black">Nieuw spel</h2>
        <p className="text-sm text-muted-foreground">
          Kies hoe druk het zoekveld is en waar je zoekt.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold">Moeilijkheid</legend>
        <div className="grid grid-cols-3 gap-2">
          {SEEK_DIFFICULTY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={settings.difficulty === option.value}
              className={cn(
                "flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2 transition active:scale-95",
                settings.difficulty === option.value
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card hover:bg-muted",
              )}
              onClick={() => onDifficultyChange(option.value)}
            >
              <span aria-hidden="true" className="text-2xl">
                {option.emoji}
              </span>
              <span className="text-sm font-bold">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5 space-y-2">
        <legend className="mb-2 text-sm font-semibold">Waar zoek je?</legend>
        <div className="grid grid-cols-2 gap-2">
          {SEEK_THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={settings.theme === option.value}
              className={cn(
                "flex min-h-16 items-center justify-center gap-2 rounded-2xl border-2 px-2 text-sm font-bold transition active:scale-95",
                settings.theme === option.value
                  ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                  : "border-border bg-card hover:bg-muted",
              )}
              onClick={() => onThemeChange(option.value)}
            >
              <span aria-hidden="true" className="text-xl">
                {option.emoji}
              </span>
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <Button className="mt-6 w-full" size="lg" variant="success" onClick={onStart}>
        <Play aria-hidden="true" className="size-5" />
        Spelen
      </Button>

      {hasActiveGame ? (
        <Button className="mt-2 w-full" variant="ghost" onClick={onBack}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Terug naar je zoekveld
        </Button>
      ) : null}
    </section>
  );
}
