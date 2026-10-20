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
    (col + 1) % boxCols === 0 && col !== size - 1 && "border-r-2 border-r-border",
    (row + 1) % boxRows === 0 && row !== size - 1 && "border-b-2 border-b-border",
  );
}

function backgroundClassName(props: SudokuCellProps): string {
  return cn(
    props.isPeerCell && "bg-primary/5",
    props.isSameValue && "bg-warning/15",
    props.isHintUnit && "bg-success/10",
    props.isConflict && "bg-warning/20 font-bold text-warning",
    props.isMistake && "bg-warning/10 font-bold text-warning",
    props.isHinted && "bg-success/10 font-bold text-success",
  );
}

function emphasisClassName(props: SudokuCellProps): string {
  return cn(
    props.isSelected && "z-10 bg-primary/15 ring-2 ring-inset ring-primary",
    props.isHintTarget && "z-10 bg-success/20 ring-2 ring-inset ring-success",
  );
}

function label(props: SudokuCellProps): string {
  const value = props.symbol ?? "leeg";
  const flags = [
    props.isGiven && "vast",
    props.isHinted && "hint",
    props.isHintTarget && "tip",
    props.isConflict && "conflict",
    props.isMistake && "nog niet goed",
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
        "relative flex aspect-square select-none items-center justify-center border-b border-r border-border leading-none transition-colors",
        SYMBOL_TEXT_SIZE[props.size],
        borderClassName(props.size, props.row, props.col),
        backgroundClassName(props),
        emphasisClassName(props),
        props.isGiven ? "font-bold text-foreground" : "font-semibold text-primary",
      )}
      onClick={props.onSelect}
    >
      {props.symbol ?? ""}
    </button>
  );
}
