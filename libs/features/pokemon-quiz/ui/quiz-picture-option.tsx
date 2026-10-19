import type { Pokemon } from "@entities/pokedex";
import { pokemonArtworkSrc } from "@entities/pokedex";
import { Check, X } from "@shared/ui";
import { cn } from "@shared/lib";
import { OPTION_LETTERS, answerState, type AnswerState } from "../model/answer-state";

const PICTURE_CLASSES: Record<AnswerState, string> = {
  idle: "border-border bg-card hover:border-primary/50 hover:bg-muted/60",
  correct: "border-success/45 bg-success/10",
  wrong: "border-danger/45 bg-danger/10",
  muted: "border-border bg-muted/40 opacity-70",
};

const BADGE_CLASSES: Record<AnswerState, string> = {
  idle: "bg-muted text-muted-foreground",
  correct: "bg-success text-white",
  wrong: "bg-danger text-white",
  muted: "bg-muted text-muted-foreground",
};

interface QuizPictureOptionProps {
  option: Pokemon;
  index: number;
  targetId: number;
  selectedId: number | null;
  answered: boolean;
  onSelect: (pokemonId: number) => void;
}

export function QuizPictureOption({
  option,
  index,
  targetId,
  selectedId,
  answered,
  onSelect,
}: QuizPictureOptionProps) {
  const state = answerState(answered, option.id === targetId, option.id === selectedId);
  const letter = OPTION_LETTERS[index];

  return (
    <button
      aria-label={answered ? option.name : `Plaatje ${letter}`}
      aria-pressed={option.id === selectedId}
      className={cn(
        "relative flex aspect-square min-h-24 w-full items-center justify-center overflow-hidden rounded-lg border p-2 transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:active:scale-100",
        PICTURE_CLASSES[state],
      )}
      data-answer-state={state}
      data-pokemon-id={option.id}
      disabled={answered}
      type="button"
      onClick={() => onSelect(option.id)}
    >
      <img
        alt=""
        className="h-full w-full object-contain drop-shadow-md"
        draggable={false}
        loading="eager"
        src={pokemonArtworkSrc(option)}
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-2 top-2 grid size-7 place-items-center rounded-full text-xs",
          BADGE_CLASSES[state],
        )}
      >
        {letter}
      </span>
      {state === "correct" ? (
        <Check aria-hidden="true" className="absolute right-2 top-2 size-5 text-success" />
      ) : null}
      {state === "wrong" ? (
        <X aria-hidden="true" className="absolute right-2 top-2 size-5 text-danger" />
      ) : null}
    </button>
  );
}
