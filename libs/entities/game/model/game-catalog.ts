interface GameCatalogBase {
  id: string;
  name: string;
  description: string;
  emoji: string;
  accentClassName: string;
}

export type GameCatalogEntry = GameCatalogBase &
  (
    | { status: "available"; to: "/sudoku" | "/zoeken" | "/memory" | "/raad" }
    | { status: "coming-soon" }
  );

export const gameCatalog: readonly GameCatalogEntry[] = [
  {
    id: "sudoku",
    name: "Sudoku",
    description: "Puzzel met cijfers of dieren. Kies 4 × 4, 6 × 6 of 9 × 9.",
    emoji: "🧩",
    status: "available",
    to: "/sudoku",
    accentClassName: "from-sky-100 via-sky-50 to-white",
  },
  {
    id: "seek",
    name: "Waar is Wobbel?",
    description: "Zoek het monstertje met de ster tussen alle andere Wobbels.",
    emoji: "🔍",
    status: "available",
    to: "/zoeken",
    accentClassName: "from-emerald-100 via-emerald-50 to-white",
  },
  {
    id: "memory",
    name: "Pokémon Memory",
    description: "Zoek de paren tussen de 151 Pokémon uit Generatie 1.",
    emoji: "⚡",
    status: "available",
    to: "/memory",
    accentClassName: "from-amber-100 via-amber-50 to-white",
  },
  {
    id: "pokemon-quiz",
    name: "Wie is deze Pokémon?",
    description: "Kies de juiste naam bij het plaatje. 3, 4 of 5 namen.",
    emoji: "❓",
    status: "available",
    to: "/raad",
    accentClassName: "from-indigo-100 via-indigo-50 to-white",
  },
];
