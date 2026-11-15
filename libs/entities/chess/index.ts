export {
  CHESS_AVATARS,
  DEFAULT_AVATARS,
  createDefaultPlayers,
  isChessAvatar,
} from "./model/avatars";
export { COMPUTER_LEVELS } from "./model/types";
export { COMPUTER_LEVEL_INFO } from "./model/levels";
export {
  INITIAL_FEN,
  checkedKingSquare,
  describeResult,
  fenAfterMoves,
  legalMoves,
  otherColor,
  playMove,
  turnOf,
} from "./model/game";
export type {
  ChessMode,
  ChessMoveRecord,
  ChessMoveResult,
  ChessPlayer,
  ChessResult,
  ComputerLevel,
} from "./model/types";
