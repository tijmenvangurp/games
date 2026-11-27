import { useTexts } from "@shared/i18n";
import { AnswerOption, type AnswerState } from "@shared/ui";
import type { TileState } from "./letter-tile";
import { letterTexts } from "./texts";

interface WordTileProps {
  word: string;
  state?: TileState;
  disabled?: boolean;
  onClick?: () => void;
}

export function WordTile({ word, state = "default", disabled, onClick }: WordTileProps) {
  const t = useTexts(letterTexts);
  return (
    <AnswerOption
      aria-label={t.word(word)}
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
