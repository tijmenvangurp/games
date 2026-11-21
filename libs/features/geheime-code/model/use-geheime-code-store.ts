import { create } from "zustand";
import {
  applyAttempt,
  createPuzzle,
  firstEmptyCell,
  setFor,
  wordComplete,
  type LevelId,
  type Progress,
  type Puzzle,
  type RoundResult,
  type ThemeId,
} from "@entities/geheime-code";
import { createSeed, mulberry32, playHaptic, playSound } from "@shared/lib";
import { loadProgress, saveProgress } from "./storage";

const HINT_AFTER_MISTAKES = 2;
const REVEAL_AFTER_MISTAKES = 4;

interface GeheimeCodeStore {
  theme: ThemeId;
  level: LevelId;
  round: 1 | 2;
  puzzle: Puzzle | null;
  entries: readonly (readonly string[])[];
  activeRow: number;
  activeCell: number;
  hintLetter: string | null;
  wrongCell: number | null;
  wordMistakes: number;
  wordHints: number;
  firstTry: number;
  wordDone: boolean;
  result: RoundResult | null;
  progress: Progress;
  chooseTheme: (theme: ThemeId) => void;
  chooseLevel: (level: LevelId) => void;
  start: () => void;
  restart: () => void;
  leave: () => void;
  typeLetter: (raw: string) => void;
  clearCell: () => void;
  selectCell: (cell: number) => void;
  nextWord: () => void;
}

type SetState = (
  partial: Partial<GeheimeCodeStore> | ((state: GeheimeCodeStore) => Partial<GeheimeCodeStore>),
) => void;

type GetState = () => GeheimeCodeStore;

const INITIAL_STATE = {
  theme: "sinterklaas" as ThemeId,
  level: 1 as LevelId,
  round: 1 as 1 | 2,
  puzzle: null,
  entries: [],
  activeRow: 0,
  activeCell: 0,
  hintLetter: null,
  wrongCell: null,
  wordMistakes: 0,
  wordHints: 0,
  firstTry: 0,
  wordDone: false,
  result: null,
  progress: loadProgress(),
};

function emptyEntries(puzzle: Puzzle): string[][] {
  return puzzle.rows.map((row) => row.cells.map(() => ""));
}

function startRound(set: SetState, theme: ThemeId, level: LevelId, round: 1 | 2): void {
  const wordSet = setFor(theme, level, round) ?? setFor(theme, level, 1);
  if (!wordSet) {
    return;
  }
  const puzzle = createPuzzle(wordSet, mulberry32(createSeed()));
  const entries = emptyEntries(puzzle);
  const firstRow = puzzle.rows[0];
  const activeCell = firstRow ? Math.max(0, firstEmptyCell(firstRow, entries[0] ?? [])) : 0;
  set({
    theme,
    level,
    round: wordSet.round,
    puzzle,
    entries,
    activeRow: 0,
    activeCell,
    hintLetter: null,
    wrongCell: null,
    wordMistakes: 0,
    wordHints: 0,
    firstTry: 0,
    wordDone: firstRow ? wordComplete(firstRow, entries[0] ?? []) : false,
    result: null,
  });
}

function finish(set: SetState, get: GetState): void {
  const { theme, level, round, firstTry, puzzle, progress } = get();
  if (!puzzle) {
    return;
  }
  const result: RoundResult = { theme, level, round, firstTry, total: puzzle.rows.length };
  const updated = applyAttempt(progress, { ...result, at: Date.now() });
  saveProgress(updated);
  set({ result, progress: updated });
}

interface FillOptions {
  readonly hints: number;
  readonly mistakes?: number;
}

function fillCurrentCell(set: SetState, get: GetState, letter: string, options: FillOptions): void {
  const state = get();
  const row = state.puzzle?.rows[state.activeRow];
  if (!row) {
    return;
  }
  const rowEntries = [...(state.entries[state.activeRow] ?? [])];
  rowEntries[state.activeCell] = letter;
  const nextEntries = state.entries.map((entry, index) =>
    index === state.activeRow ? rowEntries : entry,
  );
  const complete = wordComplete(row, rowEntries);
  const next = firstEmptyCell(row, rowEntries);
  const wordMistakes = options.mistakes ?? state.wordMistakes;
  const wordHints = state.wordHints + options.hints;
  const firstTry =
    complete && wordMistakes === 0 && wordHints === 0 ? state.firstTry + 1 : state.firstTry;

  set({
    entries: nextEntries,
    activeCell: next >= 0 ? next : state.activeCell,
    wordMistakes,
    wordHints,
    firstTry,
    wordDone: complete,
    wrongCell: null,
    hintLetter: null,
  });
  playSound(options.hints > 0 ? "hint" : complete ? "almost" : "match");
  if (complete) {
    playHaptic("match");
  }
}

