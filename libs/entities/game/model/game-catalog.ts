interface GameCatalogBase {
  id: string;
  name: string;
  description: string;
  emoji: string;
  accentClassName: string;
}

export type GameCatalogEntry = GameCatalogBase &
  (
    | {
        status: "available";
        to:
          | "/sudoku"
          | "/pijlen"
          | "/zoeken"
          | "/memory"
          | "/raad"
          | "/schaken"
          | "/puzzels"
          | "/woordzoeker";
      }
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
    id: "arrows",
    name: "Pijlen",
    description: "Haal alle pijlen weg zonder dat ze tegen elkaar botsen.",
    emoji: "🏹",
    status: "available",
    to: "/pijlen",
    accentClassName: "from-rose-100 via-orange-50 to-white",
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
    id: "word-search",
    name: "Woordzoeker",
    description: "Zoek woorden in de tuin of onder water. Kies 10 × 10, 12 × 12 of 14 × 14.",
    emoji: "🔤",
    status: "available",
    to: "/woordzoeker",
    accentClassName: "from-teal-100 via-emerald-50 to-white",
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
  {
    id: "chess-tutorial",
    name: "Schaaktutorial",
    description: "Leer de toren, het paard en de pion stap voor stap kennen.",
    emoji: "♞",
    status: "available",
    to: "/schaken",
    accentClassName: "from-violet-100 via-violet-50 to-white",
  },
  {
    id: "chess-puzzles",
    name: "Schaakpuzzels",
    description: "Los korte puzzels op: zet schaakmat of win een stuk.",
    emoji: "🧩",
    status: "available",
    to: "/puzzels",
    accentClassName: "from-teal-100 via-emerald-50 to-white",
  },
];
