import { MOLENSPEL_ADJACENCY, MOLENSPEL_MILLS, MOLENSPEL_POINTS } from "./board";
import {
  MOLENSPEL_ENDGAME_TURNS,
  MOLENSPEL_PIECES_PER_PLAYER,
  type MolenspelBoard,
  type MolenspelGame,
  type MolenspelPhase,
  type MolenspelPlayer,
} from "./types";

const OTHER_PLAYER: Readonly<Record<MolenspelPlayer, MolenspelPlayer>> = {
  wit: "zwart",
  zwart: "wit",
};

/** Het aantal stenen van een speler op het bord. */
export function piecesOnBoard(board: MolenspelBoard, player: MolenspelPlayer): number {
  return board.reduce((total, piece) => (piece === player ? total + 1 : total), 0);
}

/** Het aantal stenen dat een speler nog heeft: op het bord plus in de hand. */
function stonesLeft(
  board: MolenspelBoard,
  inHand: Readonly<Record<MolenspelPlayer, number>>,
  player: MolenspelPlayer,
): number {
  return piecesOnBoard(board, player) + inHand[player];
}

function withPiece(
  board: MolenspelBoard,
  point: number,
  player: MolenspelPlayer | null,
): MolenspelBoard {
  const next = board.slice();
  next[point] = player;
  return next;
}

/** Alle molentjes van een speler op het bord. */
export function millsOf(board: MolenspelBoard, player: MolenspelPlayer): number[][] {
  return MOLENSPEL_MILLS.filter((mill) => mill.every((point) => board[point] === player)).map(
    (mill) => mill.slice(),
  );
}

/** Ligt `point` in een molentje van `player`? */
export function isInMill(board: MolenspelBoard, player: MolenspelPlayer, point: number): boolean {
  return MOLENSPEL_MILLS.some(
    (mill) => mill.includes(point) && mill.every((cell) => board[cell] === player),
  );
}

/** Alle stenen van de tegenstander op het bord. */
function opponentStones(board: MolenspelBoard, player: MolenspelPlayer): number[] {
  const opponent = OTHER_PLAYER[player];
  return board
    .map((piece, point) => (piece === opponent ? point : -1))
    .filter((point) => point >= 0);
}

/**
 * De stenen die de tegenstander mag verwijderen. Losse stenen gaan voor;
 * als alle stenen in een molentje liggen mag elke steen weg.
 */
export function removablePieces(board: MolenspelBoard, player: MolenspelPlayer): number[] {
  const opponent = OTHER_PLAYER[player];
  const stones = opponentStones(board, player);
  const loose = stones.filter((point) => !isInMill(board, opponent, point));
  return loose.length > 0 ? loose : stones;
}

/** De fase waarin de speler aan de beurt is. */
export function phaseFor(game: MolenspelGame, player: MolenspelPlayer): MolenspelPhase {
  if (game.inHand[player] > 0) {
    return "plaatsen";
  }
  if (piecesOnBoard(game.board, player) === 3) {
    return "vliegen";
  }
  return "schuiven";
}

/** Alle vrije punten op het bord. */
function emptyPoints(board: MolenspelBoard): number[] {
  return board.map((piece, point) => (piece === null ? point : -1)).filter((point) => point >= 0);
}

/** De buren van een punt waar een steen naartoe kan. */
function movesFor(board: MolenspelBoard, piece: number): number[] {
  return (MOLENSPEL_ADJACENCY[piece] as readonly number[]).filter((point) => board[point] === null);
}

/**
 * Alle toegestane zetten van een speler, vanuit-punt naar mogelijke doelpunten.
 * Met drie stenen mag een speler "vliegen" en naar elk vrij punt springen.
 */
export function legalMoves(game: MolenspelGame, player: MolenspelPlayer): Map<number, number[]> {
  const moves = new Map<number, number[]>();
  if (game.inHand[player] > 0) {
    return moves;
  }
  const flying = piecesOnBoard(game.board, player) === 3;
  const free = flying ? emptyPoints(game.board) : [];
  for (let point = 0; point < game.board.length; point += 1) {
    if (game.board[point] !== player) {
      continue;
    }
    const targets = flying ? free : movesFor(game.board, point);
    if (targets.length > 0) {
      moves.set(point, targets);
    }
  }
  return moves;
}

/** Kan de speler nog een zet doen? */
export function hasLegalMove(game: MolenspelGame, player: MolenspelPlayer): boolean {
  if (game.inHand[player] > 0) {
    return true;
  }
  return legalMoves(game, player).size > 0;
}

/** Start een nieuw spel. */
export function createMolenspelGame(firstPlayer: MolenspelPlayer = "wit"): MolenspelGame {
  return {
    board: MOLENSPEL_POINTS.map(() => null),
    inHand: { wit: MOLENSPEL_PIECES_PER_PLAYER, zwart: MOLENSPEL_PIECES_PER_PLAYER },
    turn: firstPlayer,
    phase: "plaatsen",
    selected: null,
    awaitRemoval: false,
    winner: null,
    draw: false,
    endgame: false,
    endgameTurns: 0,
    moves: 0,
  };
}

