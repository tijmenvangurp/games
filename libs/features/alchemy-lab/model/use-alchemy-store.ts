import { create } from "zustand";
import {
  BASE_ELEMENT_IDS,
  combine,
  firstIncompleteMission,
  getHint,
  nextMission as findNextMission,
  type ElementId,
  type Hint,
} from "@entities/alchemy";
import { playHaptic, playSound } from "@shared/lib";
import {
  loadAlchemyState,
  MAX_BOARD_ELEMENTS,
  normalizeDiscovered,
  saveAlchemyState,
} from "./storage";

interface Position {
  x: number;
  y: number;
}

export interface BoardElement extends Position {
  instanceId: string;
  elementId: ElementId;
}

export type AlchemyFeedback =
  | { kind: "new"; elementId: ElementId }
  | { kind: "known"; elementId: ElementId }
  | { kind: "wrong" }
  | { kind: "full" }
  | { kind: "all-found" };

interface AlchemyStore {
  discovered: ElementId[];
  board: BoardElement[];
  selected: string | null;
  feedback: AlchemyFeedback | null;
  hint: Hint | null;
  missionId: string | null;
  addToBoard: (elementId: ElementId, position?: Position) => void;
  moveBoardElement: (instanceId: string, position: Position) => void;
  combineBoardElements: (firstId: string, secondId: string) => void;
  combineWithBoard: (elementId: ElementId, instanceId: string) => void;
  select: (instanceId: string | null) => void;
  tapBoardElement: (instanceId: string) => void;
  clearBoard: () => void;
  showHint: () => void;
  clearHint: () => void;
  nextMission: () => void;
  dismissFeedback: () => void;
  reset: () => void;
}

type StoreSet = (
  partial: Partial<AlchemyStore> | ((state: AlchemyStore) => Partial<AlchemyStore>),
) => void;

type StoreGet = () => AlchemyStore;

let nextInstanceId = 1;

function createInstanceId(): string {
  return `board-${nextInstanceId++}`;
}

function clampX(value: number): number {
  return Math.min(0.86, Math.max(0.14, value));
}

function clampY(value: number): number {
  return Math.min(0.84, Math.max(0.16, value));
}

function clampPosition(position: Position): Position {
  return { x: clampX(position.x), y: clampY(position.y) };
}

/**
 * Places new elements on a loose 4×3 grid. This avoids stacking while keeping
 * the first few elements close to the middle of the workbench.
 */
function findFreePosition(board: readonly BoardElement[]): Position {
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const candidate = { x: 0.14 + col * 0.24, y: 0.18 + row * 0.3 };
      const occupied = board.some(
        (item) => Math.hypot((item.x - candidate.x) * 100, (item.y - candidate.y) * 100) < 14,
      );
      if (!occupied) {
        return candidate;
      }
    }
  }
  return { x: 0.5, y: 0.5 };
}

function persist(get: StoreGet): void {
  const { discovered, board } = get();
  saveAlchemyState({
    discovered,
    board: board.map(({ elementId, x, y }) => ({ elementId, x, y })),
  });
}

function rejectCombination(set: StoreSet): void {
  set({ selected: null, feedback: { kind: "wrong" }, hint: null });
}

function finishCombination(
  set: StoreSet,
  get: StoreGet,
  result: ElementId,
  nextBoard: readonly BoardElement[],
  position: Position,
): void {
  const { discovered } = get();
  const isNew = !discovered.includes(result);
  const resultInstance: BoardElement = {
    instanceId: createInstanceId(),
    elementId: result,
    ...clampPosition(position),
  };

  set({
    board: [...nextBoard, resultInstance],
    discovered: isNew ? [...discovered, result] : discovered,
    selected: resultInstance.instanceId,
    feedback: isNew ? { kind: "new", elementId: result } : { kind: "known", elementId: result },
    hint: null,
  });
  persist(get);
  playSound(isNew ? "win" : "match");
  playHaptic(isNew ? "win" : "match");
}

