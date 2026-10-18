import type { SudokuHint } from "@entities/sudoku";
import type { MistakeMode } from "./settings";

export function hintText(hint: SudokuHint, symbols: readonly string[]): string {
  const symbol = symbols[hint.value - 1] ?? String(hint.value);
  if (hint.technique === "naked-single") {
    return `In dit vakje past alleen nog ${symbol}.`;
  }
  switch (hint.unit) {
    case "row":
      return `In deze rij kan ${symbol} maar op één plek.`;
    case "column":
      return `In deze kolom kan ${symbol} maar op één plek.`;
    case "box":
      return `In dit blok kan ${symbol} maar op één plek.`;
    default:
      return `${symbol} kan maar op één plek.`;
  }
}

interface StatusInput {
  solved: boolean;
  conflictCount: number;
  mistakeCount: number;
  checkedMistakeCount: number;
  isChecked: boolean;
  mistakeMode: MistakeMode;
  filled: number;
  total: number;
}

export function statusText(input: StatusInput): string {
  if (input.solved) {
    return "Opgelost!";
  }
  if (input.conflictCount > 0) {
    return "Er staan dubbele cijfers.";
  }
  if (input.mistakeMode === "direct" && input.mistakeCount > 0) {
    return "Er staat nog een foutje in.";
  }
  if (input.isChecked && input.checkedMistakeCount > 0) {
    return "Er staat nog een foutje in.";
  }
  if (input.isChecked) {
    return "Alles klopt nog!";
  }
  return `${input.filled} van ${input.total} vakjes ingevuld`;
}
