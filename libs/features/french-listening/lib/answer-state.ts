export function frenchAnswerState(
  answered: boolean,
  isCorrect: boolean,
  isSelected: boolean,
): "idle" | "correct" | "wrong" | "muted" {
  if (!answered) {
    return "idle";
  }
  if (isCorrect) {
    return "correct";
  }
  return isSelected ? "wrong" : "muted";
}
