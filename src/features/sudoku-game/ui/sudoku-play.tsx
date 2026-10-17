import { useMemo } from "react";
import { countMistakes, filledCount } from "@entities/sudoku";
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

  if (!play) {
    return null;
  }

  const symbols = symbolsFor(play.puzzle.size, settings.theme);
  const selectedValue =
    play.selected === null
      ? null
      : play.puzzle.givens[play.selected] || play.entries[play.selected];

  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
      <div className="mx-auto w-full max-w-lg lg:sticky lg:top-4 lg:col-span-2">
        <SudokuBoard
          entries={play.entries}
          hinted={play.hinted}
          puzzle={play.puzzle}
          selected={play.selected}
          symbols={symbols}
          onSelect={(index) => useSudokuStore.getState().select(index)}
        />
      </div>

      <section className="mx-auto w-full max-w-lg space-y-3">
        <NumberPad
          activeValue={selectedValue}
          size={play.puzzle.size}
          symbols={symbols}
          onPick={(value) => useSudokuStore.getState().enter(value)}
        />

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" onClick={() => useSudokuStore.getState().hint()}>
            <Lightbulb aria-hidden="true" className="size-4 text-amber-500" />
            Hint
          </Button>
          <Button variant="outline" onClick={() => useSudokuStore.getState().erase()}>
            <Eraser aria-hidden="true" className="size-4" />
            Wissen
          </Button>
          <Button variant="outline" onClick={() => useSudokuStore.getState().restart()}>
            <RotateCcw aria-hidden="true" className="size-4" />
            Opnieuw
          </Button>
        </div>

        <p aria-live="polite" className="text-center text-xs text-muted-foreground">
          {play.solved
            ? "Opgelost!"
            : mistakes.length > 0
              ? "Er staat nog een foutje in."
              : `${filledCount(play.entries)} van ${play.entries.length} vakjes ingevuld`}
        </p>
      </section>
    </div>
  );
}
