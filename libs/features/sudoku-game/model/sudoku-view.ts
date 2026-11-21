import type { SudokuHint } from "@entities/sudoku";
import { getTexts } from "@shared/i18n";
import type { MistakeMode } from "./settings";
import { sudokuTexts } from "./texts";

export function hintText(hint: SudokuHint): string {
  const t = getTexts(sudokuTexts).hint;
  if (hint.technique === "naked-single") {
    return t.single;
  }
  return hint.unit ? t.unit[hint.unit] : t.anywhere;
}

export function hintDetailText(hint: SudokuHint): string {
  const t = getTexts(sudokuTexts).hint;
  if (hint.technique === "naked-single") {
    return t.singleDetail;
  }
  return hint.unit ? t.unitDetail[hint.unit] : t.anywhereDetail;
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
  const t = getTexts(sudokuTexts).status;
  if (input.solved) {
    return t.solved;
  }
  if (input.conflictCount > 0) {
    return t.duplicates;
  }
  if (input.mistakeMode === "direct" && input.mistakeCount > 0) {
    return t.notRight;
  }
  if (input.isChecked && input.checkedMistakeCount > 0) {
    return t.notRight;
  }
  if (input.isChecked) {
    return t.allGood;
  }
  return t.filled(input.filled, input.total);
}
