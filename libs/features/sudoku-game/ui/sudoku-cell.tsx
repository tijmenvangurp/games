import { geometryFor, type SudokuSize } from "@entities/sudoku";
import { cn } from "@shared/lib";

const SYMBOL_TEXT_SIZE: Record<SudokuSize, string> = {
  4: "text-4xl",
  6: "text-2xl sm:text-3xl",
  9: "text-lg sm:text-2xl",
};

interface SudokuCellProps {
  size: SudokuSize;
  row: number;
  col: number;
  symbol?: string;
  isGiven: boolean;
  isHinted: boolean;
  isMistake: boolean;
  isConflict: boolean;
  isSelected: boolean;
  isSameValue: boolean;
  isPeerCell: boolean;
  isHintUnit: boolean;
  isHintTarget: boolean;
  onSelect: () => void;
}

function borderClassName(size: SudokuSize, row: number, col: number): string {
  const { boxRows, boxCols } = geometryFor(size);

  return cn(
    col === size - 1 && "border-r-0",
    row === size - 1 && "border-b-0",
    (col + 1) % boxCols === 0 && col !== size - 1 && "border-r-2 border-r-slate-400",
    (row + 1) % boxRows === 0 && row !== size - 1 && "border-b-2 border-b-slate-400",
  );
}

function backgroundClassName(props: SudokuCellProps): string {
  return cn(
    props.isPeerCell && "bg-sky-50",
    props.isSameValue && "bg-amber-100",
    props.isHintUnit && "bg-emerald-50",
    props.isConflict && "bg-orange-100 font-bold text-orange-700",
    props.isMistake && "bg-rose-50 font-bold text-rose-600",
    props.isHinted && "bg-emerald-50 font-bold text-emerald-600",
  );
}

function emphasisClassName(props: SudokuCellProps): string {
  return cn(
    props.isSelected && "z-10 bg-sky-100 ring-2 ring-inset ring-sky-500",
    props.isHintTarget && "z-10 bg-emerald-100 ring-2 ring-inset ring-emerald-500",
  );
}

function label(props: SudokuCellProps): string {
  const value = props.symbol ?? "leeg";
  const flags = [
    props.isGiven && "vast",
    props.isHinted && "hint",
    props.isHintTarget && "tip",
    props.isConflict && "conflict",
    props.isMistake && "fout",
  ].filter(Boolean);
  const row = props.row + 1;
  const col = props.col + 1;
  return `${value}, rij ${row}, kolom ${col}${flags.length > 0 ? `, ${flags.join(", ")}` : ""}`;
}

export function SudokuCell(props: SudokuCellProps) {
  return (
    <button
      type="button"
      aria-label={label(props)}
      aria-pressed={props.isSelected}
      className={cn(
        "relative flex aspect-square select-none items-center justify-center border-b border-r border-slate-300/80 leading-none transition-colors",
        SYMBOL_TEXT_SIZE[props.size],
        borderClassName(props.size, props.row, props.col),
        backgroundClassName(props),
        emphasisClassName(props),
        props.isGiven ? "font-bold text-slate-800" : "font-semibold text-sky-600",
      )}
      onClick={props.onSelect}
    >
      {props.symbol ?? ""}
    </button>
  );
}
