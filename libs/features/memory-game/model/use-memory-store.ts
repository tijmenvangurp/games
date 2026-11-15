import { create } from "zustand";
import {
  accuracyOf,
  applyRound,
  pickReviewIds,
  recordReview,
  type AdaptiveConfig,
  type Attempt,
  type ReviewState,
  type RoundSummary,
} from "@entities/adaptive";
import {
  clampMemoryLevelIndex,
  createMemoryScene,
  MEMORY_LEVELS,
  type MemoryScene,
} from "@entities/memory";
import { flipCard } from "./flip-card";
import {
  currentLevelIndex,
  DEFAULT_MEMORY_SETTINGS,
  type MemoryMode,
  type MemorySettings,
} from "./settings";
import { loadMemoryState, saveMemoryState } from "./storage";

const REVIEW_ITEMS_PER_BOARD = 2;

const ADAPTIVE_CONFIG: AdaptiveConfig = {
  levelCount: MEMORY_LEVELS.length,
  startIndex: DEFAULT_MEMORY_SETTINGS.adaptive.levelIndex,
  successesToLevelUp: 2,
  maxStepsPerRound: 1,
};

interface MemoryHint {
  indices: readonly number[];
  level: 1 | 2 | 3;
}

interface MemoryStore {
  scene: MemoryScene | null;
  matched: boolean[];
  flipped: number[];
  locked: boolean;
  moves: number;
  found: boolean;
  settings: MemorySettings;
  review: ReviewState;
  attempts: readonly Attempt[];
  outcomes: readonly boolean[];
  boardHints: number;
  invalidTaps: number;
  seen: readonly number[];
  firstFlipAt: number | null;
  pairHints: number;
  hint: MemoryHint | null;
  isChallenge: boolean;
  lastRound: RoundSummary | null;
  start: (scene: MemoryScene, challenge?: boolean) => void;
  newGame: () => void;
  abandon: () => void;
  challenge: () => void;
  flip: (index: number) => void;
  resolveMismatch: () => void;
  requestHint: () => void;
  clearHint: () => void;
  chooseMode: (mode: MemoryMode) => void;
  chooseManualLevel: (levelIndex: number) => void;
}

type StoreSet = (partial: Partial<MemoryStore>) => void;
type StoreGet = () => MemoryStore;

function persist(state: Pick<MemoryStore, "settings" | "review" | "attempts">): void {
  saveMemoryState({
    settings: state.settings,
    review: state.review,
    attempts: state.attempts,
  });
}

function reviewIdsFor(review: ReviewState): number[] {
  return pickReviewIds(review, REVIEW_ITEMS_PER_BOARD)
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id));
}

function levelIndexForSettings(settings: MemorySettings): number {
  return clampMemoryLevelIndex(currentLevelIndex(settings));
}

interface FinishInput {
  settings: MemorySettings;
  scene: MemoryScene;
  isChallenge: boolean;
  outcomes: readonly boolean[];
  hints: number;
  invalidTaps: number;
  abandoned: boolean;
}

interface FinishResult {
  settings: MemorySettings;
  summary: RoundSummary;
}

function finishRound(input: FinishInput): FinishResult {
  const summary = applyRound(
    input.settings.adaptive,
    {
      outcomes: input.outcomes,
      hints: input.hints,
      invalidTaps: input.invalidTaps,
      abandoned: input.abandoned,
    },
    ADAPTIVE_CONFIG,
  );

  if (!input.isChallenge) {
    return {
      settings: { ...input.settings, adaptive: summary.state },
      summary,
    };
  }

  // A challenge is optional. Winning it promotes the automatic level; losing
  // it never demotes. The child chose the harder board, so effort is enough.
  if (accuracyOf(input.outcomes) < 0.7) {
    return {
      settings: input.settings,
      summary: { ...summary, delta: 0, state: input.settings.adaptive, stuck: false },
    };
  }

  const levelIndex = Math.max(input.settings.adaptive.levelIndex, input.scene.levelIndex);
  return {
    settings: {
      ...input.settings,
      adaptive: { levelIndex, streak: 0 },
    },
    summary: {
      ...summary,
      delta: levelIndex - input.settings.adaptive.levelIndex,
      state: { levelIndex, streak: 0 },
      stuck: false,
    },
  };
}

