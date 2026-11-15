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
import {
  connectionKey,
  holeForGearKey,
  holesForPlacement,
  isLinkPlacement,
  linkPlacementKind,
  nextSolutionPlacement,
  rejectionFor,
  selectedTrayItem,
} from "./placement";
import {
  DEFAULT_DRAAIWERK_PROGRESS,
  DRAAIWERK_STORAGE_KEY,
  DRAAIWERK_STORAGE_VERSION,
  normalizeDraaiwerkProgress,
} from "./storage";
import { autoWormPlacement } from "./worm-placement";

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
  pendingGearKey: string | null;
  status: DraaiwerkStatus;
  hintPlacement: Placement | null;
  feedback: string | null;
  feedbackTone: DraaiwerkFeedbackTone | null;
  mistakes: number;
  startLevel: (index: number) => void;
  selectTray: (id: string) => void;
  dropTray: (id: string, target: { kind: "hole" | "gear"; targetId: string }) => void;
  extendLooseBelt: (anchorHoleId: string, toGearKey: string) => void;
  selectLooseBelt: (anchorHoleId: string) => void;
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

function findLooseBelt(
  state: DraaiwerkStore,
  holeId: string,
): Extract<Placement, { kind: "loose-belt" }> | null {
  const placement = state.placements.find(
    (candidate) => candidate.kind === "loose-belt" && candidate.holeId === holeId,
  );
  return placement && placement.kind === "loose-belt" ? placement : null;
}

function extendLooseBeltAction(
  set: DraaiwerkSet,
  get: DraaiwerkGet,
  anchorHoleId: string,
  toGearKey: string,
): void {
  const state = get();
  if (state.status === "solved") {
    return;
  }
  const loose = findLooseBelt(state, anchorHoleId);
  if (!loose) {
    return;
  }
  const toHoleId = holeForGearKey(state.level, toGearKey);
  if (!toHoleId || toHoleId === anchorHoleId) {
    return;
  }

  const without = state.placements.filter((placement) => placement !== loose);
  const placement: Placement = {
    kind: loose.link,
    fromHoleId: anchorHoleId,
    toHoleId,
  };
  if (!canPlace(state.level, without, placement)) {
    set({
      feedback: rejectionFor(state.level, without, placement),
      feedbackTone: "warn",
    });
    playSound("almost");
    playHaptic("almost");
    return;
  }

  applyPlacements(set, get, [...without, placement], {
    selectedTrayId: null,
    pendingGearKey: null,
  });
}

function selectLooseBeltAction(set: DraaiwerkSet, get: DraaiwerkGet, anchorHoleId: string): void {
  const state = get();
  if (state.status === "solved") {
    return;
  }
  const loose = findLooseBelt(state, anchorHoleId);
  if (!loose) {
    return;
  }
  const pose = drive(state.level, state.placements).gears.find(
    (gear) => gear.holeId === anchorHoleId,
  );
  if (!pose) {
    return;
  }
  set({
    selectedTrayId: null,
    pendingGearKey: pose.key,
    feedback: "Tik nu een tweede tandwiel.",
    feedbackTone: "info",
  });
  playSound("select");
  playHaptic("select");
}

interface FoundPlacement {
  placement: Placement;
  end?: "shaft" | "wheel";
}

