export { GOOSE_SQUARES, squareKind } from "./model/board";
export { createGame, isFinished, playTurn } from "./model/engine";
export { firstThrowTarget, movePlayer } from "./model/movement";
export {
  DEFAULT_PLAYER_COLORS,
  MAX_PLAYER_NAME_LENGTH,
  isPlayerColor,
  normalizePlayerName,
} from "./model/player";
export { CONTROLLERS, MAX_PLAYERS, MIN_PLAYERS, PLAYER_IDS } from "./model/types";
export type {
  Controller,
  Dice,
  GanzenbordGame,
  PlayerColor,
  PlayerId,
  PlayerSetup,
  PlayerState,
  TurnEvent,
  TurnEventKind,
  TurnResult,
} from "./model/types";
