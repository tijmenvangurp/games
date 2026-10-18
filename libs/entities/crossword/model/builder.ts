import type { CrosswordCell, CrosswordEntry, CrosswordInput, CrosswordPuzzle } from "./types";

function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

/**
 * Turns a handcrafted grid and word list into a numbered crossword. The grid
 * uses uppercase letters for cells and "." for blocks. Every answer must match
 * the letters already in the grid, so a typo in the puzzle data fails loudly.
 */
export function buildCrossword(input: CrosswordInput): CrosswordPuzzle {
  const height = input.grid.length;
  const width = input.grid[0]?.length ?? 0;
  if (height === 0 || width === 0) {
    throw new Error("Een kruiswoordpuzzel heeft een grid nodig");
  }
  if (input.grid.some((row) => row.length !== width)) {
    throw new Error("Alle rijen moeten even lang zijn");
  }

  const cells: CrosswordCell[][] = input.grid.map((row, rowIndex) =>
    Array.from(row, (symbol, colIndex) => {
      if (!/^[A-Z.]$/.test(symbol)) {
        throw new Error(`Ongeldig gridteken "${symbol}" op ${rowIndex}:${colIndex}`);
      }
      return {
        row: rowIndex,
        col: colIndex,
        solution: symbol === "." ? null : symbol,
        number: null,
      };
    }),
  );

  const starts = new Map<string, number>();
  for (const entry of [...input.entries].sort(
    (first, second) => first.row - second.row || first.col - second.col,
  )) {
    const key = cellKey(entry.row, entry.col);
    if (!starts.has(key)) {
      starts.set(key, starts.size + 1);
    }
  }

  const entries: CrosswordEntry[] = input.entries.map((entry) => {
    const answer = entry.answer.toUpperCase();
    if (!/^[A-Z]+$/.test(answer)) {
      throw new Error(`Ongeldig antwoord "${entry.answer}"`);
    }

    for (let index = 0; index < answer.length; index += 1) {
      const row = entry.row + (entry.direction === "down" ? index : 0);
      const col = entry.col + (entry.direction === "across" ? index : 0);
      const cell = cells[row]?.[col];
      if (!cell || cell.solution !== answer[index]) {
        throw new Error(`Antwoord "${answer}" past niet op ${row}:${col}`);
      }
    }

    return {
      ...entry,
      answer,
      number: starts.get(cellKey(entry.row, entry.col)) ?? 0,
    };
  });

  for (const [key, number] of starts) {
    const [row, col] = key.split(":").map(Number);
    const cell = cells[row]?.[col];
    if (cell) {
      cell.number = number;
    }
  }

  return {
    id: input.id,
    title: input.title,
    category: input.category,
    width,
    height,
    cells,
    entries,
  };
}
