import type { Pokemon } from "@entities/pokedex";
import { Check, RotateCcw } from "@shared/ui";
import { cn } from "@shared/lib";

const OPTION_LETTERS = ["A", "B", "C", "D", "E"] as const;

type AnswerState = "idle" | "correct" | "wrong" | "muted";

const OPTION_CLASSES: Record<AnswerState, string> = {
  idle: "border-border bg-card hover:bg-muted/60",
  correct: "border-success/45 bg-success/10 text-success",
  wrong: "border-warning/45 bg-warning/10 text-warning",
  muted: "border-border bg-muted/40 text-muted-foreground opacity-70",
};

const BADGE_CLASSES: Record<AnswerState, string> = {
  idle: "bg-muted text-muted-foreground",
  correct: "bg-success text-white",
  wrong: "bg-warning text-white",
  muted: "bg-muted text-muted-foreground",
};

function answerState(answered: boolean, isCorrect: boolean, isSelected: boolean): AnswerState {
  if (!answered) {
    return "idle";
  }
  if (isCorrect) {
    return "correct";
  }
  return isSelected ? "wrong" : "muted";
}

interface QuizOptionProps {
  option: Pokemon;
  index: number;
  targetId: number;
  selectedId: number | null;
  answered: boolean;
  onSelect: (pokemonId: number) => void;
}

export function QuizOption({
  option,
  index,
  targetId,
  selectedId,
  answered,
  onSelect,
}: QuizOptionProps) {
  const state = answerState(answered, option.id === targetId, option.id === selectedId);

  return (
    <button
      aria-label={option.name}
      aria-pressed={option.id === selectedId}
      className={cn(
        "flex min-h-14 w-full items-center gap-3 rounded-lg border px-3 text-left text-base font-black transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:active:scale-100",
        OPTION_CLASSES[state],
      )}
      data-answer-state={state}
      disabled={answered}
      type="button"
      onClick={() => onSelect(option.id)}
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full text-sm",
          BADGE_CLASSES[state],
        )}
      >
        {OPTION_LETTERS[index]}
      </span>
      <span className="min-w-0 flex-1">{option.name}</span>
      {state === "correct" ? <Check aria-hidden="true" className="size-5 shrink-0" /> : null}
      {state === "wrong" ? <RotateCcw aria-hidden="true" className="size-5 shrink-0" /> : null}
    </button>
  );
}
