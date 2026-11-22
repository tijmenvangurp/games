import type { CodeSymbol } from "./types";

/**
 * Eén symboolfamilie voor de codekaart. De namen zijn Nederlands en worden
 * ook de schermlezer-labels. De tint is een vaste eigenschap van het symbool,
 * zodat dezelfde ster in de codekaart en de woordrij dezelfde kleur houdt.
 */
export const SYMBOLS: readonly CodeSymbol[] = [
  { id: "star", name: "ster", tone: "pink" },
  { id: "heart", name: "hart", tone: "pink" },
  { id: "moon", name: "maan", tone: "indigo" },
  { id: "key", name: "sleutel", tone: "indigo" },
  { id: "crown", name: "kroon", tone: "pink" },
  { id: "fish", name: "vis", tone: "green" },
  { id: "flower", name: "bloem", tone: "orange" },
  { id: "boat", name: "boot", tone: "green" },
  { id: "gift", name: "cadeau", tone: "orange" },
  { id: "book", name: "boek", tone: "orange" },
  { id: "carrot", name: "wortel", tone: "green" },
  { id: "bag", name: "tas", tone: "indigo" },
  { id: "bell", name: "bel", tone: "pink" },
  { id: "anchor", name: "anker", tone: "blue" },
  { id: "tree", name: "boom", tone: "green" },
  { id: "house", name: "huis", tone: "orange" },
  { id: "cat", name: "kat", tone: "violet" },
  { id: "rocket", name: "raket", tone: "blue" },
];

export const SYMBOL_BY_ID: Readonly<Record<string, CodeSymbol>> = Object.fromEntries(
  SYMBOLS.map((symbol) => [symbol.id, symbol]),
);

export const SYMBOL_ORDER: Readonly<Record<string, number>> = Object.fromEntries(
  SYMBOLS.map((symbol, index) => [symbol.id, index]),
);
