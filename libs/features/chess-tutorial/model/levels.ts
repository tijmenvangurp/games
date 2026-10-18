import { TUTORIAL_LEVEL_IDS, type TutorialLevel, type TutorialLevelId } from "./types";

/**
 * De eenvoudige stuklessen bevatten expres geen koningen, zodat alleen het
 * lesstuk zichtbaar is. De engine laadt die stellingen met `skipValidation`;
 * elke zet wordt wél volledig door chess.js gevalideerd. De lessen met rokade,
 * schaak en schaakmat hebben juist wel koningen.
 */
export const TUTORIAL_LEVELS = {
  "rook-train": {
    id: "rook-train",
    title: "De Toren-trein",
    description: "De toren rijdt alleen rechtdoor. Breng hem naar de ster op e5.",
    initialFen: "8/8/8/8/8/8/8/7R w - - 0 1",
    targetSquare: "e5",
    playerPiece: "r",
    hint: "Sleep de toren over de lijnen. Hij mag niet schuin.",
    minimumMoves: 2,
  },
  "bishop-line": {
    id: "bishop-line",
    title: "De Loperlijn",
    description: "De loper gaat alleen schuin. Breng hem naar de ster op h6.",
    initialFen: "8/8/8/8/8/8/8/2B5 w - - 0 1",
    targetSquare: "h6",
    playerPiece: "b",
    hint: "Sleep de loper schuin over het bord.",
    minimumMoves: 1,
  },
  "queen-dance": {
    id: "queen-dance",
    title: "De Dame-dans",
    description: "De dame mag recht en schuin. Breng haar in twee zetten naar e5.",
    initialFen: "8/8/8/8/8/8/8/3Q4 w - - 0 1",
    targetSquare: "e5",
    playerPiece: "q",
    hint: "Eerst recht, dan schuin. Of andersom.",
    minimumMoves: 2,
  },
  "knight-jump": {
    id: "knight-jump",
    title: "De Paardensprong",
    description: "Het paard springt in een L. Spring naar de ster op d2.",
    initialFen: "8/8/8/8/8/8/8/1N6 w - - 0 1",
    targetSquare: "d2",
    playerPiece: "n",
    hint: "Twee stapjes opzij en één omhoog. Probeer het eens!",
    minimumMoves: 1,
  },
  "king-step": {
    id: "king-step",
    title: "De Koningsstap",
    description: "De koning zet één stap. Ga naar de ster op d2.",
    initialFen: "8/8/8/8/8/8/8/4K3 w - - 0 1",
    targetSquare: "d2",
    playerPiece: "k",
    hint: "Eén vakje schuin omhoog.",
    minimumMoves: 1,
  },
  "pawn-crossing": {
    id: "pawn-crossing",
    title: "Pionnen-oversteek",
    description:
      "Pionnen lopen recht vooruit en slaan schuin. Sla de pion op d3 en loop naar de ster op d4.",
    initialFen: "8/8/8/8/8/1p1p4/P3P3/8 w - - 0 1",
    targetSquare: "d4",
    playerPiece: "p",
    hint: "Eerst schuin slaan, dan rechtdoor naar de ster.",
    minimumMoves: 2,
  },
  castling: {
    id: "castling",
    title: "Rokade",
    description: "De koning en toren wisselen van plek. Zet de koning op g1.",
    initialFen: "4k3/8/8/8/8/8/8/4K2R w K - 0 1",
    targetSquare: "g1",
    playerPiece: "k",
    hint: "Sleep de koning twee vakken naar rechts.",
    minimumMoves: 1,
    goal: "castle-kingside",
  },
  check: {
    id: "check",
    title: "Schaak zetten",
    description: "Zet de zwarte koning schaak met de toren.",
    initialFen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1",
    playerPiece: "r",
    hint: "Zet de toren op de achtste rij.",
    goal: "check",
  },
  checkmate: {
    id: "checkmate",
    title: "Schaakmat",
    description: "Zet de zwarte koning schaakmat met de dame.",
    initialFen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1",
    playerPiece: "q",
    hint: "De dame moet naast de koning komen.",
    goal: "checkmate",
  },
} as const satisfies Record<TutorialLevelId, TutorialLevel>;

export function levelFor(levelId: TutorialLevelId): TutorialLevel {
  return TUTORIAL_LEVELS[levelId];
}

export function nextLevelId(levelId: TutorialLevelId): TutorialLevelId | null {
  const index = TUTORIAL_LEVEL_IDS.indexOf(levelId);
  return TUTORIAL_LEVEL_IDS[index + 1] ?? null;
}
