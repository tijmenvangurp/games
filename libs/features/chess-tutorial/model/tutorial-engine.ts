import { Chess, type Move, type PieceSymbol, type Square } from "chess.js";
import { isChessSquare, movesForPiece } from "@shared/lib";
import type {
  TutorialGoal,
  TutorialHint,
  TutorialLevel,
  TutorialMove,
  TutorialMoveResult,
  TutorialPreview,
} from "./types";

/**
 * De tutorial-FEN's hebben geen koningen. chess.js keurt zo'n stelling bij
 * `load` af, maar kan er met `skipValidation` prima legale zetten op
 * genereren. De zetvalidatie zelf blijft volledig intact.
 */
function createTutorialChess(fen: string): Chess {
  return new Chess(fen, { skipValidation: true });
}

/**
 * De tutorial is een drill: na elke zet is wit weer aan zet. De stukopstelling
 * en castlingrechten blijven behouden; en passant is hier niet nodig.
 */
export function rearmWhite(fen: string): string {
  const [placement, , castling = "-"] = fen.split(" ");

  if (!placement) {
    throw new Error(`Ongeldige FEN: ${fen}`);
  }

  return `${placement} w ${castling} - 0 1`;
}

interface CandidateMove {
  readonly from: Square;
  readonly to: Square;
  readonly move: Move;
}

/**
 * Kiest één zet die het kind visueel kan volgen. Bij een doelveld zoekt de
 * hint een zet die meteen op het doel staat, of anders een tussenstap die in
 * één vervolgzet bij het doel kan komen. Bij schaak, schaakmat en rokade
 * wint de zet die de opdracht daadwerkelijk haalt.
 */
export function hintFor(level: TutorialLevel, fen: string): TutorialHint | null {
  const candidates = candidateMoves(level, fen);
  if (candidates.length === 0) {
    return null;
  }

  const goal = level.goal;
  if (goal) {
    const goalMove = candidates.find((candidate) => reachesGoal(goal, candidate, fen));
    const chosen = goalMove ?? candidates[0];

    return chosen ? { from: chosen.from, to: chosen.to } : null;
  }

  if (level.targetSquare) {
    const target = level.targetSquare;
    const [chosen] = [...candidates].sort((a, b) =>
      compareTowardTarget(level.playerPiece, target, a, b),
    );

    return chosen ? { from: chosen.from, to: chosen.to } : null;
  }

  const [chosen] = candidates;
  return chosen ? { from: chosen.from, to: chosen.to } : null;
}

/**
 * Toont vóór de opdracht waar het lesstuk naartoe kan. De preview gebruikt
 * dezelfde legale zetten als het bord, dus geen verzonnen voorbeeldpijlen.
 */
export function previewFor(level: TutorialLevel, fen: string): TutorialPreview | null {
  const candidates = candidateMoves(level, fen);
  const [first] = candidates;

  if (!first) {
    return null;
  }

  return {
    square: first.from,
    targets: candidates.filter((candidate) => candidate.from === first.from).map(({ to }) => to),
  };
}

function candidateMoves(level: TutorialLevel, fen: string): readonly CandidateMove[] {
  const chess = createTutorialChess(fen);
  const candidates: CandidateMove[] = [];

  for (const row of chess.board()) {
    for (const piece of row) {
      if (!piece || piece.color !== "w" || piece.type !== level.playerPiece) {
        continue;
      }

      for (const move of chess.moves({ square: piece.square, verbose: true })) {
        candidates.push({ from: piece.square, to: move.to, move });
      }
    }
  }

  return candidates;
}

function reachesGoal(goal: TutorialGoal, candidate: CandidateMove, fen: string): boolean {
  switch (goal) {
    case "castle-kingside":
      return candidate.move.isKingsideCastle();
    case "castle-queenside":
      return candidate.move.isQueensideCastle();
    case "check":
    case "checkmate": {
      const chess = createTutorialChess(fen);
      const applied = tryMove(chess, candidate.from, candidate.to);

      if (!applied) {
        return false;
      }

      return goal === "check" ? chess.isCheck() : chess.isCheckmate();
    }
  }
}

function compareTowardTarget(
  piece: PieceSymbol,
  target: Square,
  a: CandidateMove,
  b: CandidateMove,
): number {
  const directDifference = Number(a.to !== target) - Number(b.to !== target);
  if (directDifference !== 0) {
    return directDifference;
  }

  const nextDifference =
    Number(!canReachInOne(piece, a.to, target)) - Number(!canReachInOne(piece, b.to, target));
  if (nextDifference !== 0) {
    return nextDifference;
  }

  const distanceDifference = squareDistance(a.to, target) - squareDistance(b.to, target);
  if (distanceDifference !== 0) {
    return distanceDifference;
  }

  return a.to.localeCompare(b.to);
}

