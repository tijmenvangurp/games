import { geometryFor, isPeer, type SudokuHint, type SudokuPuzzle } from "@entities/sudoku";
import { SudokuCell } from "./sudoku-cell";

interface SudokuBoardProps {
  puzzle: SudokuPuzzle;
  entries: readonly number[];
  hinted: readonly boolean[];
  selected: number | null;
  symbols: readonly string[];
  mistakes: ReadonlySet<number>;
  conflicts: ReadonlySet<number>;
  hint?: SudokuHint | null;
  onSelect: (index: number) => void;
}

export function SudokuBoard({
  puzzle,
  entries,
  hinted,
  selected,
  symbols,
  mistakes,
  conflicts,
  hint = null,
  onSelect,
}: SudokuBoardProps) {
  const geometry = geometryFor(puzzle.size);
  const { size } = geometry;
  const selectedValue = selected === null ? 0 : puzzle.givens[selected] || entries[selected];
  const hintUnit = new Set(hint?.related ?? []);
  const cells = Array.from({ length: size * size }, (_, index) => {
    const row = Math.floor(index / size);
    const col = index % size;
    const given = puzzle.givens[index];
    const value = given !== 0 ? given : entries[index];

    return (
      <SudokuCell
        key={index}
        col={col}
        isConflict={conflicts.has(index)}
        isGiven={given !== 0}
        isHintTarget={hint?.index === index}
        isHintUnit={hintUnit.has(index)}
        isHinted={hinted[index]}
        isMistake={mistakes.has(index)}
        isPeerCell={selected !== null && isPeer(index, selected, geometry)}
        isSameValue={selected !== null && value !== 0 && value === selectedValue}
        isSelected={selected === index}
        row={row}
        size={size}
        symbol={value === 0 ? undefined : symbols[value - 1]}
        onSelect={() => onSelect(index)}
      />
    );
  });

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
