import { AnswerOption, type AnswerState } from "@shared/ui";
import type { TileState } from "./letter-tile";

interface WordTileProps {
  word: string;
  state?: TileState;
  disabled?: boolean;
  onClick?: () => void;
}

export function WordTile({ word, state = "default", disabled, onClick }: WordTileProps) {
  return (
    <AnswerOption
      aria-label={`Woord ${word}`}
      className="w-full text-2xl font-black tracking-wide"
      disabled={disabled ?? false}
      showIndicator={false}
      state={state as AnswerState}
      onClick={onClick}
    >
      {word}
    </AnswerOption>
  );
}
