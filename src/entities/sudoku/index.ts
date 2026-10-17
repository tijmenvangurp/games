export { clueCount, generatePuzzle } from "./model/generator";
export { countSolutions, generateSolution, solveSudoku } from "./model/solver";
export { CLUE_TARGETS, boxIndexFor, geometryFor, isPeer, isSudokuSize } from "./model/geometry";
export { DIFFICULTIES, SUDOKU_SIZES } from "./model/types";
export {
  countMistakes,
  createPlayState,
  enterValue,
  eraseCell,
  filledCount,
  isComplete,
  moveSelection,
  restartPuzzle,
  revealHint,
  selectCell,
} from "./model/play-state";
export type { PlayState } from "./model/play-state";
export type { Difficulty, SudokuPuzzle, SudokuSize } from "./model/types";
