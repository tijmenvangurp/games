import { useMemo } from "react";
import { completedValues, countMistakes, filledCount } from "@entities/sudoku";
import { playSound } from "@shared/lib";
import { Button, Eraser, Lightbulb, RotateCcw } from "@shared/ui";
import { symbolsFor } from "../model/settings";
import { useSudokuKeyboard } from "../model/use-sudoku-keyboard";
import { useSudokuStore } from "../model/use-sudoku-store";
import { NumberPad } from "./number-pad";
import { SudokuBoard } from "./sudoku-board";

export function SudokuPlay() {
  const play = useSudokuStore((state) => state.play);
  const settings = useSudokuStore((state) => state.settings);
  useSudokuKeyboard(Boolean(play));

  const mistakes = useMemo(
    () => (play ? countMistakes(play.entries, play.puzzle.solution) : []),
    [play],
  );
  const completed = useMemo(
    () => (play ? completedValues(play.puzzle, play.entries) : new Set<number>()),
    [play],
  );

  if (!play) {
    return null;
  }

  const symbols = symbolsFor(play.puzzle.size, settings.theme);
  const selectedValue =
    play.selected === null
      ? null
      : play.puzzle.givens[play.selected] || play.entries[play.selected];

  const handleSelect = (index: number) => {
    playSound("tap");
    useSudokuStore.getState().select(index);
  };

  const handlePick = (value: number) => {
    const current = useSudokuStore.getState().play;
    if (!current) {
      return;
    }
    const before = countMistakes(current.entries, current.puzzle.solution).length;
    useSudokuStore.getState().enter(value);
    const next = useSudokuStore.getState().play;
    if (next && !next.solved) {
      const after = countMistakes(next.entries, next.puzzle.solution).length;
      playSound(after > before ? "wrong" : "select");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
      <div className="mx-auto w-full max-w-lg lg:sticky lg:top-4 lg:col-span-2">
        <SudokuBoard
          entries={play.entries}
          hinted={play.hinted}
          puzzle={play.puzzle}
          selected={play.selected}
          symbols={symbols}
          onSelect={handleSelect}
        />
      </div>

      <section className="mx-auto w-full max-w-lg space-y-3">
        <NumberPad
          activeValue={selectedValue}
          completedValues={completed}
          size={play.puzzle.size}
          symbols={symbols}
          onPick={handlePick}
        />

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            onClick={() => {
              playSound("hint");
              useSudokuStore.getState().hint();
            }}
          >
            <Lightbulb aria-hidden="true" className="size-4 text-amber-500" />
            Hint
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              playSound("tap");
              useSudokuStore.getState().erase();
            }}
          >
            <Eraser aria-hidden="true" className="size-4" />
            Wissen
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              playSound("tap");
              useSudokuStore.getState().restart();
            }}
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Opnieuw
          </Button>
        </div>

        <div aria-live="polite" className="text-center text-xs text-muted-foreground">
          <p>
            {play.solved
              ? "Opgelost!"
              : mistakes.length > 0
                ? "Er staat nog een foutje in."
                : `${filledCount(play.entries)} van ${play.entries.length} vakjes ingevuld`}
          </p>
        </div>
      </section>
    </div>
  );
}
