import { create } from "zustand";
import {
  findHint,
  isArrowRemovable,
  isSolved,
  levelAt,
  LEVEL_COUNT,
  type MazeArrow,
  type MazeLevel,
} from "@entities/arrow";
import { loadArrowsProgress, saveArrowsProgress } from "./storage";

type ArrowsStatus = "playing" | "won";

export type ArrowsTapResult = "ignored" | "blocked" | "removed" | "won";

interface ArrowsStore {
  levelIndex: number;
  unlocked: number;
  level: MazeLevel;
  removedIds: number[];
  history: number[];
  status: ArrowsStatus;
  hintId: number | null;
  startLevel: (index: number) => void;
  tap: (id: number) => ArrowsTapResult;
  undo: () => void;
  hint: () => number | null;
  clearHint: () => void;
  restart: () => void;
  nextLevel: () => void;
}

type ArrowsSet = (partial: Partial<ArrowsStore>) => void;
type ArrowsGet = () => ArrowsStore;

const initialProgress = loadArrowsProgress();
const initialLevel = levelAt(initialProgress.current);

const emptyBoard = {
  removedIds: [] as number[],
  history: [] as number[],
  status: "playing" as ArrowsStatus,
  hintId: null,
};

function clampLevel(index: number, unlocked: number): number {
  return Math.min(Math.max(0, index), unlocked - 1);
}

function startLevelAction(set: ArrowsSet, get: ArrowsGet, index: number): void {
  const { unlocked } = get();
  const levelIndex = clampLevel(index, unlocked);
  set({
    levelIndex,
    level: levelAt(levelIndex),
    ...emptyBoard,
  });
  saveArrowsProgress({ unlocked, current: levelIndex });
}

function blockArrow(set: ArrowsSet): ArrowsTapResult {
  // A blocked tap never ends the level. The arrow shakes, the status line
  // explains why, and the child can try another arrow or ask for a hint.
  set({ hintId: null });
  return "blocked";
}

function removeArrow(set: ArrowsSet, state: ArrowsStore, arrow: MazeArrow): ArrowsTapResult {
  const removedIds = [...state.removedIds, arrow.id];
  const solved = isSolved(state.level, new Set(removedIds));
  const unlocked = solved
    ? Math.min(LEVEL_COUNT, Math.max(state.unlocked, state.levelIndex + 2))
    : state.unlocked;

  set({
    removedIds,
    history: [...state.history, arrow.id],
    status: solved ? "won" : "playing",
    hintId: null,
    unlocked,
  });

  if (solved) {
    saveArrowsProgress({ unlocked, current: state.levelIndex });
  }

  return solved ? "won" : "removed";
}

function tapAction(set: ArrowsSet, get: ArrowsGet, id: number): ArrowsTapResult {
  const state = get();
  if (state.status !== "playing" || state.removedIds.includes(id)) {
    return "ignored";
  }

  const arrow = state.level.arrows.find((candidate) => candidate.id === id);
  if (!arrow) {
    return "ignored";
  }

  const removed = new Set(state.removedIds);
  return isArrowRemovable(arrow, state.level, removed)
    ? removeArrow(set, state, arrow)
    : blockArrow(set);
}

function undoAction(set: ArrowsSet, get: ArrowsGet): void {
  const { history, removedIds, status } = get();
  if (status !== "playing" || history.length === 0) {
    return;
  }
  const last = history[history.length - 1] as number;
  set({
    removedIds: removedIds.filter((id) => id !== last),
    history: history.slice(0, -1),
    hintId: null,
  });
}

function hintAction(set: ArrowsSet, get: ArrowsGet): number | null {
  const { level, removedIds, status } = get();
  if (status !== "playing") {
    return null;
  }
  const arrow = findHint(level, new Set(removedIds));
  if (!arrow) {
    return null;
  }
  set({ hintId: arrow.id });
  return arrow.id;
}

function nextLevelAction(set: ArrowsSet, get: ArrowsGet): void {
  const { levelIndex, unlocked } = get();
  if (levelIndex + 1 < LEVEL_COUNT) {
    startLevelAction(set, get, Math.min(levelIndex + 1, unlocked - 1));
  }
}

export const useArrowsStore = create<ArrowsStore>((set, get) => ({
  levelIndex: initialProgress.current,
  unlocked: initialProgress.unlocked,
  level: initialLevel,
  ...emptyBoard,

  startLevel: (index) => startLevelAction(set, get, index),
  tap: (id) => tapAction(set, get, id),
  undo: () => undoAction(set, get),
  hint: () => hintAction(set, get),
  clearHint: () => set({ hintId: null }),
  restart: () => set({ ...emptyBoard }),
  nextLevel: () => nextLevelAction(set, get),
}));
