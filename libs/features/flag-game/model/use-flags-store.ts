import { create } from "zustand";
import {
  COUNTRIES,
  createPuzzleRound,
  createRound,
  puzzleMap,
  worldShapeCodes,
  type FlagLevel,
  type FlagRound,
  type FlagScope,
  type PuzzleMap,
  type PuzzleRound,
} from "@entities/geography";
import { playHaptic, playSound } from "@shared/lib";
import { bestKey, puzzleBestKey, type FlagMode, type FlagSettings } from "./settings";
import { loadFlagState, saveFlagState } from "./storage";

/** The puzzle board is drawn once in SVG units and scaled by CSS. */
export const PUZZLE_MAP_WIDTH = 360;
export const PUZZLE_MAP_HEIGHT = 280;

type PuzzleFeedback =
  | { kind: "correct"; name: string }
  | { kind: "revealed"; name: string }
  | { kind: "wrong"; name: string; wrongName?: string };

export interface PuzzleState {
  round: PuzzleRound;
  map: PuzzleMap;
  selected: string | null;
  placed: readonly string[];
  /** Wrong drops per piece; two mistakes reveal its place. */
  mistakes: Readonly<Record<string, number>>;
  feedback: PuzzleFeedback | null;
}

interface FlagStore {
  round: FlagRound | null;
  questionIndex: number;
  wrongChoices: readonly string[];
  answered: boolean;
  correct: boolean;
  stars: number;
  streak: number;
  finished: boolean;
  settings: FlagSettings;
  best: Record<string, number>;
  puzzle: PuzzleState | null;
  puzzleLoading: boolean;
  puzzleError: boolean;
  start: () => void;
  newRound: () => void;
  chooseMode: (mode: FlagMode) => void;
  chooseScope: (scope: FlagScope) => void;
  chooseLevel: (level: FlagLevel) => void;
  chooseAnswer: (code: string) => void;
  next: () => void;
  startPuzzle: () => Promise<void>;
  selectPiece: (code: string) => void;
  placePiece: (targetCode: string | undefined) => void;
}

type StoreSet = (partial: Partial<FlagStore> | ((state: FlagStore) => Partial<FlagStore>)) => void;

type StoreGet = () => FlagStore;

function saveSettings(set: StoreSet, get: StoreGet, patch: Partial<FlagSettings>): void {
  const settings = { ...get().settings, ...patch };
  set({ settings });
  saveFlagState({ settings, best: get().best });
}

function startRound(set: StoreSet, get: StoreGet): void {
  const { settings, best } = get();
  const round = createRound(settings.scope, settings.level);
  set({
    round,
    questionIndex: 0,
    wrongChoices: [],
    answered: false,
    correct: false,
    stars: 0,
    streak: 0,
    finished: false,
  });
  saveFlagState({ settings, best });
}

function chooseMode(set: StoreSet, get: StoreGet, mode: FlagMode): void {
  const { scope } = get().settings;
  // Provinces have no outline in the world atlas yet, so the puzzle stays on
  // the map of a country scope.
  const nextScope = mode === "kaartpuzzel" && scope === "nederland" ? "europa" : scope;
  saveSettings(set, get, { mode, scope: nextScope });
}

function chooseScope(set: StoreSet, get: StoreGet, scope: FlagScope): void {
  saveSettings(set, get, { scope });
}

function chooseLevel(set: StoreSet, get: StoreGet, level: FlagLevel): void {
  saveSettings(set, get, { level });
}

function answerQuestion(set: StoreSet, get: StoreGet, code: string): void {
  const { round, questionIndex, wrongChoices, answered, stars, streak } = get();
  if (!round || answered) {
    return;
  }

  const question = round.questions[questionIndex];
  if (!question) {
    return;
  }

  if (code === question.subject.code) {
    const firstTry = wrongChoices.length === 0;
    set({
      answered: true,
      correct: true,
      stars: stars + (firstTry ? 1 : 0),
      streak: firstTry ? streak + 1 : 0,
    });
    playSound("match");
    playHaptic("match");
    return;
  }

  const nextWrong = [...wrongChoices, code];
  // All but one option ruled out: show the answer without a further guess.
  const revealed = nextWrong.length >= question.choices.length - 1;
  set({
    wrongChoices: nextWrong,
    answered: revealed,
    correct: false,
    streak: 0,
  });
  playSound(revealed ? "almost" : "wrong");
  playHaptic(revealed ? "almost" : "wrong");
}

function nextQuestion(set: StoreSet, get: StoreGet): void {
  const { round, questionIndex, answered, stars, best, settings, finished } = get();
  if (!round || finished || !answered) {
    return;
  }

  if (questionIndex + 1 >= round.questions.length) {
    const key = bestKey(settings.scope, settings.level);
    const nextBest = { ...best, [key]: Math.max(best[key] ?? 0, stars) };
    set({ finished: true, best: nextBest });
    saveFlagState({ settings, best: nextBest });
    playSound("win");
    playHaptic("win");
    return;
  }

  set({
    questionIndex: questionIndex + 1,
    wrongChoices: [],
    answered: false,
    correct: false,
  });
  playSound("tap");
  playHaptic("tap");
}

