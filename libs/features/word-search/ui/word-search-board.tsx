import type { Cell, WordSearchPlacement, WordSearchPuzzle } from "@entities/word-search";
import { cn } from "@shared/lib";
import { useWordSearchDrag } from "./use-word-search-drag";
import { WordSearchStrokes } from "./word-search-strokes";

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

interface WordSearchGridProps {
  puzzle: WordSearchPuzzle;
  selectedKeys: ReadonlySet<string>;
  foundKeys: ReadonlySet<string>;
  hintKeys: ReadonlySet<string>;
  foundPlacements: readonly WordSearchPlacement[];
  wrong: boolean;
  zoomed: boolean;
  onCellClick: (cell: Cell) => void;
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

function foundCellKeys(puzzle: WordSearchPuzzle, found: readonly string[]): Set<string> {
  return new Set(
    found
      .flatMap(
        (word) => puzzle.placements.find((placement) => placement.word === word)?.cells ?? [],
      )
      .map(cellKey),
  );
}

function foundPlacementsFor(
  puzzle: WordSearchPuzzle,
  found: readonly string[],
): WordSearchPlacement[] {
  return found
    .map((word) => puzzle.placements.find((placement) => placement.word === word))
    .filter((placement): placement is WordSearchPlacement => placement !== undefined);
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
        "relative z-0 grid aspect-square min-h-0 min-w-0 place-items-center rounded-sm border border-border font-bold leading-none text-foreground transition-colors",
        letterSize(size),
        !found && "bg-card hover:bg-muted/60",
        found && "bg-success/10 text-success ring-1 ring-inset ring-success/20",
        hint && "bg-warning/15 text-warning ring-2 ring-inset ring-warning/50",
        selected && !wrong && "bg-primary/10 text-primary ring-2 ring-inset ring-primary",
        selected && wrong && "bg-warning/10 text-warning ring-2 ring-inset ring-warning/50",
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

function WordSearchGrid({
  puzzle,
  selectedKeys,
  foundKeys,
  hintKeys,
  foundPlacements,
  wrong,
  zoomed,
  onCellClick,
}: WordSearchGridProps) {
  return (
    <div
      className="relative grid w-full"
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
              onSelect={onCellClick}
            />
          );
        }),
      )}
      <WordSearchStrokes placements={foundPlacements} size={puzzle.size} />
    </div>
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
  const foundKeys = foundCellKeys(puzzle, found);
  const foundPlacements = foundPlacementsFor(puzzle, found);
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
        "select-none rounded-lg border border-border bg-card p-1",
        zoomed ? "overflow-x-auto" : "overflow-hidden",
        !zoomed && "cursor-crosshair",
      )}
      role="group"
      onPointerCancel={drag.onPointerCancel}
      onPointerDown={drag.onPointerDown}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
    >
      <WordSearchGrid
        foundKeys={foundKeys}
        foundPlacements={foundPlacements}
        hintKeys={hintKeys}
        puzzle={puzzle}
        selectedKeys={selectedKeys}
        wrong={wrong}
        zoomed={zoomed}
        onCellClick={handleCellClick}
      />
    </div>
  );
}