function findPlaced(placements: readonly Placement[], key: string): FoundPlacement | null {
  if (key.startsWith("gear:")) {
    const holeId = key.slice("gear:".length);
    const placement = placements.find(
      (candidate) => candidate.kind === "gear" && candidate.holeId === holeId,
    );
    return placement ? { placement } : null;
  }
  if (key.startsWith("worm:")) {
    const holeId = key.slice("worm:".length);
    const placement = placements.find(
      (candidate) =>
        candidate.kind === "worm" &&
        (candidate.shaftHoleId === holeId || candidate.wheelHoleId === holeId),
    );
    if (!placement || placement.kind !== "worm") {
      return null;
    }
    return { placement, end: placement.shaftHoleId === holeId ? "shaft" : "wheel" };
  }
  if (key.startsWith("loose:")) {
    const holeId = key.slice("loose:".length);
    const placement = placements.find(
      (candidate) => candidate.kind === "loose-belt" && candidate.holeId === holeId,
    );
    return placement ? { placement } : null;
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

function attachedPlacements(state: DraaiwerkStore, removed: Placement): Placement[] {
  if (removed.kind === "loose-belt" || isLinkPlacement(removed)) {
    return [];
  }
  const holes = holesForPlacement(removed);
  return state.placements.filter((placement) => {
    if (placement === removed) {
      return false;
    }
    if (placement.kind === "loose-belt") {
      return holes.has(placement.holeId);
    }
    return (
      isLinkPlacement(placement) &&
      (holes.has(placement.fromHoleId) || holes.has(placement.toHoleId))
    );
  });
}

function trayIdsForPlacements(state: DraaiwerkStore, placements: readonly Placement[]): string[] {
  const available = [...state.usedTrayIds];
  const ids: string[] = [];
  for (const placement of placements) {
    const found = available.find((id) => {
      const item = state.level.tray.find((candidate) => candidate.id === id);
      return item ? trayItemMatches(item, placement) : false;
    });
    if (found) {
      ids.push(found);
      available.splice(available.indexOf(found), 1);
    }
  }
  return ids;
}

function trayIdForPlacement(state: DraaiwerkStore, placement: Placement): string | undefined {
  return trayIdsForPlacements(state, [placement])[0];
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

  const detached = attachedPlacements(state, found.placement);
  const without = state.placements.filter(
    (placement) => placement !== found.placement && !detached.includes(placement),
  );
  let next: Placement;

  if (found.placement.kind === "gear") {
    if (found.placement.holeId === targetHoleId) {
      return;
    }
    next = { ...found.placement, holeId: targetHoleId };
  } else if (found.placement.kind === "worm" && found.end) {
    const draggedHoleId =
      found.end === "shaft" ? found.placement.shaftHoleId : found.placement.wheelHoleId;
    const anchorHoleId =
      found.end === "shaft" ? found.placement.wheelHoleId : found.placement.shaftHoleId;
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
      set({ feedback: "De wormas past daar niet.", feedbackTone: "warn" });
      playSound("almost");
      playHaptic("almost");
      return;
    }

    next =
      found.end === "shaft"
        ? { ...found.placement, shaftHoleId: targetHoleId, wheelHoleId: nextAnchor.id }
        : { ...found.placement, shaftHoleId: nextAnchor.id, wheelHoleId: targetHoleId };
  } else {
    return;
  }

  if (!canPlace(state.level, without, next)) {
    set({ feedback: "Daar past dit onderdeel niet.", feedbackTone: "warn" });
    playSound("almost");
    playHaptic("almost");
    return;
  }

  const detachedTrayIds = trayIdsForPlacements(state, detached);
  applyPlacements(set, get, [...without, next], {
    usedTrayIds: state.usedTrayIds.filter((id) => !detachedTrayIds.includes(id)),
  });
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

  const detached = attachedPlacements(state, found.placement);
  const removed = [found.placement, ...detached];
  const removedTrayIds = trayIdsForPlacements(state, removed);

  set({
    placements: state.placements.filter((placement) => !removed.includes(placement)),
    usedTrayIds: state.usedTrayIds.filter((id) => !removedTrayIds.includes(id)),
    selectedTrayId: null,
    pendingGearKey: null,
    status: "playing",
    hintPlacement: null,
    feedback: detached.length > 0 ? "Onderdeel en verbinding weggehaald." : "Onderdeel weggehaald.",
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
    const pose = drive(state.level, state.placements).gears.find((gear) => gear.holeId === holeId);
    if (state.pendingGearKey && pose) {
      get().tapGear(pose.key);
      return;
    }
    set({ feedback: "Kies eerst een onderdeel uit de la.", feedbackTone: "info" });
    playSound("tap");
    playHaptic("tap");
    return;
  }

  if (item.kind === "gear") {
    const placed = attemptPlacement(set, get, { kind: "gear", holeId, size: item.size }, item.id);
    if (placed) {
      set({ selectedTrayId: null, pendingGearKey: null });
    }
    return;
  }

  if (item.kind === "worm") {
    const placement = autoWormPlacement(state.level, state.placements, holeId, item);
    if (!placement) {
      set({ feedback: "De wormas past daar niet.", feedbackTone: "warn" });
      playSound("almost");
      playHaptic("almost");
      return;
    }
    const placed = attemptPlacement(set, get, placement, item.id);
    if (placed) {
      set({ selectedTrayId: null, pendingGearKey: null });
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
  if (!holeId) {
    return;
  }

  if (!item) {
    if (state.pendingGearKey) {
      const anchorHoleId = holeForGearKey(state.level, state.pendingGearKey);
      if (anchorHoleId && anchorHoleId !== holeId) {
        get().extendLooseBelt(anchorHoleId, key);
        return;
      }
      if (anchorHoleId === holeId) {
        set({ pendingGearKey: null, feedback: null, feedbackTone: null });
        return;
      }
    }
    set({ feedback: "Kies eerst een onderdeel uit de la.", feedbackTone: "info" });
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

  const placement: Placement = {
    kind: "loose-belt",
    holeId,
    link: linkPlacementKind(item),
  };
  const placed = attemptPlacement(set, get, placement, item.id);
  if (placed) {
    set({
      selectedTrayId: null,
      pendingGearKey: key,
      feedback: "Trek de riem nu naar een ander tandwiel.",
      feedbackTone: "info",
    });
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
      extendLooseBelt: (anchorHoleId, toGearKey) =>
        extendLooseBeltAction(set, get, anchorHoleId, toGearKey),
      selectLooseBelt: (anchorHoleId) => selectLooseBeltAction(set, get, anchorHoleId),
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
