export { GOOSE_SQUARES, squareKind } from "./model/board";
export { createGame, isFinished, playTurn } from "./model/engine";
export { firstThrowTarget, movePlayer } from "./model/movement";
export { CONTROLLERS, MAX_PLAYERS, MIN_PLAYERS, PLAYER_IDS } from "./model/types";
export type {
  Controller,
  Dice,
  GanzenbordGame,
  PlayerId,
  PlayerSetup,
  PlayerState,
  TurnEvent,
} from "./model/types";
