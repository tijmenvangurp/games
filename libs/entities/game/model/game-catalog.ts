export type GameCategory = "puzzel" | "taal-rekenen" | "spel" | "ontdekken";

export const GAME_CATEGORIES: readonly { readonly id: GameCategory; readonly label: string }[] = [
  { id: "puzzel", label: "Puzzel & Logica" },
  { id: "taal-rekenen", label: "Taal & Rekenen" },
  { id: "spel", label: "Bord & Geheugen" },
  { id: "ontdekken", label: "Ontdekken" },
];

export type GameId =
  | "sudoku"
  | "math-trainer"
  | "arrows"
  | "seek"
  | "word-search"
  | "alchemy"
  | "draaiwerk"
  | "memory"
  | "pokemon-quiz"
  | "chess"
  | "flags"
  | "french-listening"
  | "letters"
  | "four-in-a-row"
  | "ganzenbord"
  | "typepret"
  | "murdoku";

interface GameCatalogBase {
  id: GameId;
  name: string;
  description: string;
  category: GameCategory;
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
          | "/draaiwerk"
          | "/frans"
          | "/letters"
          | "/vlaggen"
          | "/vier-op-een-rij"
          | "/ganzenbord"
          | "/typepret"
          | "/mysterie";
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
    category: "puzzel",
    status: "available",
    to: "/sudoku",
    thumbnail: "/thumbnails/sudoku-e4fcab84.jpg",
    speech: { kind: "visual", reason: "Het bord en de symbolen zijn visueel." },
  },
  {
    id: "math-trainer",
    name: "Tafel Topper",
    description: "Oefen plus, min, keer en deel. Verdien sterren.",
    category: "taal-rekenen",
    status: "available",
    to: "/rekenen",
    thumbnail: "/thumbnails/math-trainer-da25caae.jpg",
    speech: { kind: "group", folders: ["math"] },
  },
  {
    id: "arrows",
    name: "Pijlen",
    description: "Haal alle pijlen weg zonder dat ze tegen elkaar botsen.",
    category: "puzzel",
    status: "available",
    to: "/pijlen",
    thumbnail: "/thumbnails/arrows-a4ec6b93.jpg",
    speech: { kind: "visual", reason: "De pijlen en het bord zijn visueel." },
  },
  {
    id: "seek",
    name: "Waar is Wobbel?",
    description: "Zoek het monstertje met de ster tussen alle andere Wobbels.",
    category: "puzzel",
    status: "available",
    to: "/zoeken",
    thumbnail: "/thumbnails/seek-f83e0e6c.jpg",
    speech: { kind: "visual", reason: "Het zoekveld is visueel." },
  },
  {
    id: "word-search",
    name: "Woordzoeker",
    description: "Zoek woorden in de tuin, onder water of tussen de Pokémon.",
    category: "taal-rekenen",
    status: "available",
    to: "/woordzoeker",
    thumbnail: "/thumbnails/word-search-5e025073.jpg",
    speech: { kind: "group", folders: ["words"] },
  },
  {
    id: "alchemy",
    name: "Mengelmoes",
    description: "Sleep elementen op elkaar en ontdek wat er ontstaat.",
    category: "ontdekken",
    status: "available",
    to: "/mengelmoes",
    thumbnail: "/thumbnails/alchemy-c3cbcc1c.jpg",
    speech: { kind: "visual", reason: "Sleep- en combinatiespel; de elementen zijn visueel." },
  },
  {
    id: "draaiwerk",
    name: "Draaiwerk",
    description: "Verbind tandwielen, riemen en kettingen. Laat de lamp branden en de lift omhoog.",
    category: "puzzel",
    status: "available",
    to: "/draaiwerk",
    thumbnail: "/thumbnails/draaiwerk-51030cb3.jpg",
    speech: { kind: "visual", reason: "Het bord, de tandwielen en de beweging zijn visueel." },
  },
  {
    id: "memory",
    name: "Pokémon Memory",
    description: "Zoek de paren tussen de 151 Pokémon uit Generatie 1.",
    category: "spel",
    status: "available",
    to: "/memory",
    thumbnail: "/thumbnails/memory-05209404.jpg",
    speech: { kind: "visual", reason: "Alleen de instructie; nog geen spraakcatalogus." },
  },
  {
    id: "pokemon-quiz",
    name: "Wie is deze Pokémon?",
    description: "Kies de juiste naam bij het plaatje. 3, 4 of 5 namen.",
    category: "ontdekken",
    status: "available",
    to: "/raad",
    thumbnail: "/thumbnails/pokemon-quiz-8337dbba.jpg",
    speech: { kind: "pending", reason: "Buiten scope; later opnieuw bekijken." },
  },
  {
    id: "chess",
    name: "Schaken",
    description: "Leer de stukken, los puzzels op of speel een partij.",
    category: "spel",
    status: "available",
    to: "/schaken",
    thumbnail: "/thumbnails/chess-tutorial-5b0b4ee9.jpg",
    speech: { kind: "group", folders: ["chess", "chess-puzzles"] },
  },
  {
    id: "flags",
    name: "Vlaggenreis",
    description: "Leer vlaggen én leg landen of provincies op de juiste plek.",
    category: "ontdekken",
    status: "available",
    to: "/vlaggen",
    thumbnail: "/thumbnails/flags-5d95e955.jpg",
    speech: { kind: "pending", reason: "Optioneel; volgt later." },
  },
  {
    id: "french-listening",
    name: "Bonjour !",
    description: "Luister naar Frans en kies de juiste Nederlandse vertaling.",
    category: "taal-rekenen",
    status: "available",
    to: "/frans",
    thumbnail: "/thumbnails/french-listening-04c12487.jpg",
    speech: { kind: "legacy", reason: "Heeft een eigen Franse audiospeler." },
  },
  {
    id: "letters",
    name: "Letterpret",
    description: "Hoor de klank, zoek de letter, bouw en lees woordjes.",
    category: "taal-rekenen",
    status: "available",
    to: "/letters",
    thumbnail: "/thumbnails/letters-c2cbac01.jpg",
    speech: { kind: "legacy", reason: "Heeft een eigen Nathalie-audiospeler." },
  },
  {
    id: "four-in-a-row",
    name: "Vier op een Rij",
    description: "Maak vier op een rij, samen of tegen de computer.",
    category: "spel",
    status: "available",
    to: "/vier-op-een-rij",
    thumbnail: "/thumbnails/four-in-a-row-4f16fd00.jpg",
    speech: { kind: "visual", reason: "Het bord en de schijven zijn visueel." },
  },
  {
    id: "ganzenbord",
    name: "Ganzenbord",
    description: "Gooi met de dobbelstenen en race met je gans naar 63.",
    category: "spel",
    status: "available",
    to: "/ganzenbord",
    thumbnail: "/thumbnails/ganzenbord-2bd2a083.jpg",
    speech: {
      kind: "visual",
      reason: "Het bord, de dobbelsteen en de ganzepionnen zijn visueel.",
    },
  },
  {
    id: "typepret",
    name: "Typepret",
    description: "Leer blind typen: vinger op de basisrij en tik de letter die oplicht.",
    category: "taal-rekenen",
    status: "available",
    to: "/typepret",
    thumbnail: "/thumbnails/typepret-4931ec16.jpg",
    speech: {
      kind: "visual",
      reason: "Het toetsenbord en de doeltekens zijn visueel.",
    },
  },
  {
    id: "murdoku",
    name: "Wie was het?",
    description:
      "Lees de aanwijzingen, vul de plattegrond in en vind de dief die als enige bij de buit was.",
    category: "puzzel",
    status: "available",
    to: "/mysterie",
    thumbnail: "/thumbnails/wie-was-het-c4330a6d.jpg",
    speech: {
      kind: "visual",
      reason: "De plattegrond, de portretten en de aanwijzingen zijn visueel.",
    },
  },
];
