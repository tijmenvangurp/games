import { useSudokuPlay } from "../model/use-sudoku-play";
import { NumberPad } from "./number-pad";
import { SudokuBoard } from "./sudoku-board";
import { SudokuControls } from "./sudoku-controls";
import { SudokuStatus } from "./sudoku-status";

export function SudokuPlay() {
  const model = useSudokuPlay();

  if (!model.play) {
    return null;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
      <div className="mx-auto w-full max-w-lg lg:sticky lg:top-4 lg:col-span-2">
        <SudokuBoard
          conflicts={model.conflicts}
          entries={model.play.entries}
          hint={model.hintPreview}
          hinted={model.play.hinted}
          mistakes={model.visibleMistakes}
          puzzle={model.play.puzzle}
          selected={model.play.selected}
          symbols={model.symbols}
          onSelect={model.handleSelect}
        />
      </div>

      <section className="mx-auto w-full max-w-lg space-y-3">
        <NumberPad
          activeValue={model.selectedValue}
          remaining={model.remaining}
          size={model.play.puzzle.size}
          symbols={model.symbols}
          onPick={model.handlePick}
        />

        <SudokuControls
          canUndo={model.canUndo}
          checkMode={model.checkMode}
          hintActive={model.hintActive}
          solved={model.play.solved}
          onCheck={model.handleCheck}
          onErase={model.handleErase}
          onHint={model.handleHint}
          onRestart={model.handleRestart}
          onUndo={model.handleUndo}
        />

        <SudokuStatus
          almostSolved={model.almostSolved}
          celebration={model.celebration}
          hintMessage={model.hintMessage}
          status={model.status}
        />
      </section>
    </div>
  );
}