function emptyBoardState(scene: MemoryScene, challenge: boolean): Partial<MemoryStore> {
  return {
    scene,
    matched: Array.from({ length: scene.cards.length }, () => false),
    flipped: [],
    locked: false,
    moves: 0,
    found: false,
    outcomes: [],
    boardHints: 0,
    invalidTaps: 0,
    seen: [],
    firstFlipAt: null,
    pairHints: 0,
    hint: null,
    isChallenge: challenge,
    lastRound: null,
  };
}

function startAction(set: StoreSet, scene: MemoryScene, challenge = false): void {
  set(emptyBoardState(scene, challenge));
}

function newGameAction(set: StoreSet, get: StoreGet): void {
  get().abandon();
  const { settings, review } = get();
  const levelIndex = levelIndexForSettings(settings);
  startAction(set, createMemoryScene(levelIndex, undefined, reviewIdsFor(review)));
}

function challengeAction(set: StoreSet, get: StoreGet): void {
  get().abandon();
  const { settings, review } = get();
  const levelIndex = Math.min(MEMORY_LEVELS.length - 1, levelIndexForSettings(settings) + 2);
  startAction(set, createMemoryScene(levelIndex, undefined, reviewIdsFor(review)), true);
}

function abandonAction(set: StoreSet, get: StoreGet): void {
  const state = get();
  if (!state.scene || state.found || state.outcomes.length === 0) {
    return;
  }
  const { settings, summary } = finishRound({
    settings: state.settings,
    scene: state.scene,
    isChallenge: state.isChallenge,
    outcomes: state.outcomes,
    hints: state.boardHints,
    invalidTaps: state.invalidTaps,
    abandoned: true,
  });
  set({ settings, lastRound: summary, hint: null });
  persist({ settings, review: state.review, attempts: state.attempts });
}

interface PairLog {
  attempts: readonly Attempt[];
  review: ReviewState;
  outcomes: readonly boolean[];
}

function logPair(
  state: MemoryStore,
  scene: MemoryScene,
  first: number,
  second: number,
  now: number,
): PairLog {
  const durationMs = state.firstFlipAt === null ? 0 : Math.max(0, now - state.firstFlipAt);
  const hints = state.pairHints;
  const isMatch = scene.cards[first] === scene.cards[second];
  const attempts = [...state.attempts];
  const outcomes = [...state.outcomes, isMatch];
  let review = state.review;

  if (isMatch) {
    const itemId = String(scene.cards[first]);
    attempts.push({ itemId, ok: true, at: now, durationMs, hints });
    if (review[itemId]) {
      review = recordReview(review, itemId, true, now);
    }
  } else {
    for (const cardIndex of [first, second]) {
      const itemId = String(scene.cards[cardIndex]);
      attempts.push({ itemId, ok: false, at: now, durationMs, hints });
      review = recordReview(review, itemId, false, now);
    }
  }

  return { attempts, review, outcomes };
}

function canFlip(state: MemoryStore, index: number): boolean {
  const { scene } = state;
  return (
    Boolean(scene) &&
    !state.locked &&
    !state.found &&
    index >= 0 &&
    index < (scene?.cards.length ?? 0) &&
    !state.matched[index] &&
    !state.flipped.includes(index)
  );
}

function finishBoard(set: StoreSet, state: MemoryStore, scene: MemoryScene, log: PairLog): void {
  const { settings, summary } = finishRound({
    settings: state.settings,
    scene,
    isChallenge: state.isChallenge,
    outcomes: log.outcomes,
    hints: state.boardHints,
    invalidTaps: state.invalidTaps,
    abandoned: false,
  });
  set({ settings, lastRound: summary });
  persist({ settings, review: log.review, attempts: log.attempts });
}

