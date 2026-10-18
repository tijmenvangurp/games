export type CrosswordDirection = "across" | "down";

export interface CrosswordEntryInput {
  direction: CrosswordDirection;
  row: number;
  col: number;
  answer: string;
  clue: string;
}

export interface CrosswordEntry extends CrosswordEntryInput {
  number: number;
}

export interface CrosswordCell {
  row: number;
  col: number;
  solution: string | null;
  number: number | null;
}

export interface CrosswordPoint {
  row: number;
  col: number;
}

export interface CrosswordPuzzle {
  id: string;
  title: string;
  category: string;
  width: number;
  height: number;
  cells: readonly (readonly CrosswordCell[])[];
  entries: readonly CrosswordEntry[];
}

export interface CrosswordInput {
  id: string;
  title: string;
  category: string;
  grid: readonly string[];
  entries: readonly CrosswordEntryInput[];
}
