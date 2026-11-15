import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  canPlace,
  drive,
  LEVEL_COUNT,
  levelAt,
  trayItemMatches,
  type Level,
  type Placement,
  type TrayItem,
} from "@entities/gear";
import { playHaptic, playSound } from "@shared/lib";
import { JAMMED } from "./feedback";
import { sizeWord } from "./labels";
import {
  connectionKey,
  holeForGearKey,
  isLinkPlacement,
  linkPlacementKind,
  nextSolutionPlacement,
  occupiedHoleIds,
  rejectionFor,
  selectedTrayItem,
} from "./placement";
import {
  DEFAULT_DRAAIWERK_PROGRESS,
  DRAAIWERK_STORAGE_KEY,
  DRAAIWERK_STORAGE_VERSION,
  normalizeDraaiwerkProgress,
} from "./storage";

type DraaiwerkStatus = "playing" | "solved";
type DraaiwerkFeedbackTone = "info" | "warn" | "success";

interface DraaiwerkStore {
  levelIndex: number;
  unlocked: number;
  finished: boolean;
  level: Level;
  placements: Placement[];
  usedTrayIds: string[];
  selectedTrayId: string | null;
  pendingHoleId: string | null;
  pendingGearKey: string | null;
  status: DraaiwerkStatus;
  hintPlacement: Placement | null;
  feedback: string | null;
  feedbackTone: DraaiwerkFeedbackTone | null;
  mistakes: number;
  startLevel: (index: number) => void;
  selectTray: (id: string) => void;
  dropTray: (id: string, target: { kind: "hole" | "gear"; targetId: string }) => void;
  connectTray: (id: string, fromGearKey: string, toGearKey: string) => void;
  movePlaced: (key: string, targetHoleId: string) => void;
  removePlaced: (key: string) => void;
  tapHole: (holeId: string) => void;
  tapGear: (key: string) => void;
  removeLast: () => void;
  reset: () => void;
  hint: () => void;
  nextLevel: () => void;
}

type DraaiwerkSet = (
  partial: Partial<DraaiwerkStore> | ((state: DraaiwerkStore) => Partial<DraaiwerkStore>),
) => void;
type DraaiwerkGet = () => DraaiwerkStore;

function emptyBoard() {
  return {
    placements: [] as Placement[],
    usedTrayIds: [] as string[],
    selectedTrayId: null as string | null,
    pendingHoleId: null as string | null,
    pendingGearKey: null as string | null,
    status: "playing" as DraaiwerkStatus,
    hintPlacement: null as Placement | null,
    feedback: null as string | null,
    feedbackTone: null as DraaiwerkFeedbackTone | null,
    mistakes: 0,
  };
}

function selectedItem(state: DraaiwerkStore): TrayItem | null {
  return selectedTrayItem(state.level, state.selectedTrayId);
}

function applyPlacements(
  set: DraaiwerkSet,
  get: DraaiwerkGet,
  nextPlacements: Placement[],
  extra: Partial<DraaiwerkStore> = {},
): void {
  const state = get();
  const result = drive(state.level, nextPlacements);
  const unlocked = result.solved
    ? Math.min(LEVEL_COUNT, Math.max(state.unlocked, state.levelIndex + 2))
    : state.unlocked;

  set({
    ...extra,
    placements: nextPlacements,
    unlocked,
    finished: state.finished || (result.solved && state.levelIndex === LEVEL_COUNT - 1),
    status: result.solved ? "solved" : "playing",
    hintPlacement: null,
    feedback: result.solved ? "Level gehaald." : result.jammed ? JAMMED : null,
    feedbackTone: result.solved ? "success" : result.jammed ? "warn" : null,
  });

  if (result.solved) {
    playSound("win");
    playHaptic("win");
  } else if (result.jammed) {
    playSound("almost");
    playHaptic("almost");
  } else {
    playSound("select");
    playHaptic("select");
  }
}

