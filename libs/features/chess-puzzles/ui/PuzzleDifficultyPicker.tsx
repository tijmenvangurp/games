import { ChoiceCard } from "@shared/ui";
import { PUZZLE_DIFFICULTIES, type PuzzleDifficulty } from "../model/types";

interface PuzzleDifficultyPickerProps {
  readonly current: PuzzleDifficulty;
  readonly onSelect: (difficulty: PuzzleDifficulty) => void;
}

export function PuzzleDifficultyPicker({ current, onSelect }: PuzzleDifficultyPickerProps) {
  return (
    <nav aria-label="Kies een moeilijkheidsgraad" className="grid grid-cols-3 gap-2">
      {PUZZLE_DIFFICULTIES.map((option) => (
        <ChoiceCard
          key={option.id}
          label={option.label}
          selected={option.id === current}
          size="compact"
          onClick={() => onSelect(option.id)}
        />
      ))}
    </nav>
  );
}
