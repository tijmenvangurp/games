import {
  createBoard,
  dropDisc,
  findWinLine,
  isBoardFull,
  landingRow,
  otherPlayer,
  setCell,
} from "./rules";
import {
  PLAYERS,
  type Board,
  type BoardShape,
  type Drop,
  type Player,
  type WinLine,
} from "./types";

export interface FourInARowGame {
  readonly shape: BoardShape;
  readonly board: Board;
  /** Wie er nu mag. */
  readonly current: Player;
  /** Wie er begon; de partij wisselt van starter na een verliespartij. */
  readonly first: Player;
  /** Alle zetten tot nu toe. Ongedaan maken haalt de laatste eraf. */
  readonly drops: readonly Drop[];
  readonly line: WinLine | null;
  readonly draw: boolean;
  readonly last: Drop | null;
}

export function createGame(shape: BoardShape, first: Player = PLAYERS[0]): FourInARowGame {
  return {
    shape,
    board: createBoard(shape),
    current: first,
    first,
    drops: [],
    line: null,
    draw: false,
    last: null,
  };
}

/** Laat de speler die aan de beurt is een schijf vallen. `null` = ongeldige zet. */
export function applyDrop(game: FourInARowGame, column: number): FourInARowGame | null {
  if (isFinished(game)) {
    return null;
  }

  const board = dropDisc(game.board, column, game.current);
  if (!board) {
    return null;
  }

  const drop: Drop = { player: game.current, column, row: landingRow(game.board, column) };
  const line = findWinLine(board);

  return {
    shape: game.shape,
    board,
    current: otherPlayer(game.current),
    first: game.first,
    drops: [...game.drops, drop],
    line,
    draw: !line && isBoardFull(board),
    last: drop,
  };
}

/** Haalt de laatste zet weg. Zonder zetten blijft het spel zoals het is. */
export function undoDrop(game: FourInARowGame): FourInARowGame {
  const last = game.drops[game.drops.length - 1];
  if (!last) {
    return game;
  }

  const drops = game.drops.slice(0, -1);
  const board = setCell(game.board, last.column, last.row, null);
  const line = findWinLine(board);

  return {
    shape: game.shape,
    board,
    current: otherPlayer(game.current),
    first: game.first,
    drops,
    line,
    draw: !line && isBoardFull(board),
    last: drops[drops.length - 1] ?? null,
  };
}

export function isFinished(game: FourInARowGame): boolean {
  return game.line !== null || game.draw;
}

export function winnerOf(game: FourInARowGame): Player | null {
  return game.line?.player ?? null;
}

/**
 * Wie de volgende partij begint. De verliezer mag beginnen, want dat is
 * eerlijker voor twee kinderen; bij gelijkspel wisselt het startrecht.
 */
export function startingPlayerAfter(game: FourInARowGame | null): Player {
  if (!game) {
    return PLAYERS[0];
  }

  const winner = winnerOf(game);
  return winner ? otherPlayer(winner) : game.current;
}
