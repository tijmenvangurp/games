export { BOARD_SHAPES, BOARD_SIZE_INFO, BOARD_SIZE_OPTIONS, PLAYER_INFO } from "./model/config";
export {
  applyDrop,
  createGame,
  isFinished,
  startingPlayerAfter,
  undoDrop,
  winnerOf,
} from "./model/game";
export type { FourInARowGame } from "./model/game";
export {
  createBoard,
  dropDisc,
  findWinLine,
  isBoardFull,
  isPlayable,
  landingRow,
  otherPlayer,
  setCell,
} from "./model/rules";
export { BOARD_SIZES, PLAYERS } from "./model/types";
export type { Board, BoardShape, BoardSize, Cell, Player } from "./model/types";
