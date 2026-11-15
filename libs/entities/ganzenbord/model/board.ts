import type { SquareKind } from "./types";

export const FINISH = 63;

/** De dertien ganzenvakjes uit de klassieke indeling. */
export const GOOSE_SQUARES = [5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54, 59] as const;

const GOOSE_SET = new Set<number>(GOOSE_SQUARES);

interface SpecialSquare {
  readonly kind: Exclude<SquareKind, "normal" | "goose" | "finish">;
  readonly label: string;
}

/** De zes gevaren en hun klassieke betekenis. */
const SPECIAL_SQUARES: Readonly<Record<number, SpecialSquare>> = {
  6: { kind: "bridge", label: "Brug" },
  19: { kind: "inn", label: "Herberg" },
  31: { kind: "well", label: "Put" },
  42: { kind: "maze", label: "Doolhof" },
  52: { kind: "prison", label: "Gevangenis" },
  58: { kind: "death", label: "Dood" },
};

export function isGooseSquare(square: number): boolean {
  return GOOSE_SET.has(square);
}

export function squareKind(square: number): SquareKind {
  if (square === FINISH) {
    return "finish";
  }
  const special = SPECIAL_SQUARES[square];
  if (special) {
    return special.kind;
  }
  return isGooseSquare(square) ? "goose" : "normal";
}