type DeltaCheck = (fileDelta: number, rankDelta: number) => boolean;

const CAN_REACH_IN_ONE: Record<PieceSymbol, DeltaCheck> = {
  r: (file, rank) => file === 0 || rank === 0,
  b: (file, rank) => file !== 0 && Math.abs(file) === Math.abs(rank),
  q: (file, rank) => file === 0 || rank === 0 || Math.abs(file) === Math.abs(rank),
  n: (file, rank) =>
    (Math.abs(file) === 2 && Math.abs(rank) === 1) ||
    (Math.abs(file) === 1 && Math.abs(rank) === 2),
  k: (file, rank) => Math.max(Math.abs(file), Math.abs(rank)) === 1,
  p: (file, rank) => (file === 0 && rank === 1) || (Math.abs(file) === 1 && rank === 1),
};

function canReachInOne(piece: PieceSymbol, from: Square, to: Square): boolean {
  return CAN_REACH_IN_ONE[piece](fileIndex(to) - fileIndex(from), rankIndex(to) - rankIndex(from));
}

function squareDistance(a: Square, b: Square): number {
  return Math.max(Math.abs(fileIndex(a) - fileIndex(b)), Math.abs(rankIndex(a) - rankIndex(b)));
}

function fileIndex(square: Square): number {
  return square.charCodeAt(0) - 97;
}

function rankIndex(square: Square): number {
  return Number(square[1]) - 1;
}

/**
 * Geeft de zetten van het stuk op dit veld, ongeacht kleur. Zo kan het kind
 * ook de zwarte stukken aantikken om te zien waar die heen kunnen; alleen
 * slepen en neerzetten levert een echte zet op.
 */
export function legalMovesFor(fen: string, square: string): readonly Square[] {
  return movesForPiece(fen, square, { skipValidation: true });
}

export function playTutorialMove(
  level: TutorialLevel,
  fen: string,
  from: string,
  to: string,
  moveCountBefore: number,
): TutorialMoveResult {
  if (!isChessSquare(from) || !isChessSquare(to)) {
    return { ok: false, reason: "invalid-square" };
  }

  const chess = createTutorialChess(fen);
  const piece = chess.get(from);

  if (!piece) {
    return { ok: false, reason: "no-piece" };
  }

  if (piece.color !== "w") {
    return { ok: false, reason: "wrong-color" };
  }

  if (piece.type !== level.playerPiece) {
    return { ok: false, reason: "wrong-piece" };
  }

  const applied = tryMove(chess, from, to);

  if (!applied) {
    return { ok: false, reason: "illegal-move" };
  }

  const move: TutorialMove = {
    from: applied.from,
    to: applied.to,
    san: applied.san,
    ...(applied.captured ? { captured: applied.captured } : {}),
  };
  const nextMoveCount = moveCountBefore + 1;
  const nextFen = rearmWhite(chess.fen());
  const completed = isGoalReached(level, applied, chess, nextMoveCount);

  return {
    ok: true,
    move,
    nextFen,
    completed,
    stuck: !completed && !isGoalPossible(level, nextFen),
  };
}

/**
 * Rokade kan alleen zolang het castlingrecht in de FEN staat. Een koning- of
 * torenzet haalt dat recht weg; de les kan daarna niet meer worden afgerond.
 */
function isGoalPossible(level: TutorialLevel, fen: string): boolean {
  const castling = fen.split(" ")[2] ?? "-";

  switch (level.goal) {
    case "castle-kingside":
      return castling.includes("K");
    case "castle-queenside":
      return castling.includes("Q");
    default:
      return true;
  }
}

function isGoalReached(level: TutorialLevel, move: Move, chess: Chess, moveCount: number): boolean {
  switch (level.goal) {
    case "check":
      return chess.isCheck();
    case "checkmate":
      return chess.isCheckmate();
    case "castle-kingside":
      return move.isKingsideCastle();
    case "castle-queenside":
      return move.isQueensideCastle();
    default:
      return Boolean(
        level.targetSquare &&
        move.to === level.targetSquare &&
        moveCount >= (level.minimumMoves ?? 1),
      );
  }
}

function tryMove(chess: Chess, from: Square, to: Square): Move | null {
  try {
    return chess.move({ from, to, promotion: "q" });
  } catch {
    return null;
  }
}
