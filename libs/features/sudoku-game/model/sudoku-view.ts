import type { SudokuHint } from "@entities/sudoku";
import type { MistakeMode } from "./settings";

export function hintText(hint: SudokuHint): string {
  if (hint.technique === "naked-single") {
    return "In dit vakje past nog maar één cijfer.";
  }
  switch (hint.unit) {
    case "row":
      return "In deze rij is nog maar één plek voor één cijfer.";
    case "column":
      return "In deze kolom is nog maar één plek voor één cijfer.";
    case "box":
      return "In dit blok is nog maar één plek voor één cijfer.";
    default:
      return "Er is nog maar één plek voor één cijfer.";
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
