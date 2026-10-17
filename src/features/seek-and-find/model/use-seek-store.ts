import { create } from "zustand";
import {
  createSeekScene,
  type SeekDifficulty,
  type SeekScene,
  type SeekTheme,
} from "@entities/hidden-object";
import { loadSeekSettings, saveSeekSettings } from "./storage";
import type { SeekSettings } from "./settings";

interface SeekStore {
  scene: SeekScene | null;
  found: boolean;
  tries: number;
  wrongId: number | null;
  hintVisible: boolean;
  settings: SeekSettings;
  start: (scene: SeekScene) => void;
  newScene: () => void;
  tap: (id: number) => void;
  clearWrong: () => void;
  showHint: () => void;
  hideHint: () => void;
  chooseDifficulty: (difficulty: SeekDifficulty) => void;
  chooseTheme: (theme: SeekTheme) => void;
}

export const useSeekStore = create<SeekStore>((set, get) => ({
  scene: null,
  found: false,
  tries: 0,
  wrongId: null,
  hintVisible: false,
  settings: loadSeekSettings(),

  start: (scene) => set({ scene, found: false, tries: 0, wrongId: null, hintVisible: false }),

  newScene: () =>
    set((state) => ({
      scene: createSeekScene(state.settings.difficulty, state.settings.theme),
      found: false,
      tries: 0,
      wrongId: null,
      hintVisible: false,
    })),

  tap: (id) => {
    const { scene, found } = get();
    if (!scene || found) {
      return;
    }
    if (id === scene.targetId) {
      set({ found: true, wrongId: null, hintVisible: false });
      return;
    }
    set((state) => ({ tries: state.tries + 1, wrongId: id }));
  },

  clearWrong: () => set({ wrongId: null }),
  showHint: () => set({ hintVisible: true }),
  hideHint: () => set({ hintVisible: false }),

  chooseDifficulty: (difficulty) => {
    const settings = { ...get().settings, difficulty };
    set({ settings });
    saveSeekSettings(settings);
  },

  chooseTheme: (theme) => {
    const settings = { ...get().settings, theme };
    set({ settings });
    saveSeekSettings(settings);
  },
}));