async function startPuzzleRound(set: StoreSet, get: StoreGet): Promise<void> {
  const { settings } = get();
  set({
    puzzle: null,
    puzzleLoading: true,
    puzzleError: false,
    stars: 0,
    streak: 0,
    finished: false,
  });

  try {
    const shapeCodes = await worldShapeCodes();
    const round = createPuzzleRound(settings.scope, settings.level, shapeCodes);
    const map = await puzzleMap(
      round.questions.map((question) => question.country),
      PUZZLE_MAP_WIDTH,
      PUZZLE_MAP_HEIGHT,
    );
    set({
      puzzle: { round, map, selected: null, placed: [], mistakes: {}, feedback: null },
      puzzleLoading: false,
    });
  } catch {
    set({ puzzleLoading: false, puzzleError: true });
  }
}

function selectPiece(set: StoreSet, get: StoreGet, code: string): void {
  const { puzzle } = get();
  if (!puzzle || puzzle.placed.includes(code)) {
    return;
  }

  set({
    puzzle: { ...puzzle, selected: puzzle.selected === code ? null : code, feedback: null },
  });
  playSound("tap");
  playHaptic("tap");
}

function bestAfterPuzzle(
  best: Record<string, number>,
  scope: FlagScope,
  level: FlagLevel,
  stars: number,
): Record<string, number> {
  const key = puzzleBestKey(scope, level);

  return { ...best, [key]: Math.max(best[key] ?? 0, stars) };
}

/** Locks the selected piece into its place and moves the round along. */
function lockPiece(
  set: StoreSet,
  get: StoreGet,
  kind: "correct" | "revealed",
  mistakes: number,
): void {
  const { puzzle, stars, streak, best, settings } = get();
  const question = puzzle?.round.questions.find((entry) => entry.country.code === puzzle?.selected);
  if (!puzzle || !question) {
    return;
  }

  const firstTry = kind === "correct" && mistakes === 0;
  const placed = [...puzzle.placed, question.country.code];
  const nextStars = stars + (firstTry ? 1 : 0);
  const finished = placed.length === puzzle.round.questions.length;
  const nextBest = finished
    ? bestAfterPuzzle(best, puzzle.round.scope, puzzle.round.level, nextStars)
    : best;

  set({
    puzzle: {
      ...puzzle,
      selected: null,
      placed,
      feedback: { kind, name: question.country.name },
    },
    stars: nextStars,
    streak: firstTry ? streak + 1 : 0,
    finished,
    best: nextBest,
  });

  if (finished) {
    saveFlagState({ settings, best: nextBest });
    playSound("win");
    playHaptic("win");
    return;
  }

  playSound(kind === "revealed" ? "almost" : "match");
  playHaptic(kind === "revealed" ? "almost" : "match");
}

function placePiece(set: StoreSet, get: StoreGet, targetCode: string | undefined): void {
  const { puzzle } = get();
  if (!puzzle?.selected) {
    return;
  }

  const code = puzzle.selected;
  const question = puzzle.round.questions.find((entry) => entry.country.code === code);
  if (!question) {
    return;
  }

  if (targetCode === code) {
    lockPiece(set, get, "correct", puzzle.mistakes[code] ?? 0);
    return;
  }

  if (!targetCode) {
    // Dropped next to the map: no penalty, just point back to the board.
    set({ puzzle: { ...puzzle, feedback: { kind: "wrong", name: question.country.name } } });
    return;
  }

  const mistakes = (puzzle.mistakes[code] ?? 0) + 1;
  if (mistakes >= 2) {
    lockPiece(set, get, "revealed", mistakes);
    return;
  }

  const wrongName = COUNTRIES.find((country) => country.code === targetCode)?.name;
  set({
    puzzle: {
      ...puzzle,
      mistakes: { ...puzzle.mistakes, [code]: mistakes },
      feedback: { kind: "wrong", name: question.country.name, wrongName },
    },
    streak: 0,
  });
  playSound("wrong");
  playHaptic("wrong");
}

const initial = loadFlagState();

export const useFlagStore = create<FlagStore>((set, get) => ({
  round: null,
  questionIndex: 0,
  wrongChoices: [],
  answered: false,
  correct: false,
  stars: 0,
  streak: 0,
  finished: false,
  settings: initial.settings,
  best: initial.best,
  puzzle: null,
  puzzleLoading: false,
  puzzleError: false,

  start: () => startRound(set, get),
  newRound: () => startRound(set, get),
  chooseMode: (mode) => chooseMode(set, get, mode),
  chooseScope: (scope) => chooseScope(set, get, scope),
  chooseLevel: (level) => chooseLevel(set, get, level),
  chooseAnswer: (code) => answerQuestion(set, get, code),
  next: () => nextQuestion(set, get),
  startPuzzle: () => startPuzzleRound(set, get),
  selectPiece: (code) => selectPiece(set, get, code),
  placePiece: (code) => placePiece(set, get, code),
}));
