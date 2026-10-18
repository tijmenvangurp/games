import {
  entryCells,
  type CrosswordCell,
  type CrosswordEntry,
  type CrosswordPuzzle,
} from "@entities/crossword";
import { cn } from "@shared/lib";

interface CrosswordCellProps {
  cell: CrosswordCell;
  letter: string;
  selected: boolean;
  inEntry: boolean;
  wrong: boolean;
  hinted: boolean;
  onSelect: () => void;
}

interface CrosswordGridProps {
  puzzle: CrosswordPuzzle;
  letters: Record<string, string>;
  selected: { row: number; col: number } | null;
  entry: CrosswordEntry | undefined;
  wrong: ReadonlySet<string>;
  hinted: ReadonlySet<string>;
  onSelect: (row: number, col: number) => void;
}

function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

function cellLabel(cell: CrosswordCell, letter: string): string {
  const number = cell.number ? `, nummer ${cell.number}` : "";
  return `Rij ${cell.row + 1}, kolom ${cell.col + 1}${number}, ${
    letter ? `letter ${letter}` : "leeg"
  }`;
}

function CrosswordCellView({
  cell,
  letter,
  selected,
  inEntry,
  wrong,
  hinted,
  onSelect,
}: CrosswordCellProps) {
  if (cell.solution === null) {
    return <div aria-hidden="true" className="aspect-square rounded-sm bg-slate-800" />;
  }

  return (
    <button
      aria-label={cellLabel(cell, letter)}
      aria-pressed={selected}
      className={cn(
        "relative grid aspect-square place-items-center rounded-sm border border-slate-300 bg-white text-lg font-black leading-none text-slate-800 transition-colors",
        inEntry && "bg-sky-50",
        selected && "z-10 bg-sky-100 ring-2 ring-inset ring-sky-500",
        hinted && "text-amber-700",
        wrong && "bg-rose-100 text-rose-700 ring-2 ring-inset ring-rose-400",
      )}
      type="button"
      onClick={onSelect}
    >
      {cell.number ? (
        <span className="absolute left-0.5 top-0 text-xs font-bold leading-none text-slate-500">
          {cell.number}
        </span>
      ) : null}
      {letter}
    </button>
  );
}

export function CrosswordGrid({
  puzzle,
  letters,
  selected,
  entry,
  wrong,
  hinted,
  onSelect,
}: CrosswordGridProps) {
  const entryKeys = new Set(
    entry ? entryCells(entry).map((cell) => cellKey(cell.row, cell.col)) : [],
  );

  return (
    <div
      aria-label="Kruiswoordpuzzel"
      className="mx-auto grid w-full max-w-md gap-0.5 rounded-2xl border-2 border-slate-300 bg-slate-100 p-1 shadow-sm"
      role="group"
      style={{ gridTemplateColumns: `repeat(${puzzle.width}, minmax(0, 1fr))` }}
    >
      {puzzle.cells.flat().map((cell) => {
        const key = cellKey(cell.row, cell.col);
        return (
          <CrosswordCellView
            key={key}
            cell={cell}
            hinted={hinted.has(key)}
            inEntry={entryKeys.has(key)}
            letter={letters[key] ?? ""}
            selected={selected?.row === cell.row && selected.col === cell.col}
            wrong={wrong.has(key)}
            onSelect={() => onSelect(cell.row, cell.col)}
          />
        );
      })}
    </div>
  );
}
