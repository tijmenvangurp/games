import type { Pokemon } from "@entities/pokedex";
import { AnswerOption, type AnswerState } from "@shared/ui";

const OPTION_LETTERS = ["A", "B", "C", "D", "E"] as const;

type QuizAnswerState = "idle" | "correct" | "wrong" | "muted";

const OPTION_STATE: Record<QuizAnswerState, AnswerState> = {
  idle: "default",
  correct: "correct",
  wrong: "warn",
  muted: "muted",
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
      badge={OPTION_LETTERS[index]}
      data-answer-state={state}
      disabled={answered}
      state={OPTION_STATE[state]}
      wrongIcon="retry"
      onClick={() => onSelect(option.id)}
    >
      {option.name}
    </AnswerOption>
  );
}
