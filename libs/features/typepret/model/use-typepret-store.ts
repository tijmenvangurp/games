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
import { currentLanguage, type Language } from "@shared/i18n";
import { createSeed, mulberry32 } from "@shared/lib";
import { loadTypepretProgress, saveTypepretProgress } from "./storage";

interface TypepretStore {
  progress: Progress;
  /** De taal van de lopende ronde; `null` zonder ronde. */
  language: Language | null;
  lessonId: string | null;
  round: RoundState | null;
  /** Wordt gevuld zodra de ronde klaar is. */
  result: RoundResult | null;
  start: (lessonId: string) => void;
  press: (key: string) => void;
  /** Terug naar de leskeuze, zonder de ronde af te maken. */
  leave: () => void;
  /** Stopt een ronde die in een andere taal is gestart. */
  resetForLanguage: (language: Language) => void;
}

export const useTypepretStore = create<TypepretStore>((set, get) => ({
  progress: loadTypepretProgress(),
  language: null,
  lessonId: null,
  round: null,
  result: null,

  start: (lessonId) => {
    const lesson = LESSON_BY_ID[lessonId];
    if (!lesson) {
      return;
    }
    const round = createRound(lesson, mulberry32(createSeed()));
    set({ language: currentLanguage(), lessonId, round: startRound(round), result: null });
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
  resetForLanguage: (language) => {
    if (get().language === language) {
      return;
    }
    set({ language, lessonId: null, round: null, result: null });
  },
}));