function attemptPlacement(
  set: DraaiwerkSet,
  get: DraaiwerkGet,
  placement: Placement,
  trayId: string,
): boolean {
  const state = get();
  const { level, placements } = state;

  if (!canPlace(level, placements, placement)) {
    const mistakes = state.mistakes + 1;
    set({
      mistakes,
      feedback: rejectionFor(level, placements, placement),
      feedbackTone: "warn",
      hintPlacement: mistakes >= 2 ? nextSolutionPlacement(level, placements) : state.hintPlacement,
    });
    playSound("almost");
    playHaptic("almost");
    return false;
  }

  const nextPlacements = [...placements, placement];
  applyPlacements(set, get, nextPlacements, {
    usedTrayIds: [...state.usedTrayIds, trayId],
  });

  return true;
}

function startLevelAction(set: DraaiwerkSet, get: DraaiwerkGet, index: number): void {
  const { unlocked } = get();
  const levelIndex = Math.min(Math.max(0, index), Math.max(0, unlocked - 1));
  set({
    levelIndex,
    level: levelAt(levelIndex),
    ...emptyBoard(),
  });
}

function selectableTrayItem(state: DraaiwerkStore, id: string): TrayItem | null {
  if (state.status === "solved" || state.usedTrayIds.includes(id)) {
    return null;
  }
  return state.level.tray.find((candidate) => candidate.id === id) ?? null;
}

function selectTrayAction(set: DraaiwerkSet, get: DraaiwerkGet, id: string): void {
  const state = get();
  if (!selectableTrayItem(state, id)) {
    return;
  }

  const selectedTrayId = state.selectedTrayId === id ? null : id;
  set({
    selectedTrayId,
    pendingHoleId: null,
    pendingGearKey: null,
    feedback: null,
    feedbackTone: null,
  });
  playSound("select");
  playHaptic("select");
}

function dropTrayAction(
  set: DraaiwerkSet,
  get: DraaiwerkGet,
  id: string,
  target: { kind: "hole" | "gear"; targetId: string },
): void {
  if (!selectableTrayItem(get(), id)) {
    return;
  }

  set({
    selectedTrayId: id,
    pendingHoleId: null,
    pendingGearKey: null,
    feedback: null,
    feedbackTone: null,
  });

  if (target.kind === "hole") {
    get().tapHole(target.targetId);
  } else {
    get().tapGear(target.targetId);
  }
}

function connectTrayAction(
  set: DraaiwerkSet,
  get: DraaiwerkGet,
  id: string,
  fromGearKey: string,
  toGearKey: string,
): void {
  if (!selectableTrayItem(get(), id)) {
    return;
  }
  const state = get();
  const item = state.level.tray.find((candidate) => candidate.id === id);
  if (!item || (item.kind !== "belt" && item.kind !== "chain")) {
    return;
  }
  const fromHoleId = holeForGearKey(state.level, fromGearKey);
  const toHoleId = holeForGearKey(state.level, toGearKey);
  if (!fromHoleId || !toHoleId || fromHoleId === toHoleId) {
    return;
  }

  const placed = attemptPlacement(
    set,
    get,
    {
      kind: linkPlacementKind(item),
      fromHoleId,
      toHoleId,
    },
    item.id,
  );
  if (placed) {
    set({ selectedTrayId: null, pendingHoleId: null, pendingGearKey: null });
  }
}

interface FoundPlacement {
  placement: Placement;
  end?: "a" | "b";
}

function findPlaced(placements: readonly Placement[], key: string): FoundPlacement | null {
  if (key.startsWith("gear:")) {
    const holeId = key.slice("gear:".length);
    const placement = placements.find(
      (candidate) => candidate.kind === "gear" && candidate.holeId === holeId,
    );
    return placement ? { placement } : null;
  }
  if (key.startsWith("as:")) {
    const holeId = key.slice("as:".length);
    const placement = placements.find(
      (candidate) =>
        candidate.kind === "lying-as" && (candidate.holeA === holeId || candidate.holeB === holeId),
    );
    if (!placement || placement.kind !== "lying-as") {
      return null;
    }
    return { placement, end: placement.holeA === holeId ? "a" : "b" };
  }
  if (key.startsWith("belt:")) {
    const wantedKey = key.slice("belt:".length);
    const placement = placements.find(
      (candidate) => isLinkPlacement(candidate) && connectionKey(candidate) === wantedKey,
    );
    return placement ? { placement } : null;
  }
  return null;
}

