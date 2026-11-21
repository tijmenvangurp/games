import { useTexts } from "@shared/i18n";
import { ChoiceCard } from "@shared/ui";
import { PUZZLE_DIFFICULTIES, type PuzzleDifficulty } from "../model/types";
import { puzzleTexts } from "./texts";

interface PuzzleDifficultyPickerProps {
  readonly current: PuzzleDifficulty;
  readonly onSelect: (difficulty: PuzzleDifficulty) => void;
}

export function PuzzleDifficultyPicker({ current, onSelect }: PuzzleDifficultyPickerProps) {
  const t = useTexts(puzzleTexts);

  return (
    <nav aria-label={t.chooseDifficulty} className="grid grid-cols-3 gap-2">
      {PUZZLE_DIFFICULTIES.map((option) => (
        <ChoiceCard
          key={option.id}
          label={t.difficulties[option.id]}
          selected={option.id === current}
          size="compact"
          onClick={() => onSelect(option.id)}
        />
      ))}
    </nav>
  );
}
