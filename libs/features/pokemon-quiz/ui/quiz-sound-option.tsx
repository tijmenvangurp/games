import type { Pokemon } from "@entities/pokedex";
import { Check, Volume2, X } from "@shared/ui";
import { cn } from "@shared/lib";
import { OPTION_LETTERS, answerState, type AnswerState } from "../model/answer-state";

const CARD_CLASSES: Record<AnswerState, string> = {
  idle: "border-border bg-card",
  correct: "border-success/45 bg-success/10 text-success",
  wrong: "border-danger/45 bg-danger/10 text-danger",
  muted: "border-border bg-muted/40 text-muted-foreground opacity-70",
};

const BADGE_CLASSES: Record<AnswerState, string> = {
  idle: "bg-muted text-muted-foreground",
  correct: "bg-success text-white",
  wrong: "bg-danger text-white",
  muted: "bg-muted text-muted-foreground",
};

interface QuizSoundOptionProps {
  option: Pokemon;
  index: number;
  targetId: number;
  selectedId: number | null;
  answered: boolean;
  onPreview: (pokemon: Pokemon) => void;
  onSelect: (pokemonId: number) => void;
}

export function QuizSoundOption({
  option,
  index,
  targetId,
  selectedId,
  answered,
  onPreview,
  onSelect,
}: QuizSoundOptionProps) {
  const state = answerState(answered, option.id === targetId, option.id === selectedId);
  const letter = OPTION_LETTERS[index];

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border p-2 transition",
        CARD_CLASSES[state],
      )}
      data-answer-state={state}
      data-pokemon-id={option.id}
    >
      <button
        aria-label={answered ? option.name : `Beluister geluid ${letter}`}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-1 text-left transition hover:bg-muted/60 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:active:scale-100"
        disabled={answered}
        type="button"
        onClick={() => onPreview(option)}
      >
        <span
          aria-hidden="true"
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full text-sm",
            BADGE_CLASSES[state],
          )}
        >
          {letter}
        </span>
        <Volume2 aria-hidden="true" className="size-5 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-sm font-black">
          {answered ? option.name : "Beluister"}
        </span>
        {state === "correct" ? <Check aria-hidden="true" className="size-5 shrink-0" /> : null}
        {state === "wrong" ? <X aria-hidden="true" className="size-5 shrink-0" /> : null}
      </button>
      <button
        aria-label={`Kies geluid ${letter}`}
        aria-pressed={option.id === selectedId}
        className="min-h-11 shrink-0 rounded-lg bg-primary px-3 text-sm font-black text-primary-foreground transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:opacity-60 disabled:active:scale-100"
        disabled={answered}
        type="button"
        onClick={() => onSelect(option.id)}
      >
        Kies
      </button>
    </div>
  );
}
