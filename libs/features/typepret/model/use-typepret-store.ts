import { create } from "zustand";
import {
  applyResult,
  createRound,
  LESSON_BY_ID,
  pressKey,
  resultOf,
  startRound,
  type Progress,
  type RoundResult,
  type RoundState,
} from "@entities/typepret";
import { createSeed, mulberry32 } from "@shared/lib";
import { loadTypepretProgress, saveTypepretProgress } from "./storage";

interface TypepretStore {
  progress: Progress;
  lessonId: string | null;
  round: RoundState | null;
  /** Wordt gevuld zodra de ronde klaar is. */
  result: RoundResult | null;
  start: (lessonId: string) => void;
  press: (key: string) => void;
  /** Terug naar de leskeuze, zonder de ronde af te maken. */
  leave: () => void;
}

export const useTypepretStore = create<TypepretStore>((set, get) => ({
  progress: loadTypepretProgress(),
  lessonId: null,
  round: null,
  result: null,

  start: (lessonId) => {
    const lesson = LESSON_BY_ID[lessonId];
    if (!lesson) {
      return;
    }
    const round = createRound(lesson, mulberry32(createSeed()));
    set({ lessonId, round: startRound(round), result: null });
  },

  press: (key) => {
    const { round, progress } = get();
    if (!round || round.finished) {
      return;
    }
    const next = pressKey(round, key);
    if (next === round) {
      return;
    }
    if (!next.finished) {
      set({ round: next });
      return;
    }
    const result = resultOf(next);
    const updated = applyResult(progress, result, Date.now());
    saveTypepretProgress(updated);
    set({ round: next, result, progress: updated });
  },

  leave: () => set({ lessonId: null, round: null, result: null }),
}));
