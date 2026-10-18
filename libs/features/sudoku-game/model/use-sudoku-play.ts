import { useMemo, useState } from "react";
import {
  countMistakes,
  digitCounts,
  filledCount,
  findConflicts,
  type PlayState,
  type SudokuHint,
} from "@entities/sudoku";
import { playSound, vibrate } from "@shared/lib";
import { symbolsFor, type MistakeMode, type SymbolTheme } from "./settings";
import { hintText, statusText } from "./sudoku-view";
import { useSudokuKeyboard } from "./use-sudoku-keyboard";
import { useSudokuStore } from "./use-sudoku-store";

interface CheckResult {
  entries: readonly number[];
  mistakes: number[];
}

interface DerivedPlay {
  symbols: readonly string[];
  selectedValue: number | null;
  solutionMistakes: number[];
  conflicts: Set<number>;
  remaining: number[];
  visibleMistakes: Set<number>;
  status: string;
  hintMessage: string | null;
  almostSolved: boolean;
}

const EMPTY_SET = new Set<number>();
const EMPTY_DERIVED: DerivedPlay = {
  symbols: [],
  selectedValue: null,
  solutionMistakes: [],
  conflicts: EMPTY_SET,
  remaining: [],
  visibleMistakes: EMPTY_SET,
  status: "",
  hintMessage: null,
  almostSolved: false,
};

function remainingValues(size: number, counts: readonly number[]): number[] {
  return counts.map((count, value) => (value === 0 ? 0 : Math.max(0, size - count)));
}

function selectedValueFor(play: PlayState): number | null {
  if (play.selected === null) {
    return null;
  }
  return play.puzzle.givens[play.selected] || play.entries[play.selected];
}

function hintMessageFor(
  hintPreview: SudokuHint | null,
  hintUnavailable: boolean,
  solutionMistakes: readonly number[],
  symbols: readonly string[],
): string | null {
  if (hintPreview) {
    return hintText(hintPreview, symbols);
  }
  if (!hintUnavailable) {
    return null;
  }
  return solutionMistakes.length > 0 ? "Los eerst het foutje op." : "Er is nu geen logische hint.";
}

function derivePlay(
  play: PlayState,
  mistakeMode: MistakeMode,
  theme: SymbolTheme,
  check: CheckResult | null,
  hintPreview: SudokuHint | null,
  hintUnavailable: boolean,
): DerivedPlay {
  const symbols = symbolsFor(play.puzzle.size, theme);
  const solutionMistakes = countMistakes(play.entries, play.puzzle.solution);
  const conflicts = findConflicts(play.puzzle, play.entries);
  const counts = digitCounts(play.puzzle, play.entries);
  const isChecked = check !== null && check.entries === play.entries;
  const checkedMistakes = isChecked ? new Set(check.mistakes) : EMPTY_SET;
  const visibleMistakes = mistakeMode === "direct" ? new Set(solutionMistakes) : checkedMistakes;
  const filled = filledCount(play.entries);

  return {
    symbols,
    selectedValue: selectedValueFor(play),
    solutionMistakes,
    conflicts,
    remaining: remainingValues(play.puzzle.size, counts),
    visibleMistakes,
    status: statusText({
      solved: play.solved,
      conflictCount: conflicts.size,
      mistakeCount: solutionMistakes.length,
      checkedMistakeCount: checkedMistakes.size,
      isChecked,
      mistakeMode,
      filled,
      total: play.entries.length,
    }),
    hintMessage: hintMessageFor(hintPreview, hintUnavailable, solutionMistakes, symbols),
    almostSolved: play.entries.length - filled === 1 && !play.solved,
  };
}

function useSudokuActions(
  play: PlayState | null,
  hintPreview: SudokuHint | null,
  setCheck: (check: CheckResult) => void,
) {
  const feedbackAfterMove = () => {
    const next = useSudokuStore.getState().play;
    if (!next) {
      return;
    }
    const empty = next.entries.length - filledCount(next.entries);
    if (next.solved) {
      playSound("win");
      vibrate([20, 40, 20]);
    } else if (empty === 1) {
      playSound("almost");
      vibrate(20);
    }
  };

  const handleSelect = (index: number) => {
    playSound("tap");
    vibrate(10);
    useSudokuStore.getState().select(index);
  };

  const handlePick = (value: number) => {
    const store = useSudokuStore.getState();
    const current = store.play;
    if (!current) {
      return;
    }
    const before = countMistakes(current.entries, current.puzzle.solution).length;
    store.enter(value);
    const next = store.play;
    if (!next || next === current) {
      return;
    }
    const after = countMistakes(next.entries, next.puzzle.solution).length;
    if (after > before) {
      playSound("wrong");
      vibrate([30, 40, 30]);
    } else if (next.solved || next.entries.length - filledCount(next.entries) === 1) {
      feedbackAfterMove();
    } else {
      playSound("select");
      vibrate(10);
    }
  };

  const handleErase = () => {
    playSound("tap");
    vibrate(10);
    useSudokuStore.getState().erase();
  };

  const handleHint = () => {
    const store = useSudokuStore.getState();
    if (store.hintPreview) {
      store.applyHint();
      playSound("hint");
      vibrate(20);
      feedbackAfterMove();
    } else {
      playSound("tap");
      vibrate(10);
      store.previewHint();
    }
  };

  const handleUndo = () => {
    playSound("tap");
    vibrate(10);
    useSudokuStore.getState().undo();
  };

  const handleRestart = () => {
    playSound("tap");
    useSudokuStore.getState().restart();
  };

  const handleCheck = () => {
    if (!play) {
      return;
    }
    const mistakes = countMistakes(play.entries, play.puzzle.solution);
    setCheck({ entries: play.entries, mistakes });
    playSound(mistakes.length > 0 ? "wrong" : "match");
    vibrate(mistakes.length > 0 ? [30, 40, 30] : 10);
  };

  return {
    handleSelect,
    handlePick,
    handleErase,
    handleHint,
    handleUndo,
    handleRestart,
    handleCheck,
    hintActive: hintPreview !== null,
  };
}

export function useSudokuPlay() {
  const play = useSudokuStore((state) => state.play);
  const settings = useSudokuStore((state) => state.settings);
  const history = useSudokuStore((state) => state.history);
  const hintPreview = useSudokuStore((state) => state.hintPreview);
  const hintUnavailable = useSudokuStore((state) => state.hintUnavailable);
  const [check, setCheck] = useState<CheckResult | null>(null);
  useSudokuKeyboard(Boolean(play));

  const derived = useMemo(
    () =>
      play
        ? derivePlay(
            play,
            settings.mistakeMode,
            settings.theme,
            check,
            hintPreview,
            hintUnavailable,
          )
        : EMPTY_DERIVED,
    [play, settings.mistakeMode, settings.theme, check, hintPreview, hintUnavailable],
  );
  const actions = useSudokuActions(play, hintPreview, setCheck);

  return {
    play,
    settings,
    history,
    hintPreview,
    ...derived,
    ...actions,
    canUndo: history.length > 0,
    checkMode: settings.mistakeMode === "check",
  };
}
