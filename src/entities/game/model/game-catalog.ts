export interface GameCatalogEntry {
  id: string;
  name: string;
  description: string;
  emoji: string;
  status: "available" | "coming-soon";
  accentClassName: string;
}

export const gameCatalog: readonly GameCatalogEntry[] = [
  {
    id: "sudoku",
    name: "Sudoku",
    description: "Puzzel met cijfers of dieren. Kies 4 × 4, 6 × 6 of 9 × 9.",
    emoji: "🧩",
    status: "available",
    accentClassName: "from-sky-100 via-sky-50 to-white",
  },
  {
    id: "memory",
    name: "Memory",
    description: "Zoek de paren. Komt binnenkort.",
    emoji: "🃏",
    status: "coming-soon",
    accentClassName: "from-amber-100 via-amber-50 to-white",
  },
];
