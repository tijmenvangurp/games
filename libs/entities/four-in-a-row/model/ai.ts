import { applyDrop, isFinished, type FourInARowGame } from "./game";
import { isPlayable, landingRow, otherPlayer } from "./rules";
import { LINE_LENGTH, type Board, type ComputerLevel, type Player } from "./types";

/**
 * De computer speelt met minimax en alpha-bèta. Geen engine of wasm: het bord
 * is klein, de regels zijn al puur en de drie niveaus blijven zo instelbaar
 * voor kinderen. Zie ADR 0025.
 */

/** Een gewonnen partij weegt zwaarder dan elke heuristiek. */
const WIN_SCORE = 100_000;
/** Hoe eerder de winst, hoe beter; dit telt bij de winst op. */
const DEPTH_BONUS = 1;
/** Waarde van 1, 2 of 3 eigen schijven in een venster van vier. */
const WINDOW_WEIGHTS = [0, 1, 12, 120];
/** Een dreiging van de tegenstander weegt iets zwaarder: blokkeren loont. */
const OPPONENT_FACTOR = 1.15;
/** Schijven in de middelste kolom zijn meer waard. */
const CENTER_BONUS = 3;
/** Op makkelijk kiest de computer soms expres een minder goede zet. */
const RANDOM_CHANCE = 0.35;

const DEPTHS: Record<ComputerLevel, number> = {
  makkelijk: 1,
  middel: 3,
  moeilijk: 5,
};

function legalColumns(game: FourInARowGame): number[] {
  const columns: number[] = [];
  for (let column = 0; column < game.shape.columns; column += 1) {
    if (isPlayable(game.board, column)) {
      columns.push(column);
    }
  }
  return columns;
}

/** De kolommen van het midden naar buiten; dat geeft de beste zet eerst. */
function orderedColumns(game: FourInARowGame): number[] {
  const middle = (game.shape.columns - 1) / 2;
  return legalColumns(game).sort(
    (left, right) => Math.abs(left - middle) - Math.abs(right - middle) || left - right,
  );
}

const DIRECTIONS = [
  { column: 1, row: 0 },
  { column: 0, row: 1 },
  { column: 1, row: 1 },
  { column: 1, row: -1 },
] as const;

/**
 * Hoeveel schijven van `player` er in deze richting op een rij staan vanaf de
 * gevallen schijf, aan beide kanten.
 */
function lineLength(
  board: Board,
  column: number,
  row: number,
  direction: { column: number; row: number },
  player: Player,
): number {
  let discs = 1;

  for (const side of [-1, 1]) {
    for (let step = 1; step < LINE_LENGTH; step += 1) {
      const cell =
        board[column + direction.column * step * side]?.[row + direction.row * step * side];
      if (cell !== player) {
        break;
      }
      discs += 1;
    }
  }

  return discs;
}

/** Zou een schijf in deze kolom vier op een rij maken? */
function isWinningSquare(board: Board, column: number, player: Player): boolean {
  const row = landingRow(board, column);
  if (row < 0) {
    return false;
  }

  return DIRECTIONS.some(
    (direction) => lineLength(board, column, row, direction, player) >= LINE_LENGTH,
  );
}

/**
 * Het aantal kolommen waar `player` nu vier op een rij mee maakt. Twee of meer
 * winstvelden betekent dat de tegenstander er maar één kan blokkeren: dan is
 * de partij beslist.
 */
function winningSquares(board: Board, player: Player): number {
  let squares = 0;
  for (let column = 0; column < board.length; column += 1) {
    if (isWinningSquare(board, column, player)) {
      squares += 1;
    }
  }
  return squares;
}

/**
 * De score op het blad van de zoektocht. `me` is daar aan zet. Een directe
 * winst telt meteen, en twee winstvelden van de tegenstander zijn niet meer te
 * blokkeren. Zonder deze blik op de horizon mist een ondiepe zoektocht een
 * open drie.
 */
