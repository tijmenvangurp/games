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
    accentClassName: "from-cyan-400/25 via-sky-500/10 to-transparent",
  },
  {
    id: "math-trainer",
    name: "Tafel Topper",
    description: "Oefen plus, min, keer en deel. Verdien sterren.",
    emoji: "🔢",
    status: "available",
    to: "/rekenen",
    accentClassName: "from-amber-400/25 via-orange-500/10 to-transparent",
  },
  {
    id: "arrows",
    name: "Pijlen",
    description: "Haal alle pijlen weg zonder dat ze tegen elkaar botsen.",
    emoji: "🏹",
    status: "available",
    to: "/pijlen",
    accentClassName: "from-rose-500/30 via-pink-500/10 to-transparent",
  },
  {
    id: "seek",
    name: "Waar is Wobbel?",
    description: "Zoek het monstertje met de ster tussen alle andere Wobbels.",
    emoji: "🔍",
    status: "available",
    to: "/zoeken",
    accentClassName: "from-emerald-400/25 via-green-500/10 to-transparent",
  },
  {
    id: "word-search",
    name: "Woordzoeker",
    description: "Zoek woorden in de tuin of onder water. Kies 10 × 10, 12 × 12 of 14 × 14.",
    emoji: "🔤",
    status: "available",
    to: "/woordzoeker",
    accentClassName: "from-teal-400/25 via-cyan-500/10 to-transparent",
  },
  {
    id: "memory",
    name: "Pokémon Memory",
    description: "Zoek de paren tussen de 151 Pokémon uit Generatie 1.",
    emoji: "⚡",
    status: "available",
    to: "/memory",
    accentClassName: "from-yellow-400/25 via-amber-500/10 to-transparent",
  },
  {
    id: "pokemon-quiz",
    name: "Wie is deze Pokémon?",
    description: "Kies de juiste naam bij het plaatje. 3, 4 of 5 namen.",
    emoji: "❓",
    status: "available",
    to: "/raad",
    accentClassName: "from-indigo-400/30 via-violet-500/10 to-transparent",
  },
  {
    id: "chess-tutorial",
    name: "Schaakles",
    description: "Leer stap voor stap alle stukken en zet je eerste schaakmat.",
    emoji: "♞",
    status: "available",
    to: "/schaken",
    accentClassName: "from-violet-500/30 via-purple-500/10 to-transparent",
  },
  {
    id: "chess-puzzles",
    name: "Schaakpuzzels",
    description: "Los korte puzzels op: zet schaakmat of win een stuk.",
    emoji: "🧩",
    status: "available",
    to: "/puzzels",
    accentClassName: "from-teal-400/25 via-emerald-500/10 to-transparent",
  },
  {
    id: "french-listening",
    name: "Bonjour !",
    description: "Luister naar Frans en kies de juiste Nederlandse vertaling.",
    emoji: "🇫🇷",
    status: "available",
    to: "/frans",
    accentClassName: "from-blue-500/30 via-sky-500/10 to-transparent",
  },
];
