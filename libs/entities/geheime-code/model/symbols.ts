import type { CodeSymbol } from "./types";

/**
 * Eén symboolfamilie voor de codekaart. De namen per taal staan in
 * `texts.ts` en zijn ook de schermlezer-labels. De tint is een vaste eigenschap van het symbool,
 * zodat dezelfde ster in de codekaart en de woordrij dezelfde kleur houdt.
 */
export const SYMBOLS: readonly CodeSymbol[] = [
  { id: "star", tone: "pink" },
  { id: "heart", tone: "pink" },
  { id: "moon", tone: "indigo" },
  { id: "key", tone: "indigo" },
  { id: "crown", tone: "pink" },
  { id: "fish", tone: "green" },
  { id: "flower", tone: "orange" },
  { id: "boat", tone: "green" },
  { id: "gift", tone: "orange" },
  { id: "book", tone: "orange" },
  { id: "carrot", tone: "green" },
  { id: "bag", tone: "indigo" },
  { id: "bell", tone: "pink" },
  { id: "anchor", tone: "blue" },
  { id: "tree", tone: "green" },
  { id: "house", tone: "orange" },
  { id: "cat", tone: "violet" },
  { id: "rocket", tone: "blue" },
];

export const SYMBOL_BY_ID: Readonly<Record<string, CodeSymbol>> = Object.fromEntries(
  SYMBOLS.map((symbol) => [symbol.id, symbol]),
);

export const SYMBOL_ORDER: Readonly<Record<string, number>> = Object.fromEntries(
  SYMBOLS.map((symbol, index) => [symbol.id, index]),
);
