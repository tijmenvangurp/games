import {
  LINE_LENGTH,
  type Board,
  type BoardShape,
  type Cell,
  type Player,
  type Position,
  type WinLine,
} from "./types";

/** Een leeg bord: `columns` kolommen met elk `rows` lege vakjes. */
export function createBoard(shape: BoardShape): Board {
  return Array.from({ length: shape.columns }, () =>
    Array.from<Cell>({ length: shape.rows }).fill(null),
  );
}

/** De rij waar een schijf landt, of -1 als de kolom vol is. */
export function landingRow(board: Board, column: number): number {
  const cells = board[column];
  if (!cells) {
    return -1;
  }
  return cells.findIndex((cell) => cell === null);
}

export function isPlayable(board: Board, column: number): boolean {
  return landingRow(board, column) >= 0;
}

/** Zet een vakje op een waarde. De aanroeper weet welke rij vrij is. */
export function setCell(board: Board, column: number, row: number, cell: Cell): Board {
  return board.map((cells, index) => {
    if (index !== column) {
      return cells;
    }

    const filled: Cell[] = [...cells];
    filled[row] = cell;
    return filled;
  });
}

/** Laat een schijf vallen. `null` als de kolom vol is of niet bestaat. */
export function dropDisc(board: Board, column: number, player: Player): Board | null {
  const row = landingRow(board, column);
  return row < 0 ? null : setCell(board, column, row, player);
}

export function isBoardFull(board: Board): boolean {
  return board.every((cells) => cells.every((cell) => cell !== null));
}

export function otherPlayer(player: Player): Player {
  return player === "one" ? "two" : "one";
}

const DIRECTIONS = [
  { column: 1, row: 0 },
  { column: 0, row: 1 },
  { column: 1, row: 1 },
  { column: 1, row: -1 },
] as const;

/** De cellen van een rij van vier vanaf `start`, of null als die er niet is. */
function lineFrom(
  board: Board,
  start: Position,
  player: Player,
  direction: Position,
): Position[] | null {
  const cells: Position[] = [];
  for (let step = 0; step < LINE_LENGTH; step += 1) {
    const column = start.column + direction.column * step;
    const row = start.row + direction.row * step;
    if (board[column]?.[row] !== player) {
      return null;
    }
    cells.push({ column, row });
  }
  return cells;
}

/**
 * Zoekt de winnende rij van vier: horizontaal, verticaal en beide diagonalen.
 * De eerste die gevonden wordt is genoeg, want een partij stopt bij de eerste
 * rij van vier.
 */
export function findWinLine(board: Board): WinLine | null {
  const rows = board[0]?.length ?? 0;

  for (let column = 0; column < board.length; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      const player = board[column]?.[row];
      if (!player) {
        continue;
      }

      for (const direction of DIRECTIONS) {
        const cells = lineFrom(board, { column, row }, player, direction);
        if (cells) {
          return { player, cells };
        }
      }
    }
  }

  return null;
}
