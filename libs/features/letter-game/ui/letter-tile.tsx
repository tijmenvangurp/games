import type { LetterId } from "@entities/letter";
import { useTexts } from "@shared/i18n";
import { AnswerOption, type AnswerState } from "@shared/ui";
import { letterTexts } from "./texts";

type TileState = "default" | "correct" | "wrong" | "muted";

export type { TileState };

interface LetterTileProps {
  letter: LetterId;
  state?: TileState;
  disabled?: boolean;
  onClick?: () => void;
}

export function LetterTile({ letter, state = "default", disabled, onClick }: LetterTileProps) {
  const t = useTexts(letterTexts);
  return (
    <AnswerOption
      aria-label={t.letter(letter)}
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