function handleWordLetter(
  set: SetState,
  get: GetState,
  row: NonNullable<Puzzle["rows"][number]>,
  cell: NonNullable<Puzzle["rows"][number]["cells"][number]>,
  letter: string,
): void {
  if (letter === cell.letter) {
    fillCurrentCell(set, get, cell.letter, { hints: 0 });
    return;
  }

  const state = get();
  const mistakes = state.wordMistakes + 1;
  if (mistakes >= REVEAL_AFTER_MISTAKES) {
    fillCurrentCell(set, get, cell.letter, { hints: 1, mistakes });
    return;
  }
  set({
    wordMistakes: mistakes,
    wrongCell: state.activeCell,
    hintLetter: mistakes >= HINT_AFTER_MISTAKES ? cell.letter : null,
  });
}

function handleLetter(set: SetState, get: GetState, raw: string): void {
  const letter = raw.toLowerCase();
  if (!/^[a-z]$/.test(letter)) {
    return;
  }
  const state = get();
  if (!state.puzzle || state.result) {
    return;
  }
  const row = state.puzzle.rows[state.activeRow];
  const cell = row?.cells[state.activeCell];
  if (!row || !cell) {
    return;
  }
  handleWordLetter(set, get, row, cell, letter);
}

function clearCell(set: SetState, get: GetState): void {
  const state = get();
  if (!state.puzzle || state.result) {
    return;
  }
  const row = state.puzzle.rows[state.activeRow];
  if (!row) {
    return;
  }

  let index = state.activeCell;
  if (!state.entries[state.activeRow]?.[index] && index > 0) {
    index -= 1;
  }

  const rowEntries = [...(state.entries[state.activeRow] ?? [])];
  rowEntries[index] = "";
  const nextEntries = state.entries.map((entry, rowIndex) =>
    rowIndex === state.activeRow ? rowEntries : entry,
  );
  set({ entries: nextEntries, activeCell: index, wordDone: false, wrongCell: null });
}

function selectCell(set: SetState, get: GetState, cell: number): void {
  const state = get();
  const row = state.puzzle?.rows[state.activeRow];
  if (!row?.cells[cell]) {
    return;
  }
  set({ activeCell: cell, wrongCell: null });
}

function nextWord(set: SetState, get: GetState): void {
  const state = get();
  if (!state.puzzle || !state.wordDone || state.result) {
    return;
  }
  if (state.activeRow + 1 >= state.puzzle.rows.length) {
    finish(set, get);
    return;
  }
  const nextRow = state.activeRow + 1;
  const row = state.puzzle.rows[nextRow];
  if (!row) {
    return;
  }
  const rowEntries = state.entries[nextRow] ?? [];
  set({
    activeRow: nextRow,
    activeCell: Math.max(0, firstEmptyCell(row, rowEntries)),
    wordDone: wordComplete(row, rowEntries),
    wordMistakes: 0,
    wordHints: 0,
    hintLetter: null,
    wrongCell: null,
  });
}

export const useGeheimeCodeStore = create<GeheimeCodeStore>((set, get) => ({
  ...INITIAL_STATE,
  chooseTheme: (theme) => set({ theme }),
  chooseLevel: (level) => set({ level }),
  start: () => startRound(set, get().theme, get().level, 1),
  restart: () => {
    const { theme, level, round } = get();
    startRound(set, theme, level, round === 1 ? 2 : 1);
  },
  leave: () => set({ puzzle: null, result: null }),
  typeLetter: (raw) => handleLetter(set, get, raw),
  clearCell: () => clearCell(set, get),
  selectCell: (cell) => selectCell(set, get, cell),
  nextWord: () => nextWord(set, get),
}));
