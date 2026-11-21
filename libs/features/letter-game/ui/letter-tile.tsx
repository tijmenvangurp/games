import type { LetterId } from "@entities/letter";
import { AnswerOption, type AnswerState } from "@shared/ui";

type TileState = "default" | "correct" | "wrong" | "muted";

export type { TileState };

interface LetterTileProps {
  letter: LetterId;
  state?: TileState;
  disabled?: boolean;
  onClick?: () => void;
}

export function LetterTile({ letter, state = "default", disabled, onClick }: LetterTileProps) {
  return (
    <AnswerOption
      aria-label={`Letter ${letter}`}
      className="min-h-20 min-w-0 text-4xl font-black"
      disabled={disabled ?? false}
      showIndicator={false}
      state={state as AnswerState}
      onClick={onClick}
    >
      {letter}
    </AnswerOption>
  );
}
