export type MolenspelPlayer = "wit" | "zwart";

export type MolenspelPhase = "plaatsen" | "schuiven" | "vliegen";

export type MolenspelBoard = readonly (MolenspelPlayer | null)[];

export interface MolenspelGame {
  /** De 24 punten van het bord; `null` betekent een leeg punt. */
  board: MolenspelBoard;
  /** Aantal stenen dat elke speler nog moet leggen. */
  inHand: Readonly<Record<MolenspelPlayer, number>>;
  /** De speler die aan de beurt is. */
  turn: MolenspelPlayer;
  /** De fase waarin de speler aan de beurt zich bevindt. */
  phase: MolenspelPhase;
  /** Het geselecteerde eigen steen, of `null`. */
  selected: number | null;
  /** `true` als de speler een tegenstandersteen mag verwijderen na een molentje. */
  awaitRemoval: boolean;
  /** De winnaar, of `null` zolang het spel loopt. */
  winner: MolenspelPlayer | null;
  /** `true` bij gelijkspel. */
  draw: boolean;
  /** `true` zodra beide spelers nog drie stenen hebben. */
  endgame: boolean;
  /** Aantal beurten dat beide spelers met drie stenen spelen. */
  endgameTurns: number;
  /** Aantal gespeelde halve beurten. */
  moves: number;
}

export const MOLENSPEL_PIECES_PER_PLAYER = 9;

/** Aantal beurten dat beide spelers met drie stenen mogen spelen voordat het gelijkspel is. */
export const MOLENSPEL_ENDGAME_TURNS = 10;
