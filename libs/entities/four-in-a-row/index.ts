export {
  BOARD_SHAPES,
  BOARD_SIZE_INFO,
  BOARD_SIZE_OPTIONS,
  COMPUTER_LEVEL_INFO,
  PLAYER_INFO,
} from "./model/config";
export { chooseComputerColumn } from "./model/ai";
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
export { BOARD_SIZES, COMPUTER_LEVELS, MODES, PLAYERS } from "./model/types";
export type {
  Board,
  BoardShape,
  BoardSize,
  Cell,
  ComputerLevel,
  FourInARowMode,
  Player,
} from "./model/types";
