export const PLAYERS = ["one", "two"] as const;

/** De twee helften van een partij. */
export type Player = (typeof PLAYERS)[number];

/** Eén vakje: leeg of van een speler. */
export type Cell = Player | null;

/**
 * Kolommen van onder naar boven: `board[column][row]`, met rij 0 onderaan. Zo
 * is vallen simpel: de eerste lege rij van een kolom is waar de schijf landt.
 */
export type Board = readonly (readonly Cell[])[];

export const BOARD_SIZES = ["groot", "klein"] as const;

/** Het formaat van het bord; klein is bedoeld voor de jongste speler. */
export type BoardSize = (typeof BOARD_SIZES)[number];

export interface BoardShape {
  readonly columns: number;
  readonly rows: number;
}

/** Vier op een rij, de klassieke regel. */
export const LINE_LENGTH = 4;

export interface Position {
  readonly column: number;
  readonly row: number;
}

export interface WinLine {
  readonly player: Player;
  readonly cells: readonly Position[];
}

export interface Drop {
  readonly player: Player;
  readonly column: number;
  readonly row: number;
}