function holeAt(level: Level, col: number, row: number) {
  return level.holes.find((hole) => hole.col === col && hole.row === row) ?? null;
}

function trayIdForPlacement(state: DraaiwerkStore, placement: Placement): string | undefined {
  return state.usedTrayIds.find((id) => {
    const item = state.level.tray.find((candidate) => candidate.id === id);
    return item ? trayItemMatches(item, placement) : false;
  });
}

function commitMove(set: DraaiwerkSet, get: DraaiwerkGet, nextPlacements: Placement[]): void {
  applyPlacements(set, get, nextPlacements);
}

function movePlacedAction(
  set: DraaiwerkSet,
  get: DraaiwerkGet,
  key: string,
  targetHoleId: string,
): void {
  const state = get();
  if (state.status === "solved") {
    return;
  }
  const found = findPlaced(state.placements, key);
  const target = state.level.holes.find((hole) => hole.id === targetHoleId);
  if (!found || !target) {
    return;
  }

  const without = state.placements.filter((placement) => placement !== found.placement);
  let next: Placement;

  if (found.placement.kind === "gear") {
    if (found.placement.holeId === targetHoleId) {
      return;
    }
    next = { ...found.placement, holeId: targetHoleId };
  } else if (found.placement.kind === "lying-as" && found.end) {
    const draggedHoleId = found.end === "a" ? found.placement.holeA : found.placement.holeB;
    const anchorHoleId = found.end === "a" ? found.placement.holeB : found.placement.holeA;
    const draggedHole = state.level.holes.find((hole) => hole.id === draggedHoleId);
    const anchorHole = state.level.holes.find((hole) => hole.id === anchorHoleId);
    if (!draggedHole || !anchorHole || draggedHoleId === targetHoleId) {
      return;
    }

    const nextAnchor = holeAt(
      state.level,
      anchorHole.col + target.col - draggedHole.col,
      anchorHole.row + target.row - draggedHole.row,
    );
    if (!nextAnchor) {
      set({ feedback: "De as past daar niet.", feedbackTone: "warn" });
      playSound("almost");
      playHaptic("almost");
      return;
    }

    next =
      found.end === "a"
        ? { ...found.placement, holeA: targetHoleId, holeB: nextAnchor.id }
        : { ...found.placement, holeA: nextAnchor.id, holeB: targetHoleId };
  } else {
    return;
  }

  if (!canPlace(state.level, without, next)) {
    set({ feedback: "Daar past dit onderdeel niet.", feedbackTone: "warn" });
    playSound("almost");
    playHaptic("almost");
    return;
  }

  commitMove(
    set,
    get,
    state.placements.map((placement) => (placement === found.placement ? next : placement)),
  );
}

function removePlacedAction(set: DraaiwerkSet, get: DraaiwerkGet, key: string): void {
  const state = get();
  if (state.status === "solved") {
    return;
  }
  const found = findPlaced(state.placements, key);
  if (!found) {
    return;
  }

  const trayId = trayIdForPlacement(state, found.placement);

  set({
    placements: state.placements.filter((placement) => placement !== found.placement),
    usedTrayIds: trayId ? state.usedTrayIds.filter((id) => id !== trayId) : state.usedTrayIds,
    selectedTrayId: null,
    pendingHoleId: null,
    pendingGearKey: null,
    status: "playing",
    hintPlacement: null,
    feedback: "Onderdeel weggehaald.",
    feedbackTone: "info",
  });
  playSound("tap");
  playHaptic("tap");
}

