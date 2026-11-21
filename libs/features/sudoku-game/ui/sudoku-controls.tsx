import { useTexts } from "@shared/i18n";
import { Button, Check, Eraser, Lightbulb, RotateCcw, Search, Undo2 } from "@shared/ui";
import { sudokuTexts } from "../model/texts";

interface SudokuControlsProps {
  hintActive: boolean;
  hintDetailed: boolean;
  canUndo: boolean;
  checkMode: boolean;
  solved: boolean;
  onHint: () => void;
  onHintDetail: () => void;
  onUndo: () => void;
  onErase: () => void;
  onRestart: () => void;
  onCheck: () => void;
}

export function SudokuControls({
  hintActive,
  hintDetailed,
  canUndo,
  checkMode,
  solved,
  onHint,
  onHintDetail,
  onUndo,
  onErase,
  onRestart,
  onCheck,
}: SudokuControlsProps) {
  const t = useTexts(sudokuTexts).controls;
  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
        <Button variant="outline" onClick={onHint}>
          <Lightbulb aria-hidden="true" className="size-4 text-warning" />
          {hintActive ? t.place : t.hint}
        </Button>
        <Button variant="outline" disabled={!canUndo} onClick={onUndo}>
          <Undo2 aria-hidden="true" className="size-4" />
          {t.undo}
        </Button>
        <Button variant="outline" onClick={onErase}>
          <Eraser aria-hidden="true" className="size-4" />
          {t.erase}
        </Button>
        <Button variant="outline" onClick={onRestart}>
          <RotateCcw aria-hidden="true" className="size-4" />
          {t.restart}
        </Button>
      </div>

      {hintActive && !hintDetailed ? (
        <Button className="w-full" size="sm" variant="ghost" onClick={onHintDetail}>
          <Search aria-hidden="true" className="size-4" />
          {t.why}
        </Button>
      ) : null}

      {checkMode ? (
        <Button className="w-full" disabled={solved} variant="outline" onClick={onCheck}>
          <Check aria-hidden="true" className="size-4" />
          {t.check}
        </Button>
      ) : null}
    </>
  );
}
