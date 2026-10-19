export const OPTION_LETTERS = ["A", "B", "C", "D", "E"] as const;

export type AnswerState = "idle" | "correct" | "wrong" | "muted";

export function answerState(
  answered: boolean,
  isCorrect: boolean,
  isSelected: boolean,
): AnswerState {
  if (!answered) {
    return "idle";
  }
  if (isCorrect) {
    return "correct";
  }
  return isSelected ? "wrong" : "muted";
}
