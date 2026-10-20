export {
  MOLENSPEL_ADJACENCY,
  MOLENSPEL_EDGES,
  MOLENSPEL_LINES,
  MOLENSPEL_MILLS,
  MOLENSPEL_POINTS,
} from "./model/board";
export {
  chooseTarget,
  createMolenspelGame,
  hasLegalMove,
  isInMill,
  legalMoves,
  millsOf,
  movePiece,
  phaseFor,
  placePiece,
  piecesOnBoard,
  rematchMolenspel,
  removablePieces,
  removePiece,
  selectPiece,
} from "./model/rules";
export { MOLENSPEL_PIECES_PER_PLAYER } from "./model/types";
export type { MolenspelPoint } from "./model/board";
export type { MolenspelBoard, MolenspelGame, MolenspelPhase, MolenspelPlayer } from "./model/types";
