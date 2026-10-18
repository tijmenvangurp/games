import type { Cell, WordSearchPuzzle } from "@entities/word-search";
import { cn } from "@shared/lib";
import { useWordSearchDrag } from "./use-word-search-drag";

interface WordSearchCellProps {
  cell: Cell;
  letter: string;
  size: number;
  selected: boolean;
  found: boolean;
  hint: boolean;
  wrong: boolean;
  onSelect: (cell: Cell) => void;
}

interface WordSearchBoardProps {
  puzzle: WordSearchPuzzle;
  selected: readonly Cell[];
  found: readonly string[];
  hintCells: readonly Cell[];
  wrong: boolean;
  zoomed: boolean;
  onCellClick: (cell: Cell) => void;
}

function cellKey(cell: Cell): string {
  return `${cell.row}:${cell.col}`;
}

function letterSize(size: number): string {
  return size >= 12 ? "text-xs sm:text-sm" : "text-sm sm:text-base";
}

function cellLabel(
  letter: string,
  cell: Cell,
  found: boolean,
  hint: boolean,
  selected: boolean,
): string {
  const flags = [
    found ? "gevonden" : null,
    hint ? "hint" : null,
    selected ? "gekozen" : null,
  ].filter(Boolean);
  return `${letter}, rij ${cell.row + 1}, kolom ${cell.col + 1}${
    flags.length > 0 ? `, ${flags.join(", ")}` : ""
  }`;
}

function WordSearchCell({
  cell,
  letter,
  size,
  selected,
  found,
  hint,
  wrong,
  onSelect,
}: WordSearchCellProps) {
  return (
    <button
      aria-label={cellLabel(letter, cell, found, hint, selected)}
      aria-pressed={selected}
      className={cn(
        "relative grid aspect-square min-h-0 min-w-0 place-items-center rounded-sm border border-slate-200/80 bg-white font-bold leading-none text-slate-700 transition-colors hover:bg-slate-50",
        letterSize(size),
        found && "bg-emerald-100 text-emerald-700",
        hint && "bg-amber-100 text-amber-700 ring-2 ring-inset ring-amber-400",
        selected && !wrong && "bg-sky-100 text-sky-700 ring-2 ring-inset ring-sky-500",
        selected && wrong && "bg-rose-100 text-rose-700 ring-2 ring-inset ring-rose-400",
      )}
      data-col={cell.col}
      data-row={cell.row}
      type="button"
      onClick={() => onSelect(cell)}
    >
      {letter}
    </button>
  );
}

export function WordSearchBoard({
  puzzle,
  selected,
  found,
  hintCells,
  wrong,
  zoomed,
  onCellClick,
}: WordSearchBoardProps) {
  const selectedKeys = new Set(selected.map(cellKey));
  const hintKeys = new Set(hintCells.map(cellKey));
  const foundKeys = new Set(
    found
      .flatMap(
        (word) => puzzle.placements.find((placement) => placement.word === word)?.cells ?? [],
      )
      .map(cellKey),
  );
  const drag = useWordSearchDrag(!zoomed);

  const handleCellClick = (cell: Cell) => {
    if (!drag.consumeClick()) {
      onCellClick(cell);
    }
  };

  return (
    <div
      aria-label={`Woordzoeker van ${puzzle.size} bij ${puzzle.size}`}
      className={cn(
        "select-none rounded-2xl border-2 border-slate-300 bg-white p-1 shadow-sm",
        zoomed ? "overflow-x-auto" : "overflow-hidden",
        !zoomed && "cursor-crosshair",
      )}
      role="group"
      onPointerCancel={drag.onPointerCancel}
      onPointerDown={drag.onPointerDown}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
    >
      <div
        className="grid w-full"
        style={{
          gap: "2px",
          gridTemplateColumns: `repeat(${puzzle.size}, ${
            zoomed ? "minmax(44px, 1fr)" : "minmax(0, 1fr)"
          })`,
          touchAction: zoomed ? "pan-x pan-y" : "none",
        }}
      >
        {puzzle.grid.map((row, rowIndex) =>
          row.map((letter, colIndex) => {
            const cell = { row: rowIndex, col: colIndex };
            const key = cellKey(cell);

            return (
              <WordSearchCell
                key={key}
                cell={cell}
                found={foundKeys.has(key)}
                hint={hintKeys.has(key)}
                letter={letter}
                selected={selectedKeys.has(key)}
                size={puzzle.size}
                wrong={wrong}
                onSelect={handleCellClick}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}