/** Is de speler geblokkeerd? Dan kan hij niet meer schuiven. */
function isBlocked(board: MolenspelBoard, inHand: number, player: MolenspelPlayer): boolean {
  if (inHand > 0) {
    return false;
  }
  if (piecesOnBoard(board, player) === 3) {
    return emptyPoints(board).length === 0;
  }
  for (let point = 0; point < board.length; point += 1) {
    if (board[point] === player && movesFor(board, point).length > 0) {
      return false;
    }
  }
  return true;
}

/** Heeft de tegenstander verloren? */
function hasLost(
  board: MolenspelBoard,
  inHand: Readonly<Record<MolenspelPlayer, number>>,
  player: MolenspelPlayer,
): boolean {
  return stonesLeft(board, inHand, player) < 3 || isBlocked(board, inHand[player], player);
}

/** Zijn beide spelers op drie stenen uitgekomen? */
function bothOnThree(
  board: MolenspelBoard,
  inHand: Readonly<Record<MolenspelPlayer, number>>,
): boolean {
  return (
    inHand.wit === 0 &&
    inHand.zwart === 0 &&
    stonesLeft(board, inHand, "wit") === 3 &&
    stonesLeft(board, inHand, "zwart") === 3
  );
}

/**
 * Werkt de eindstand bij: de winnaar, of gelijkspel als beide spelers te lang
 * met drie stenen blijven spelen.
 */
function resolveOutcome(
  game: MolenspelGame,
  mover: MolenspelPlayer,
  board: MolenspelBoard,
  inHand: Readonly<Record<MolenspelPlayer, number>>,
  moves: number,
  endgame: boolean,
  endgameTurns: number,
): MolenspelGame {
  const base = { ...game, board, inHand, moves, awaitRemoval: false, selected: null };

  if (hasLost(board, inHand, OTHER_PLAYER[mover])) {
    return { ...base, winner: mover };
  }

  if (!bothOnThree(board, inHand)) {
    return { ...base, endgame, endgameTurns };
  }

  const nextEndgameTurns = endgame ? endgameTurns + 1 : 0;
  const draw = nextEndgameTurns >= MOLENSPEL_ENDGAME_TURNS;
  return { ...base, endgame: true, endgameTurns: nextEndgameTurns, draw };
}

function nextTurn(
  game: MolenspelGame,
  mover: MolenspelPlayer,
  board: MolenspelBoard,
  inHand: Record<MolenspelPlayer, number>,
): MolenspelGame {
  const moves = game.moves + 1;
  const resolved = resolveOutcome(
    game,
    mover,
    board,
    inHand,
    moves,
    game.endgame,
    game.endgameTurns,
  );
  if (resolved.winner || resolved.draw) {
    return resolved;
  }
  const opponent = OTHER_PLAYER[mover];
  const next: MolenspelGame = { ...resolved, turn: opponent };
  return { ...next, phase: phaseFor(next, opponent) };
}

/** Legt een steen op een leeg punt. */
export function placePiece(game: MolenspelGame, point: number): MolenspelGame {
  if (game.winner || game.draw || game.awaitRemoval) {
    return game;
  }
  const player = game.turn;
  if (game.inHand[player] <= 0 || game.board[point] !== null) {
    return game;
  }
  const board = withPiece(game.board, point, player);
  const inHand = { ...game.inHand, [player]: game.inHand[player] - 1 };
  if (isInMill(board, player, point)) {
    return { ...game, board, inHand, awaitRemoval: true, selected: null };
  }
  return nextTurn(game, player, board, inHand);
}

/** Schuift of laat een steen vliegen naar een ander punt. */
export function movePiece(game: MolenspelGame, from: number, to: number): MolenspelGame {
  if (game.winner || game.draw || game.awaitRemoval) {
    return game;
  }
  const player = game.turn;
  if (game.board[from] !== player || game.board[to] !== null) {
    return game;
  }
  const targets = legalMoves(game, player).get(from);
  if (!targets || !targets.includes(to)) {
    return game;
  }
  const board = withPiece(withPiece(game.board, to, player), from, null);
  if (isInMill(board, player, to)) {
    return { ...game, board, selected: null, awaitRemoval: true };
  }
  return nextTurn(game, player, board, { ...game.inHand });
}

/** Verwijdert een tegenstandersteen na een molentje. */
export function removePiece(game: MolenspelGame, point: number): MolenspelGame {
  if (game.winner || game.draw || !game.awaitRemoval) {
    return game;
  }
  const player = game.turn;
  if (!removablePieces(game.board, player).includes(point)) {
    return game;
  }
  const board = withPiece(game.board, point, null);
  return nextTurn(game, player, board, { ...game.inHand });
}

/** Selecteert of deselecteert een eigen steen. */
export function selectPiece(game: MolenspelGame, point: number): MolenspelGame {
  if (game.winner || game.draw || game.awaitRemoval || game.inHand[game.turn] > 0) {
    return game;
  }
  if (game.board[point] !== game.turn) {
    return game;
  }
  const selected = game.selected === point ? null : point;
  return { ...game, selected };
}

/** Kiest een doelpunt voor de geselecteerde steen. */
export function chooseTarget(game: MolenspelGame, point: number): MolenspelGame {
  if (game.selected === null) {
    return game;
  }
  return movePiece(game, game.selected, point);
}

/** Start een nieuw spel met de andere speler aan de beurt. */
export function rematchMolenspel(game: MolenspelGame): MolenspelGame {
  return createMolenspelGame(game.turn === "wit" ? "zwart" : "wit");
}
