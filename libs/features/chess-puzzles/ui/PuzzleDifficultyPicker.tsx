import { cn } from "@shared/lib";
import { PUZZLE_DIFFICULTIES, type PuzzleDifficulty } from "../model/types";

interface PuzzleDifficultyPickerProps {
  readonly current: PuzzleDifficulty;
  readonly onSelect: (difficulty: PuzzleDifficulty) => void;
}

export function PuzzleDifficultyPicker({ current, onSelect }: PuzzleDifficultyPickerProps) {
  return (
    <nav aria-label="Kies een moeilijkheidsgraad" className="grid grid-cols-3 gap-2">
      {PUZZLE_DIFFICULTIES.map((option) => {
        const active = option.id === current;

        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            className={cn(
              "min-h-11 rounded-lg border px-2 py-2 text-xs font-bold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
              active
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted/60",
            )}
            onClick={() => onSelect(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </nav>
  );
}
