import { useMemo } from "react";
import {
  countMistakes,
  geometryFor,
  isPeer,
  type SudokuPuzzle,
  type SudokuSize,
} from "@entities/sudoku";
import { cn } from "@shared/lib";

const SYMBOL_TEXT_SIZE: Record<SudokuSize, string> = {
  4: "text-4xl",
  6: "text-2xl sm:text-3xl",
  9: "text-lg sm:text-2xl",
};

interface CellStyle {
  size: SudokuSize;
  row: number;
  col: number;
  isGiven: boolean;
  isHinted: boolean;
  isMistake: boolean;
  isSelected: boolean;
  isSameValue: boolean;
  isPeerCell: boolean;
}

function borderClassName(cell: CellStyle): string {
  const { size, row, col } = cell;
  const { boxRows, boxCols } = geometryFor(size);

  return cn(
    col === size - 1 && "border-r-0",
    row === size - 1 && "border-b-0",
    (col + 1) % boxCols === 0 && col !== size - 1 && "border-r-2 border-r-slate-400",
    (row + 1) % boxRows === 0 && row !== size - 1 && "border-b-2 border-b-slate-400",
  );
}

function stateClassName(cell: CellStyle): string {
  const { isGiven, isHinted, isMistake, isSelected, isSameValue, isPeerCell } = cell;

  return cn(
    isPeerCell && "bg-slate-50",
    isSameValue && "bg-amber-100",
    isHinted && "bg-emerald-50 font-bold text-emerald-600",
    isMistake && "bg-rose-50 font-bold text-rose-600",
    isSelected && "z-10 bg-sky-100 ring-2 ring-inset ring-sky-500",
    isGiven ? "font-bold text-slate-800" : "font-semibold text-sky-600",
  );
}

function cellClassName(cell: CellStyle): string {
  return cn(
    "relative flex aspect-square select-none items-center justify-center border-b border-r border-slate-300/80 leading-none transition-colors",
    SYMBOL_TEXT_SIZE[cell.size],
    borderClassName(cell),
    stateClassName(cell),
  );
}

function cellLabel(
  symbol: string | undefined,
  row: number,
  col: number,
  isGiven: boolean,
  isHinted: boolean,
  isMistake: boolean,
): string {
  const value = symbol ?? "leeg";
  const flags = [isGiven && "vast", isHinted && "hint", isMistake && "fout"].filter(Boolean);
  return `${value}, rij ${row + 1}, kolom ${col + 1}${flags.length > 0 ? `, ${flags.join(", ")}` : ""}`;
}

interface SudokuBoardProps {
  puzzle: SudokuPuzzle;
  entries: readonly number[];
  hinted: readonly boolean[];
  selected: number | null;
  symbols: readonly string[];
  onSelect: (index: number) => void;
}

export function SudokuBoard({
  puzzle,
  entries,
  hinted,
  selected,
  symbols,
  onSelect,
}: SudokuBoardProps) {
  const geometry = geometryFor(puzzle.size);
  const { size } = geometry;
  const mistakes = useMemo(
    () => new Set(countMistakes(entries, puzzle.solution)),
    [entries, puzzle.solution],
  );
  const selectedValue = selected === null ? 0 : puzzle.givens[selected] || entries[selected];

  const cells = [];
  for (let index = 0; index < size * size; index += 1) {
    const row = Math.floor(index / size);
    const col = index % size;
    const given = puzzle.givens[index];
    const value = given !== 0 ? given : entries[index];
    const isGiven = given !== 0;
    const isHinted = hinted[index];
    const isMistake = mistakes.has(index);
    const isSelected = selected === index;
    const isSameValue = selected !== null && value !== 0 && value === selectedValue;
    const symbol = value === 0 ? undefined : symbols[value - 1];

    cells.push(
      <button
        key={index}
        type="button"
        aria-label={cellLabel(symbol, row, col, isGiven, isHinted, isMistake)}
        aria-pressed={isSelected}
        className={cellClassName({
          size,
          row,
          col,
          isGiven,
          isHinted,
          isMistake,
          isSelected,
          isSameValue,
          isPeerCell: selected !== null && isPeer(index, selected, geometry),
        })}
        onClick={() => onSelect(index)}
      >
        {symbol ?? ""}
      </button>,
    );
  }

  return (
    <div
      aria-label={`Sudoku rooster van ${size} bij ${size}`}
      className="touch-manipulation overflow-hidden rounded-2xl border-2 border-slate-300 bg-white shadow-sm"
      role="group"
    >
      <div className="grid" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
        {cells}
      </div>
    </div>
  );
}
