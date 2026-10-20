import type { MathLevel, MathMode } from "@entities/math";
import { cn } from "@shared/lib";
import { OptionPicker, SetupActions } from "@shared/ui";
import { bestKey, levelOptionsFor, MATH_MODE_OPTIONS, type MathSettings } from "../model/settings";

interface ModePickerProps {
  selected: MathMode;
  onSelect: (mode: MathMode) => void;
}

function ModePicker({ selected, onSelect }: ModePickerProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-semibold">Soort som</legend>
      <div className="grid grid-cols-2 gap-2">
        {MATH_MODE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected === option.value}
            className={cn(
              "flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-lg border p-3 text-sm font-bold transition active:scale-[0.99]",
              selected === option.value
                ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                : "border-border bg-card hover:bg-muted/60",
            )}
            onClick={() => onSelect(option.value)}
          >
            <span aria-hidden="true" className="font-display text-2xl leading-none">
              {option.symbol}
            </span>
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

interface MathSetupProps {
  settings: MathSettings;
  best: Record<string, number>;
  onModeChange: (mode: MathMode) => void;
  onLevelChange: (level: MathLevel) => void;
  onStart: () => void;
}

export function MathSetup({
  settings,
  best,
  onModeChange,
  onLevelChange,
  onStart,
}: MathSetupProps) {
  const bestScore = best[bestKey(settings.mode, settings.level)] ?? 0;

  return (
    <section className="game-panel animate-rise p-4 sm:p-6">
      <h2 className="mb-5 font-display text-2xl">Nieuw spel</h2>

      <ModePicker selected={settings.mode} onSelect={onModeChange} />

      <div className="mt-5">
        <OptionPicker
          legend="Niveau"
          options={levelOptionsFor(settings.mode)}
          selected={settings.level}
          onSelect={onLevelChange}
        />
      </div>

      <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
        {bestScore > 0 ? `Beste score: ${bestScore} van 10 sterren` : "Nog geen score"}
      </p>

      <SetupActions onStart={onStart} />
    </section>
  );
}
