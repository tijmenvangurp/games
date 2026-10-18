import { create } from "zustand";
import {
  emptyFrenchProgress,
  recordFrenchAnswer,
  type FrenchProgressState,
} from "@entities/french";
import { loadFrenchProgress, saveFrenchProgress } from "./progress-storage";

interface FrenchProgressStore {
  progress: FrenchProgressState;
  record: (itemId: string, correct: boolean) => void;
  reset: () => void;
}

export const useFrenchProgressStore = create<FrenchProgressStore>((set) => ({
  progress: loadFrenchProgress(),

  record: (itemId, correct) =>
    set((state) => {
      const progress = recordFrenchAnswer(state.progress, itemId, correct);
      saveFrenchProgress(progress);
      return { progress };
    }),

  reset: () => {
    const progress = emptyFrenchProgress();
    saveFrenchProgress(progress);
    set({ progress });
  },
}));
