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
          | "/frans"
          | "/letters";
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
    thumbnail: "/thumbnails/sudoku-4c71fa62.jpg",
  },
  {
    id: "math-trainer",
    name: "Tafel Topper",
    description: "Oefen plus, min, keer en deel. Verdien sterren.",
    status: "available",
    to: "/rekenen",
    thumbnail: "/thumbnails/math-trainer-52c58abf.jpg",
  },
  {
    id: "arrows",
    name: "Pijlen",
    description: "Haal alle pijlen weg zonder dat ze tegen elkaar botsen.",
    status: "available",
    to: "/pijlen",
    thumbnail: "/thumbnails/arrows-381e560b.jpg",
  },
  {
    id: "seek",
    name: "Waar is Wobbel?",
    description: "Zoek het monstertje met de ster tussen alle andere Wobbels.",
    status: "available",
    to: "/zoeken",
    thumbnail: "/thumbnails/seek-3c60cc62.jpg",
  },
  {
    id: "word-search",
    name: "Woordzoeker",
    description: "Zoek woorden in de tuin, onder water of tussen de Pokémon.",
    status: "available",
    to: "/woordzoeker",
    thumbnail: "/thumbnails/word-search-bdb93413.jpg",
  },
  {
    id: "memory",
    name: "Pokémon Memory",
    description: "Zoek de paren tussen de 151 Pokémon uit Generatie 1.",
    status: "available",
    to: "/memory",
    thumbnail: "/thumbnails/memory-144b9a2e.jpg",
  },
  {
    id: "pokemon-quiz",
    name: "Wie is deze Pokémon?",
    description: "Kies de juiste naam bij het plaatje. 3, 4 of 5 namen.",
    status: "available",
    to: "/raad",
    thumbnail: "/thumbnails/pokemon-quiz-0327a69d.jpg",
  },
  {
    id: "chess-tutorial",
    name: "Schaakles",
    description: "Leer stap voor stap alle stukken en zet je eerste schaakmat.",
    status: "available",
    to: "/schaken",
    thumbnail: "/thumbnails/chess-tutorial-6b1e58dd.jpg",
  },
  {
    id: "chess-puzzles",
    name: "Schaakpuzzels",
    description: "Los korte puzzels op: zet schaakmat of win een stuk.",
    status: "available",
    to: "/puzzels",
    thumbnail: "/thumbnails/chess-puzzles-d7f67a74.jpg",
  },
  {
    id: "french-listening",
    name: "Bonjour !",
    description: "Luister naar Frans en kies de juiste Nederlandse vertaling.",
    status: "available",
    to: "/frans",
    thumbnail: "/thumbnails/french-listening-ffc3da24.jpg",
  },
  {
    id: "letters",
    name: "Letterpret",
    description: "Hoor de klank, zoek de letter en bouw woordjes.",
    status: "available",
    to: "/letters",
    thumbnail: "/thumbnails/letters-6b90ec8a.jpg",
  },
];
