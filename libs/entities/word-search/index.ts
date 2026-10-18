export { WORD_SEARCH_CONFIG, WORD_SEARCH_DIRECTIONS, WORD_SEARCH_WORDS } from "./model/config";
export type { WordSearchDirection } from "./model/config";
export { createWordSearch } from "./model/generator";
export { cellsBetween, selectionMatches } from "./model/selection";
export { WORD_SEARCH_DIFFICULTIES, WORD_SEARCH_THEMES } from "./model/types";
export type {
  Cell,
  WordSearchDifficulty,
  WordSearchPlacement,
  WordSearchPuzzle,
  WordSearchTheme,
} from "./model/types";
