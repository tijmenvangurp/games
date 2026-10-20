interface GameCatalogBase {
  id: string;
  name: string;
  description: string;
}

export type GameSpeech =
  | { readonly kind: "group"; readonly folders: readonly string[] }
  | { readonly kind: "visual"; readonly reason: string }
  | { readonly kind: "pending"; readonly reason: string }
  | { readonly kind: "legacy"; readonly reason: string };

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
          | "/woordzoeker"
          | "/mengelmoes"
          | "/frans"
          | "/letters"
          | "/vlaggen";
        thumbnail: string;
        /** Elke game kiest expliciet hoe het met spraak omgaat. */
        speech: GameSpeech;
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
    speech: { kind: "visual", reason: "Het bord en de symbolen zijn visueel." },
  },
  {
    id: "math-trainer",
    name: "Tafel Topper",
    description: "Oefen plus, min, keer en deel. Verdien sterren.",
    status: "available",
    to: "/rekenen",
    thumbnail: "/thumbnails/math-trainer-52c58abf.jpg",
    speech: { kind: "group", folders: ["math"] },
  },
  {
    id: "arrows",
    name: "Pijlen",
    description: "Haal alle pijlen weg zonder dat ze tegen elkaar botsen.",
    status: "available",
    to: "/pijlen",
    thumbnail: "/thumbnails/arrows-381e560b.jpg",
    speech: { kind: "visual", reason: "De pijlen en het bord zijn visueel." },
  },
  {
    id: "seek",
    name: "Waar is Wobbel?",
    description: "Zoek het monstertje met de ster tussen alle andere Wobbels.",
    status: "available",
    to: "/zoeken",
    thumbnail: "/thumbnails/seek-3c60cc62.jpg",
    speech: { kind: "visual", reason: "Het zoekveld is visueel." },
  },
  {
    id: "word-search",
    name: "Woordzoeker",
    description: "Zoek woorden in de tuin, onder water of tussen de Pokémon.",
    status: "available",
    to: "/woordzoeker",
    thumbnail: "/thumbnails/word-search-bdb93413.jpg",
    speech: { kind: "group", folders: ["words"] },
  },
  {
    id: "alchemy",
    name: "Mengelmoes",
    description: "Sleep elementen op elkaar en ontdek wat er ontstaat.",
    status: "available",
    to: "/mengelmoes",
    thumbnail: "/thumbnails/alchemy-0cda3400.jpg",
    speech: { kind: "visual", reason: "Sleep- en combinatiespel; de elementen zijn visueel." },
  },
  {
    id: "memory",
    name: "Pokémon Memory",
    description: "Zoek de paren tussen de 151 Pokémon uit Generatie 1.",
    status: "available",
    to: "/memory",
    thumbnail: "/thumbnails/memory-144b9a2e.jpg",
    speech: { kind: "visual", reason: "Alleen de instructie; nog geen spraakcatalogus." },
  },
  {
    id: "pokemon-quiz",
    name: "Wie is deze Pokémon?",
    description: "Kies de juiste naam bij het plaatje. 3, 4 of 5 namen.",
    status: "available",
    to: "/raad",
    thumbnail: "/thumbnails/pokemon-quiz-0327a69d.jpg",
    speech: { kind: "pending", reason: "Buiten scope; later opnieuw bekijken." },
  },
  {
    id: "chess",
    name: "Schaken",
    description: "Leer de stukken, los puzzels op of speel een partij.",
    status: "available",
    to: "/schaken",
    thumbnail: "/thumbnails/chess-tutorial-6b1e58dd.jpg",
    speech: { kind: "group", folders: ["chess", "chess-puzzles"] },
  },
  {
    id: "flags",
    name: "Vlaggenreis",
    description: "Leer vlaggen én leg landen of provincies op de juiste plek.",
    status: "available",
    to: "/vlaggen",
    thumbnail: "/thumbnails/flags-bd19d257.jpg",
    speech: { kind: "pending", reason: "Optioneel; volgt later." },
  },
  {
    id: "french-listening",
    name: "Bonjour !",
    description: "Luister naar Frans en kies de juiste Nederlandse vertaling.",
    status: "available",
    to: "/frans",
    thumbnail: "/thumbnails/french-listening-ffc3da24.jpg",
    speech: { kind: "legacy", reason: "Heeft een eigen Franse audiospeler." },
  },
  {
    id: "letters",
    name: "Letterpret",
    description: "Hoor de klank, zoek de letter, bouw en lees woordjes.",
    status: "available",
    to: "/letters",
    thumbnail: "/thumbnails/letters-6b90ec8a.jpg",
    speech: { kind: "legacy", reason: "Heeft een eigen Nathalie-audiospeler." },
  },
];
