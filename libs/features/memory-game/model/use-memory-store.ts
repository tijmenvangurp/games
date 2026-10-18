import { create } from "zustand";
import { createMemoryScene, type MemoryDifficulty, type MemoryScene } from "@entities/memory";
import { parseSyncableProgress } from "@entities/progress";
import {
  readActiveProfileId,
  registerProgressAdapter,
  withSuppressedProgressEvents,
} from "@shared/lib";
import { isMemoryDifficulty, loadMemorySettings, saveMemorySettings } from "./storage";
import { flipCard } from "./flip-card";
import type { MemorySettings } from "./settings";

interface MemoryStore {
  scene: MemoryScene | null;
  matched: boolean[];
  flipped: number[];
  locked: boolean;
  moves: number;
  found: boolean;
  settings: MemorySettings;
  start: (scene: MemoryScene) => void;
  newGame: () => void;
  flip: (index: number) => void;
  resolveMismatch: () => void;
  chooseDifficulty: (difficulty: MemoryDifficulty) => void;
}

export const useMemoryStore = create<MemoryStore>((set, get) => ({
  scene: null,
  matched: [],
  flipped: [],
  locked: false,
  moves: 0,
  found: false,
  settings: loadMemorySettings(),

  start: (scene) =>
    set({
      scene,
      matched: Array.from({ length: scene.cards.length }, () => false),
      flipped: [],
      locked: false,
      moves: 0,
      found: false,
    }),

  newGame: () => {
    const { difficulty } = get().settings;
    const scene = createMemoryScene(difficulty);
    get().start(scene);
  },

  flip: (index) =>
    set((state) => {
      if (!state.scene) {
        return {};
      }
      const outcome = flipCard(
        {
          cards: state.scene.cards,
          matched: state.matched,
          flipped: state.flipped,
          moves: state.moves,
          locked: state.locked,
          found: state.found,
        },
        index,
      );
      return outcome ?? {};
    }),

  resolveMismatch: () => set((state) => (state.locked ? { flipped: [], locked: false } : {})),

  chooseDifficulty: (difficulty) => {
    const settings = { difficulty };
    set({ settings });
    saveMemorySettings(settings);
  },
}));

registerProgressAdapter("memory", {
  read: (profileId) => {
    const settings = loadMemorySettings(profileId);
    return { settings: { difficulty: settings.difficulty } };
  },
  apply: (profileId, value) => {
    const parsed = parseSyncableProgress(value);
    const difficulty = parsed?.settings?.difficulty;
    if (!isMemoryDifficulty(difficulty)) {
      return;
    }
    withSuppressedProgressEvents(() => {
      if (profileId === readActiveProfileId()) {
        useMemoryStore.setState({ settings: { difficulty } });
      }
      saveMemorySettings({ difficulty }, profileId);
    });
  },
});
