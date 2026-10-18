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
    accentClassName: "from-[#c7e7ff] via-[#e4f3ff] to-[#f4faff]",
  },
  {
    id: "math-trainer",
    name: "Tafel Topper",
    description: "Oefen plus, min, keer en deel. Verdien sterren.",
    emoji: "🔢",
    status: "available",
    to: "/rekenen",
    accentClassName: "from-[#ffe0a8] via-[#fff0cf] to-[#fffaf0]",
  },
  {
    id: "arrows",
    name: "Pijlen",
    description: "Haal alle pijlen weg zonder dat ze tegen elkaar botsen.",
    emoji: "🏹",
    status: "available",
    to: "/pijlen",
    accentClassName: "from-[#ffc9c9] via-[#ffe4dc] to-[#fff7f3]",
  },
  {
    id: "seek",
    name: "Waar is Wobbel?",
    description: "Zoek het monstertje met de ster tussen alle andere Wobbels.",
    emoji: "🔍",
    status: "available",
    to: "/zoeken",
    accentClassName: "from-[#c9f2c7] via-[#e4f9dc] to-[#f6fff0]",
  },
  {
    id: "word-search",
    name: "Woordzoeker",
    description: "Zoek woorden in de tuin of onder water. Kies 10 × 10, 12 × 12 of 14 × 14.",
    emoji: "🔤",
    status: "available",
    to: "/woordzoeker",
    accentClassName: "from-[#b9f0df] via-[#ddfaf0] to-[#f2fffb]",
  },
  {
    id: "memory",
    name: "Pokémon Memory",
    description: "Zoek de paren tussen de 151 Pokémon uit Generatie 1.",
    emoji: "⚡",
    status: "available",
    to: "/memory",
    accentClassName: "from-[#ffe3a3] via-[#fff2c9] to-[#fffbf0]",
  },
  {
    id: "pokemon-quiz",
    name: "Wie is deze Pokémon?",
    description: "Kies de juiste naam bij het plaatje. 3, 4 of 5 namen.",
    emoji: "❓",
    status: "available",
    to: "/raad",
    accentClassName: "from-[#d6d5ff] via-[#ecebff] to-[#f9f8ff]",
  },
  {
    id: "chess-tutorial",
    name: "Schaakles",
    description: "Leer stap voor stap alle stukken en zet je eerste schaakmat.",
    emoji: "♞",
    status: "available",
    to: "/schaken",
    accentClassName: "from-[#e2d1ff] via-[#f0e8ff] to-[#fbf8ff]",
  },
  {
    id: "chess-puzzles",
    name: "Schaakpuzzels",
    description: "Los korte puzzels op: zet schaakmat of win een stuk.",
    emoji: "🧩",
    status: "available",
    to: "/puzzels",
    accentClassName: "from-[#c9f0e3] via-[#e4faf2] to-[#f7fffc]",
  },
  {
    id: "french-listening",
    name: "Bonjour !",
    description: "Luister naar Frans en kies de juiste Nederlandse vertaling.",
    emoji: "🇫🇷",
    status: "available",
    to: "/frans",
    accentClassName: "from-[#cfe1ff] via-[#e8f0ff] to-[#f8fbff]",
  },
];