function tapHoleAction(set: DraaiwerkSet, get: DraaiwerkGet, holeId: string): void {
  const state = get();
  if (state.status === "solved") {
    return;
  }

  const item = selectedItem(state);
  if (!item) {
    set({ feedback: "Kies eerst een onderdeel uit de la.", feedbackTone: "info" });
    playSound("tap");
    playHaptic("tap");
    return;
  }

  if (item.kind === "gear") {
    const placed = attemptPlacement(set, get, { kind: "gear", holeId, size: item.size }, item.id);
    if (placed) {
      set({ selectedTrayId: null, pendingHoleId: null, pendingGearKey: null });
    }
    return;
  }

  if (item.kind === "lying-as") {
    if (!state.pendingHoleId) {
      const blocked = state.level.blockedHoleIds.includes(holeId);
      const occupied = occupiedHoleIds(state.level, state.placements).has(holeId);
      if (blocked || occupied) {
        set({
          feedback: blocked ? "Dit gat is geblokkeerd." : "Op dit gat zit al iets.",
          feedbackTone: "warn",
        });
        playSound("almost");
        playHaptic("almost");
        return;
      }

      const sameSize = item.sizeA === item.sizeB;
      set({
        pendingHoleId: holeId,
        feedback: sameSize
          ? "Goed. Tik nu het tweede gat."
          : `Goed. Tik nu het tweede gat voor de ${sizeWord(item.sizeB)} kant.`,
        feedbackTone: "info",
      });
      playSound("select");
      playHaptic("select");
      return;
    }

    if (state.pendingHoleId === holeId) {
      set({ pendingHoleId: null, feedback: null, feedbackTone: null });
      return;
    }

    const placed = attemptPlacement(
      set,
      get,
      {
        kind: "lying-as",
        holeA: state.pendingHoleId,
        holeB: holeId,
        sizeA: item.sizeA,
        sizeB: item.sizeB,
      },
      item.id,
    );
    if (placed) {
      set({ selectedTrayId: null, pendingHoleId: null, pendingGearKey: null });
    }
    return;
  }

  const pose = drive(state.level, state.placements).gears.find((gear) => gear.holeId === holeId);
  if (!pose) {
    set({ feedback: "Op dit gat zit nog geen tandwiel.", feedbackTone: "info" });
    return;
  }
  get().tapGear(pose.key);
}

function tapGearAction(set: DraaiwerkSet, get: DraaiwerkGet, key: string): void {
  const state = get();
  if (state.status === "solved") {
    return;
  }

  const item = selectedItem(state);
  const holeId = holeForGearKey(state.level, key);

  if (!item) {
    set({ feedback: "Kies eerst een onderdeel uit de la.", feedbackTone: "info" });
    return;
  }

  if (!holeId) {
    return;
  }

  if (item.kind !== "belt" && item.kind !== "chain") {
    get().tapHole(holeId);
    return;
  }

  const gears = drive(state.level, state.placements).gears;
  if (!gears.some((gear) => gear.key === key)) {
    set({ feedback: "Dat tandwiel doet nog niet mee.", feedbackTone: "info" });
    return;
  }

  if (!state.pendingGearKey) {
    set({
      pendingGearKey: key,
      feedback: "Goed. Tik nu het tweede tandwiel.",
      feedbackTone: "info",
    });
    playSound("select");
    playHaptic("select");
    return;
  }

  if (state.pendingGearKey === key) {
    set({ pendingGearKey: null, feedback: null, feedbackTone: null });
    return;
  }

  const fromHoleId = holeForGearKey(state.level, state.pendingGearKey);
  if (!fromHoleId) {
    set({ pendingGearKey: null });
    return;
  }

  const placed = attemptPlacement(
    set,
    get,
    {
      kind: linkPlacementKind(item),
      fromHoleId,
      toHoleId: holeId,
    },
    item.id,
  );
  if (placed) {
    set({ selectedTrayId: null, pendingHoleId: null, pendingGearKey: null });
  }
}