function horizon(game: FourInARowGame, me: Player): number {
  if (winningSquares(game.board, me) > 0) {
    return WIN_SCORE;
  }
  if (winningSquares(game.board, otherPlayer(me)) >= 2) {
    return -WIN_SCORE;
  }
  return evaluate(game.board, me);
}

/** De waarde van het bord voor `me`, zonder verder te kijken. */
function evaluate(board: Board, me: Player): number {
  const opponent = otherPlayer(me);
  const rows = board[0]?.length ?? 0;
  let score = 0;

  for (let column = 0; column < board.length; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      score += scoreWindow(board, { column, row }, 1, 0, me, opponent);
      score += scoreWindow(board, { column, row }, 0, 1, me, opponent);
      score += scoreWindow(board, { column, row }, 1, 1, me, opponent);
      score += scoreWindow(board, { column, row }, 1, -1, me, opponent);
    }
  }

  const middle = Math.floor((board.length - 1) / 2);
  const own = board[middle]?.filter((cell) => cell === me).length ?? 0;
  return score + own * CENTER_BONUS;
}

/** Eén venster van vier vanaf `start`; leeg als het buiten het bord valt. */
function scoreWindow(
  board: Board,
  start: { column: number; row: number },
  stepColumn: number,
  stepRow: number,
  me: Player,
  opponent: Player,
): number {
  let mine = 0;
  let theirs = 0;

  for (let step = 0; step < LINE_LENGTH; step += 1) {
    const cell = board[start.column + stepColumn * step]?.[start.row + stepRow * step];
    if (cell === undefined) {
      return 0;
    }
    if (cell === me) {
      mine += 1;
    } else if (cell === opponent) {
      theirs += 1;
    }
  }

  if (mine > 0 && theirs > 0) {
    return 0;
  }

  return (WINDOW_WEIGHTS[mine] ?? 0) - (WINDOW_WEIGHTS[theirs] ?? 0) * OPPONENT_FACTOR;
}

/**
 * Negamax met alpha-bèta vanuit het perspectief van `me`. Een winst die
 * dieper in de boom ligt is minder waard, zodat de computer niet treuzelt.
 */
function negamax(
  game: FourInARowGame,
  depth: number,
  me: Player,
  alpha: number,
  beta: number,
): number {
  if (game.line) {
    const value = WIN_SCORE + depth * DEPTH_BONUS;
    return game.line.player === me ? value : -value;
  }
  if (game.draw) {
    return 0;
  }
  if (depth === 0) {
    return horizon(game, me);
  }

  let best = -Infinity;
  let bound = alpha;

  for (const column of orderedColumns(game)) {
    const next = applyDrop(game, column);
    if (!next) {
      continue;
    }

    const score = -negamax(next, depth - 1, otherPlayer(me), -beta, -bound);
    if (score > best) {
      best = score;
    }
    if (best > bound) {
      bound = best;
    }
    if (bound >= beta) {
      break;
    }
  }

  return best;
}

/**
 * De kolom die de computer kiest, of `null` als hij niet kan spelen.
 * `random` is injecteerbaar zodat de tests deterministisch blijven.
 */
export function chooseComputerColumn(
  game: FourInARowGame,
  level: ComputerLevel,
  random: () => number = Math.random,
): number | null {
  if (isFinished(game)) {
    return null;
  }

  const columns = orderedColumns(game);
  if (columns.length === 0) {
    return null;
  }

  if (level === "makkelijk" && random() < RANDOM_CHANCE) {
    const index = Math.min(Math.floor(random() * columns.length), columns.length - 1);
    return columns[index] ?? columns[0];
  }

  let bestColumn = columns[0];
  let bestScore = -Infinity;
  let alpha = -Infinity;

  for (const column of columns) {
    const next = applyDrop(game, column);
    if (!next) {
      continue;
    }

    const score = -negamax(next, DEPTHS[level] - 1, otherPlayer(game.current), -Infinity, -alpha);
    if (score > bestScore) {
      bestScore = score;
      bestColumn = column;
    }
    if (score > alpha) {
      alpha = score;
    }
  }

  return bestColumn;
}
