import type { Pokemon } from "@entities/pokedex";
import { AnswerOption, Check, RotateCcw, type AnswerState } from "@shared/ui";
import { cn } from "@shared/lib";

const OPTION_LETTERS = ["A", "B", "C", "D", "E"] as const;

type QuizAnswerState = "idle" | "correct" | "wrong" | "muted";

const OPTION_STATE: Record<QuizAnswerState, AnswerState> = {
  idle: "default",
  correct: "correct",
  wrong: "warn",
  muted: "muted",
};

const BADGE_CLASSES: Record<QuizAnswerState, string> = {
  idle: "bg-muted text-muted-foreground",
  correct: "bg-success text-success-foreground",
  wrong: "bg-warning text-primary-foreground",
  muted: "bg-muted text-muted-foreground",
};

function answerState(answered: boolean, isCorrect: boolean, isSelected: boolean): QuizAnswerState {
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
    <AnswerOption
      aria-label={option.name}
      aria-pressed={option.id === selectedId}
      className="w-full justify-start gap-3 px-3 text-left font-bold"
      data-answer-state={state}
      disabled={answered}
      showIndicator={false}
      size="md"
      state={OPTION_STATE[state]}
      onClick={() => onSelect(option.id)}
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
          BADGE_CLASSES[state],
        )}
      >
        {OPTION_LETTERS[index]}
      </span>
      <span className="min-w-0 flex-1">{option.name}</span>
      {state === "correct" ? <Check aria-hidden="true" className="size-5 shrink-0" /> : null}
      {state === "wrong" ? <RotateCcw aria-hidden="true" className="size-5 shrink-0" /> : null}
    </AnswerOption>
  );
}