function removeLastAction(set: DraaiwerkSet, get: DraaiwerkGet): void {
  const state = get();
  const last = state.placements[state.placements.length - 1];
  if (!last) {
    return;
  }

  const trayId = trayIdForPlacement(state, last);

  set({
    placements: state.placements.slice(0, -1),
    usedTrayIds: trayId ? state.usedTrayIds.filter((id) => id !== trayId) : state.usedTrayIds,
    selectedTrayId: null,
    pendingHoleId: null,
    pendingGearKey: null,
    status: "playing",
    hintPlacement: null,
    feedback: null,
    feedbackTone: null,
  });
  playSound("tap");
  playHaptic("tap");
}

function resetAction(set: DraaiwerkSet): void {
  set({ ...emptyBoard() });
  playSound("tap");
  playHaptic("tap");
}

function hintAction(set: DraaiwerkSet, get: DraaiwerkGet): void {
  const state = get();
  if (state.status === "solved") {
    return;
  }

  const placement = nextSolutionPlacement(state.level, state.placements);
  if (!placement) {
    set({
      hintPlacement: null,
      feedback: "Bijna. Haal een onderdeel weg en probeer opnieuw.",
      feedbackTone: "info",
    });
    return;
  }

  set({ hintPlacement: placement, feedback: null, feedbackTone: null });
  playSound("hint");
  playHaptic("hint");
}

function nextLevelAction(set: DraaiwerkSet, get: DraaiwerkGet): void {
  const { levelIndex } = get();
  if (levelIndex + 1 < LEVEL_COUNT) {
    startLevelAction(set, get, levelIndex + 1);
    return;
  }
  get().reset();
}

export const useDraaiwerkStore = create<DraaiwerkStore>()(
  persist(
    (set, get) => ({
      levelIndex: DEFAULT_DRAAIWERK_PROGRESS.current,
      unlocked: DEFAULT_DRAAIWERK_PROGRESS.unlocked,
      finished: DEFAULT_DRAAIWERK_PROGRESS.finished,
      level: levelAt(DEFAULT_DRAAIWERK_PROGRESS.current),
      ...emptyBoard(),

      startLevel: (index) => startLevelAction(set, get, index),
      selectTray: (id) => selectTrayAction(set, get, id),
      dropTray: (id, target) => dropTrayAction(set, get, id, target),
      connectTray: (id, fromGearKey, toGearKey) =>
        connectTrayAction(set, get, id, fromGearKey, toGearKey),
      movePlaced: (key, targetHoleId) => movePlacedAction(set, get, key, targetHoleId),
      removePlaced: (key) => removePlacedAction(set, get, key),
      tapHole: (holeId) => tapHoleAction(set, get, holeId),
      tapGear: (key) => tapGearAction(set, get, key),
      removeLast: () => removeLastAction(set, get),
      reset: () => resetAction(set),
      hint: () => hintAction(set, get),
      nextLevel: () => nextLevelAction(set, get),
    }),
    {
      name: DRAAIWERK_STORAGE_KEY,
      version: DRAAIWERK_STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Only progress survives a reload; the board is always fresh.
      partialize: (state) => ({
        unlocked: state.unlocked,
        current: state.levelIndex,
        finished: state.finished,
      }),
      merge: (persisted, current) => {
        const progress = normalizeDraaiwerkProgress(persisted);
        return {
          ...current,
          ...emptyBoard(),
          unlocked: progress.unlocked,
          finished: progress.finished,
          levelIndex: progress.current,
          level: levelAt(progress.current),
        };
      },
    },
  ),
);

/** The selected tray item, shared by the HUD and the play screen. */
export function useSelectedTrayItem(): TrayItem | null {
  const level = useDraaiwerkStore((state) => state.level);
  const selectedTrayId = useDraaiwerkStore((state) => state.selectedTrayId);
  return selectedTrayItem(level, selectedTrayId);
}
