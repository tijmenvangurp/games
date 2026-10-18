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
          | "/rekenen"
          | "/pijlen"
          | "/zoeken"
          | "/memory"
          | "/raad"
          | "/schaken"
          | "/puzzels"
          | "/woordzoeker"
          | "/frans";
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
    accentClassName: "from-[#eef3f7] via-[#f7fafc] to-[#fdfefe]",
  },
  {
    id: "math-trainer",
    name: "Tafel Topper",
    description: "Oefen plus, min, keer en deel. Verdien sterren.",
    emoji: "🔢",
    status: "available",
    to: "/rekenen",
    accentClassName: "from-[#fbf0e3] via-[#fdf7ee] to-[#fffdf9]",
  },
  {
    id: "arrows",
    name: "Pijlen",
    description: "Haal alle pijlen weg zonder dat ze tegen elkaar botsen.",
    emoji: "🏹",
    status: "available",
    to: "/pijlen",
    accentClassName: "from-[#f8ece7] via-[#fcf5f1] to-[#fffdfb]",
  },
  {
    id: "seek",
    name: "Waar is Wobbel?",
    description: "Zoek het monstertje met de ster tussen alle andere Wobbels.",
    emoji: "🔍",
    status: "available",
    to: "/zoeken",
    accentClassName: "from-[#eef4e9] via-[#f6faf2] to-[#fdfefb]",
  },
  {
    id: "word-search",
    name: "Woordzoeker",
    description: "Zoek woorden in de tuin, onder water of tussen de Pokémon.",
    emoji: "🔤",
    status: "available",
    to: "/woordzoeker",
    accentClassName: "from-[#e9f3ef] via-[#f3faf7] to-[#fcfffe]",
  },
  {
    id: "memory",
    name: "Pokémon Memory",
    description: "Zoek de paren tussen de 151 Pokémon uit Generatie 1.",
    emoji: "⚡",
    status: "available",
    to: "/memory",
    accentClassName: "from-[#fbf2dd] via-[#fdf8eb] to-[#fffdf7]",
  },
  {
    id: "pokemon-quiz",
    name: "Wie is deze Pokémon?",
    description: "Kies de juiste naam bij het plaatje. 3, 4 of 5 namen.",
    emoji: "❓",
    status: "available",
    to: "/raad",
    accentClassName: "from-[#efedf6] via-[#f7f5fb] to-[#fdfcff]",
  },
  {
    id: "chess-tutorial",
    name: "Schaakles",
    description: "Leer stap voor stap alle stukken en zet je eerste schaakmat.",
    emoji: "♞",
    status: "available",
    to: "/schaken",
    accentClassName: "from-[#f2edf6] via-[#f9f6fb] to-[#fdfcff]",
  },
  {
    id: "chess-puzzles",
    name: "Schaakpuzzels",
    description: "Los korte puzzels op: zet schaakmat of win een stuk.",
    emoji: "🧩",
    status: "available",
    to: "/puzzels",
    accentClassName: "from-[#eaf3ef] via-[#f4faf7] to-[#fcfffe]",
  },
  {
    id: "french-listening",
    name: "Bonjour !",
    description: "Luister naar Frans en kies de juiste Nederlandse vertaling.",
    emoji: "🇫🇷",
    status: "available",
    to: "/frans",
    accentClassName: "from-[#eaf0f7] via-[#f4f8fc] to-[#fcfdff]",
  },
];
