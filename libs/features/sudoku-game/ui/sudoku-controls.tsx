import { Button, Check, Eraser, Lightbulb, RotateCcw, Undo2 } from "@shared/ui";

interface SudokuControlsProps {
  hintActive: boolean;
  canUndo: boolean;
  checkMode: boolean;
  solved: boolean;
  onHint: () => void;
  onUndo: () => void;
  onErase: () => void;
  onRestart: () => void;
  onCheck: () => void;
}

export function SudokuControls({
  hintActive,
  canUndo,
  checkMode,
  solved,
  onHint,
  onUndo,
  onErase,
  onRestart,
  onCheck,
}: SudokuControlsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button variant="outline" onClick={onHint}>
          <Lightbulb aria-hidden="true" className="size-4 text-amber-500" />
          {hintActive ? "Plaats" : "Hint"}
        </Button>
        <Button variant="outline" disabled={!canUndo} onClick={onUndo}>
          <Undo2 aria-hidden="true" className="size-4" />
          Ongedaan
        </Button>
        <Button variant="outline" onClick={onErase}>
          <Eraser aria-hidden="true" className="size-4" />
          Wissen
        </Button>
        <Button variant="outline" onClick={onRestart}>
          <RotateCcw aria-hidden="true" className="size-4" />
          Opnieuw
        </Button>
      </div>

      {checkMode ? (
        <Button className="w-full" disabled={solved} variant="outline" onClick={onCheck}>
          <Check aria-hidden="true" className="size-4" />
          Controleer
        </Button>
      ) : null}
    </>
  );
}