const initial = loadAlchemyState();
const initialDiscovered = normalizeDiscovered(initial.discovered);
const initialMission = firstIncompleteMission(initialDiscovered);
const initialBoard = initial.board.map((item) => ({
  instanceId: createInstanceId(),
  elementId: item.elementId,
  ...clampPosition(item),
}));

export const useAlchemyStore = create<AlchemyStore>((set, get) => ({
  discovered: initialDiscovered,
  board: initialBoard,
  selected: null,
  feedback: null,
  hint: null,
  missionId: initialMission?.id ?? null,

  addToBoard: (elementId, position) => {
    const { board } = get();
    const nextPosition = clampPosition(position ?? findFreePosition(board));
    const instance: BoardElement = {
      instanceId: createInstanceId(),
      elementId,
      ...nextPosition,
    };
    const full = board.length >= MAX_BOARD_ELEMENTS;
    const nextBoard = [...board, instance].slice(-MAX_BOARD_ELEMENTS);

    set({
      board: nextBoard,
      selected: instance.instanceId,
      feedback: full ? { kind: "full" } : null,
      hint: null,
    });
    persist(get);
    playSound("select");
    playHaptic("select");
  },

  moveBoardElement: (instanceId, position) => {
    const nextPosition = clampPosition(position);
    set((state) => ({
      board: state.board.map((item) =>
        item.instanceId === instanceId ? { ...item, ...nextPosition } : item,
      ),
    }));
    persist(get);
  },

  combineBoardElements: (firstId, secondId) => {
    if (firstId === secondId) {
      return;
    }

    const { board } = get();
    const first = board.find((item) => item.instanceId === firstId);
    const second = board.find((item) => item.instanceId === secondId);
    if (!first || !second) {
      return;
    }

    const result = combine(first.elementId, second.elementId);
    if (!result) {
      rejectCombination(set);
      return;
    }

    finishCombination(
      set,
      get,
      result,
      board.filter((item) => item.instanceId !== firstId && item.instanceId !== secondId),
      {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
      },
    );
  },

  combineWithBoard: (elementId, instanceId) => {
    const { board } = get();
    const target = board.find((item) => item.instanceId === instanceId);
    if (!target) {
      return;
    }

    const result = combine(elementId, target.elementId);
    if (!result) {
      rejectCombination(set);
      return;
    }

    finishCombination(
      set,
      get,
      result,
      board.filter((item) => item.instanceId !== instanceId),
      { x: target.x, y: target.y },
    );
  },

  select: (instanceId) => {
    set({ selected: instanceId });
  },

  tapBoardElement: (instanceId) => {
    const { selected } = get();
    if (!selected) {
      set({ selected: instanceId, feedback: null });
      playSound("tap");
      playHaptic("tap");
      return;
    }

    if (selected === instanceId) {
      set({ selected: null });
      return;
    }

    get().combineBoardElements(selected, instanceId);
  },

  clearBoard: () => {
    set({ board: [], selected: null, feedback: null, hint: null });
    persist(get);
    playSound("tap");
  },

  showHint: () => {
    const hint = getHint(new Set(get().discovered));
    set({
      hint,
      feedback: hint ? null : { kind: "all-found" },
    });
    if (hint) {
      playSound("hint");
      playHaptic("hint");
    }
  },

  clearHint: () => set({ hint: null }),

  nextMission: () => {
    const { discovered, missionId } = get();
    const mission = findNextMission(discovered, missionId);
    set({ missionId: mission?.id ?? null });
    playSound("tap");
    playHaptic("tap");
  },

  dismissFeedback: () => set({ feedback: null }),

  reset: () => {
    const discovered = [...BASE_ELEMENT_IDS];
    set({
      discovered,
      board: [],
      selected: null,
      feedback: null,
      hint: null,
      missionId: firstIncompleteMission(discovered)?.id ?? null,
    });
    persist(get);
  },
}));

/** Only used by tests to keep instance IDs deterministic across cases. */
export function resetAlchemyInstanceCounter(): void {
  nextInstanceId = 1;
}
