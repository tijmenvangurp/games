import { AnswerOption, type AnswerState } from "@shared/ui";
import { frenchAnswerState } from "../lib/answer-state";

const OPTION_LETTERS = ["A", "B", "C", "D", "E"] as const;

const OPTION_STATE: Record<ReturnType<typeof frenchAnswerState>, AnswerState> = {
  idle: "default",
  correct: "correct",
  wrong: "warn",
  muted: "muted",
};

interface FrenchOptionProps {
  option: string;
  index: number;
  correct: string;
  selected: string | null;
  answered: boolean;
  onSelect: (option: string) => void;
}

export function FrenchOption({
  option,
  index,
  correct,
  selected,
  answered,
  onSelect,
}: FrenchOptionProps) {
  const state = frenchAnswerState(answered, option === correct, option === selected);

  return (
    <AnswerOption
      aria-label={option}
      aria-pressed={option === selected}
      badge={OPTION_LETTERS[index]}
      className="py-2 leading-snug"
      data-answer-state={state}
      disabled={answered}
      state={OPTION_STATE[state]}
      wrongIcon="retry"
      onClick={() => onSelect(option)}
    >
      {option}
    </AnswerOption>
  );
}
