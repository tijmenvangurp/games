interface GameCatalogBase {
  id: string;
  name: string;
  description: string;
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
        thumbnail: string;
      }
    | { status: "coming-soon" }
  );

export const gameCatalog: readonly GameCatalogEntry[] = [
  {
    id: "sudoku",
    name: "Sudoku",
    description: "Puzzel met cijfers of dieren. Kies 4 × 4, 6 × 6 of 9 × 9.",
    status: "available",
    to: "/sudoku",
    thumbnail: "/thumbnails/sudoku.jpg",
  },
  {
    id: "math-trainer",
    name: "Tafel Topper",
    description: "Oefen plus, min, keer en deel. Verdien sterren.",
    status: "available",
    to: "/rekenen",
    thumbnail: "/thumbnails/math-trainer.jpg",
  },
  {
    id: "arrows",
    name: "Pijlen",
    description: "Haal alle pijlen weg zonder dat ze tegen elkaar botsen.",
    status: "available",
    to: "/pijlen",
    thumbnail: "/thumbnails/arrows.jpg",
  },
  {
    id: "seek",
    name: "Waar is Wobbel?",
    description: "Zoek het monstertje met de ster tussen alle andere Wobbels.",
    status: "available",
    to: "/zoeken",
    thumbnail: "/thumbnails/seek.jpg",
  },
  {
    id: "word-search",
    name: "Woordzoeker",
    description: "Zoek woorden in de tuin, onder water of tussen de Pokémon.",
    status: "available",
    to: "/woordzoeker",
    thumbnail: "/thumbnails/word-search.jpg",
  },
  {
    id: "memory",
    name: "Pokémon Memory",
    description: "Zoek de paren tussen de 151 Pokémon uit Generatie 1.",
    status: "available",
    to: "/memory",
    thumbnail: "/thumbnails/memory.jpg",
  },
  {
    id: "pokemon-quiz",
    name: "Wie is deze Pokémon?",
    description: "Kies de juiste naam bij het plaatje. 3, 4 of 5 namen.",
    status: "available",
    to: "/raad",
    thumbnail: "/thumbnails/pokemon-quiz.jpg",
  },
  {
    id: "chess-tutorial",
    name: "Schaakles",
    description: "Leer stap voor stap alle stukken en zet je eerste schaakmat.",
    status: "available",
    to: "/schaken",
    thumbnail: "/thumbnails/chess-tutorial.jpg",
  },
  {
    id: "chess-puzzles",
    name: "Schaakpuzzels",
    description: "Los korte puzzels op: zet schaakmat of win een stuk.",
    status: "available",
    to: "/puzzels",
    thumbnail: "/thumbnails/chess-puzzles.jpg",
  },
  {
    id: "french-listening",
    name: "Bonjour !",
    description: "Luister naar Frans en kies de juiste Nederlandse vertaling.",
    status: "available",
    to: "/frans",
    thumbnail: "/thumbnails/french-listening.jpg",
  },
];
