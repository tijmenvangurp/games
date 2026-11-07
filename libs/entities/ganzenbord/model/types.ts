/** De vaste spelersvolgorde; een partij gebruikt de eerste twee, drie of vier. */
export const PLAYER_IDS = ["one", "two", "three", "four"] as const;

export type PlayerId = (typeof PLAYER_IDS)[number];

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

export const CONTROLLERS = ["human", "computer"] as const;

/** Speelt deze pion zichzelf of zit er een mens achter? */
export type Controller = (typeof CONTROLLERS)[number];

export interface PlayerSetup {
  readonly id: PlayerId;
  readonly controller: Controller;
}

/** Een pion op het bord. Positie 0 is het startvak vóór vakje 1. */
export interface PlayerState {
  readonly id: PlayerId;
  readonly controller: Controller;
  readonly position: number;
  /** Aantal nog over te slaan beurten, bijvoorbeeld na de herberg. */
  readonly skipTurns: number;
  /** 31 (put) of 52 (gevangenis), of null als de speler vrij is. */
  readonly stuckOn: number | null;
  /** Alleen de allereerste worp van deze speler krijgt de 9-regel. */
  readonly firstRollDone: boolean;
}

export type SquareKind =
  | "normal"
  | "goose"
  | "bridge"
  | "inn"
  | "well"
  | "maze"
  | "prison"
  | "death"
  | "finish";

export type Dice = readonly [number, number];

export interface Roll {
  readonly player: PlayerId;
  readonly dice: Dice;
  readonly total: number;
}

export type TurnEventKind =
  | "roll"
  | "move"
  | "first-throw"
  | "goose"
  | "bounce"
  | "bridge"
  | "inn"
  | "well"
  | "prison"
  | "maze"
  | "death"
  | "free"
  | "skip"
  | "win"
  | "draw";

export interface TurnEvent {
  readonly kind: TurnEventKind;
  readonly player: PlayerId;
  readonly from?: number;
  readonly to?: number;
  readonly value?: number;
  readonly dice?: Dice;
  /** Bij `free`: de speler die uit de put of gevangenis komt. */
  readonly other?: PlayerId;
}

export type GameStatus = "playing" | "finished" | "draw";

export interface GanzenbordGame {
  readonly players: readonly PlayerState[];
  readonly current: PlayerId;
  readonly first: PlayerId;
  readonly status: GameStatus;
  readonly winner: PlayerId | null;
  readonly lastRoll: Roll | null;
}

export interface TurnResult {
  readonly game: GanzenbordGame;
  readonly events: readonly TurnEvent[];
}