function flipAction(set: StoreSet, get: StoreGet, index: number): void {
  const state = get();
  const { scene } = state;

  if (!scene || !canFlip(state, index)) {
    set({ invalidTaps: state.invalidTaps + 1 });
    return;
  }

  const outcome = flipCard(
    {
      cards: scene.cards,
      matched: state.matched,
      flipped: state.flipped,
      moves: state.moves,
      locked: state.locked,
      found: state.found,
    },
    index,
  );

  if (!outcome) {
    set({ invalidTaps: state.invalidTaps + 1 });
    return;
  }

  const now = Date.now();
  const seen = state.seen.includes(index) ? state.seen : [...state.seen, index];
  const first = state.flipped[0];

  if (first === undefined) {
    set({ ...outcome, seen, firstFlipAt: now, hint: null });
    return;
  }

  const log = logPair(state, scene, first, index, now);
  set({
    ...outcome,
    seen,
    outcomes: log.outcomes,
    attempts: log.attempts,
    review: log.review,
    firstFlipAt: null,
    pairHints: 0,
    hint: null,
  });

  if (outcome.found) {
    finishBoard(set, state, scene, log);
    return;
  }
  persist({ settings: state.settings, review: log.review, attempts: log.attempts });
}

function unmatchedIndexes(scene: MemoryScene, matched: readonly boolean[]): number[] {
  return scene.cards.map((_, index) => index).filter((index) => !matched[index]);
}

function indexesByPokemon(scene: MemoryScene, indexes: readonly number[]): Map<number, number[]> {
  const byPokemon = new Map<number, number[]>();
  for (const index of indexes) {
    const id = scene.cards[index];
    byPokemon.set(id, [...(byPokemon.get(id) ?? []), index]);
  }
  return byPokemon;
}

function hintTarget(state: MemoryStore): MemoryHint | null {
  const { scene } = state;
  if (!scene || state.found || state.locked) {
    return null;
  }

  const unmatched = unmatchedIndexes(scene, state.matched);
  const candidate = state.seen.find((index) => unmatched.includes(index)) ?? unmatched[0];
  if (candidate === undefined) {
    return null;
  }

  const mate = indexesByPokemon(scene, unmatched)
    .get(scene.cards[candidate])
    ?.find((index) => index !== candidate);
  const level = Math.min(3, state.boardHints + 1) as 1 | 2 | 3;
  return {
    indices: level === 1 || mate === undefined ? [candidate] : [candidate, mate],
    level,
  };
}

function requestHintAction(set: StoreSet, get: StoreGet): void {
  const state = get();
  const target = hintTarget(state);
  if (!target) {
    return;
  }
  set({
    hint: target,
    boardHints: state.boardHints + 1,
    pairHints: state.pairHints + 1,
  });
}

function chooseModeAction(set: StoreSet, get: StoreGet, mode: MemoryMode): void {
  const current = get().settings;
  const manualIndex =
    mode === "manual" && current.mode === "auto"
      ? current.adaptive.levelIndex
      : current.manualIndex;
  const settings: MemorySettings = { ...current, mode, manualIndex };
  set({ settings });
  persist({ settings, review: get().review, attempts: get().attempts });
}

function chooseManualLevelAction(set: StoreSet, get: StoreGet, levelIndex: number): void {
  const current = get().settings;
  const settings: MemorySettings = {
    ...current,
    mode: "manual",
    manualIndex: clampMemoryLevelIndex(levelIndex),
  };
  set({ settings });
  persist({ settings, review: get().review, attempts: get().attempts });
}

const initial = loadMemoryState();

export const useMemoryStore = create<MemoryStore>((set, get) => ({
  scene: null,
  matched: [],
  flipped: [],
  locked: false,
  moves: 0,
  found: false,
  settings: initial.settings,
  review: initial.review,
  attempts: initial.attempts,
  outcomes: [],
  boardHints: 0,
  invalidTaps: 0,
  seen: [],
  firstFlipAt: null,
  pairHints: 0,
  hint: null,
  isChallenge: false,
  lastRound: null,

  start: (scene, challenge = false) => startAction(set, scene, challenge),
  newGame: () => newGameAction(set, get),
  abandon: () => abandonAction(set, get),
  challenge: () => challengeAction(set, get),
  flip: (index) => flipAction(set, get, index),
  resolveMismatch: () => set((state) => (state.locked ? { flipped: [], locked: false } : {})),
  requestHint: () => requestHintAction(set, get),
  clearHint: () => set({ hint: null }),
  chooseMode: (mode) => chooseModeAction(set, get, mode),
  chooseManualLevel: (levelIndex) => chooseManualLevelAction(set, get, levelIndex),
}));
