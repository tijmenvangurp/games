import { TUTORIAL_LEVEL_IDS, type TutorialLevel, type TutorialLevelId } from "./types";

/**
 * De level-FEN's bevatten expres alleen de lesstukken, zonder koningen.
 * De engine laadt ze daarom met `skipValidation`; elke zet wordt wél volledig
 * door chess.js gevalideerd.
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
} as const satisfies Record<TutorialLevelId, TutorialLevel>;

export function levelFor(levelId: TutorialLevelId): TutorialLevel {
  return TUTORIAL_LEVELS[levelId];
}

export function nextLevelId(levelId: TutorialLevelId): TutorialLevelId | null {
  const index = TUTORIAL_LEVEL_IDS.indexOf(levelId);
  return TUTORIAL_LEVEL_IDS[index + 1] ?? null;
}
