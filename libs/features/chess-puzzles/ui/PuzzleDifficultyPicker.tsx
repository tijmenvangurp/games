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
              "min-h-11 rounded-xl border-2 px-2 py-2 text-xs font-bold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300",
              active
                ? "border-teal-500 bg-teal-100 text-teal-950"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            )}
            onClick={() => onSelect(option.id)}
          >
            <span className="block">{option.label}</span>
            <span
              className={cn(
                "mt-0.5 block text-xs font-medium",
                active ? "text-teal-800" : "text-slate-500",
              )}
            >
              {option.hint}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
