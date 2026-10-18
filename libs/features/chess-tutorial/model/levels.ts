import { TUTORIAL_LEVEL_IDS, type TutorialLevel, type TutorialLevelId } from "./types";

/**
 * De eenvoudige stuklessen bevatten expres geen koningen, zodat alleen het
 * lesstuk zichtbaar is. De engine laadt die stellingen met `skipValidation`;
 * elke zet wordt wél volledig door chess.js gevalideerd. De lessen met rokade,
 * schaak en schaakmat hebben juist wel koningen.
 *
 * Elke les heeft één korte opdracht. De langere uitleg staat in `explanation`
 * en `hint`; de UI toont die alleen achter "Waarom?".
 */
export const TUTORIAL_LEVELS = {
  "rook-train": {
    id: "rook-train",
    title: "De Toren-trein",
    instruction: "Rijd met de toren naar de ster.",
    preview: "Kijk! Zo rijdt de toren.",
    explanation: "De toren rijdt recht: over de rijen en de lijnen. Hij mag niet schuin.",
    initialFen: "8/8/8/8/8/8/8/7R w - - 0 1",
    targetSquare: "e5",
    playerPiece: "r",
    hint: "Sleep de toren over de lijnen, niet schuin.",
    nextStep: "Goed! Nog één zet naar de ster.",
    success: "Ster! De toren rijdt recht.",
    minimumMoves: 2,
  },
  "bishop-line": {
    id: "bishop-line",
    title: "De Loperlijn",
    instruction: "Glijd met de loper naar de ster.",
    preview: "Kijk! Zo glijdt de loper.",
    explanation: "De loper glijdt alleen schuin. Hij blijft op zijn eigen kleur.",
    initialFen: "8/8/8/8/8/8/8/2B5 w - - 0 1",
    targetSquare: "e5",
    playerPiece: "b",
    hint: "Sleep de loper schuin over het bord.",
    nextStep: "Goed! Glijd verder naar de ster.",
    success: "Ster! De loper glijdt schuin.",
    minimumMoves: 2,
  },
  "queen-dance": {
    id: "queen-dance",
    title: "De Dame-dans",
    instruction: "Dans met de dame naar de ster.",
    preview: "Kijk! De dame gaat recht en schuin.",
    explanation: "De dame mag recht én schuin. Daarom is ze zo sterk.",
    initialFen: "8/8/8/8/8/8/8/3Q4 w - - 0 1",
    targetSquare: "e5",
    playerPiece: "q",
    hint: "Eerst recht, dan schuin. Of andersom.",
    nextStep: "Goed! Dans verder naar de ster.",
    success: "Ster! De dame danst recht en schuin.",
    minimumMoves: 2,
  },
  "knight-jump": {
    id: "knight-jump",
    title: "De Paardensprong",
    instruction: "Spring met het paard naar de ster.",
    preview: "Kijk! Het paard springt in een L.",
    explanation: "Het paard springt in een L: twee stapjes opzij en één omhoog.",
    initialFen: "8/8/8/8/8/8/8/1N6 w - - 0 1",
    targetSquare: "c4",
    playerPiece: "n",
    hint: "Twee stapjes opzij en één omhoog.",
    nextStep: "Goed! Spring verder naar de ster.",
    success: "Ster! Het paard sprong in een L.",
    minimumMoves: 2,
  },
  "king-step": {
    id: "king-step",
    title: "De Koningsstap",
    instruction: "Stap met de koning naar de ster.",
    preview: "Kijk! De koning zet één stap.",
    explanation: "De koning zet één stapje. Hij mag alle kanten op.",
    initialFen: "8/8/8/8/8/8/8/4K3 w - - 0 1",
    targetSquare: "c3",
    playerPiece: "k",
    hint: "Eén vakje schuin omhoog.",
    nextStep: "Goed! Stap verder naar de ster.",
    success: "Ster! De koning zette één stap.",
    minimumMoves: 2,
  },
  "pawn-crossing": {
    id: "pawn-crossing",
    title: "Pionnen-oversteek",
    instruction: "Sla de pion en loop naar de ster.",
    preview: "Kijk! Pionnen slaan schuin.",
    explanation: "Pionnen lopen recht vooruit. Slaan doen ze schuin.",
    // De zwarte pion op e3 blokkeert recht vooruit; alleen de slag naar d3
    // blijft over. Zo kan het kind niet vastlopen na een keuze.
    initialFen: "8/8/8/8/8/3pp3/4P3/8 w - - 0 1",
    targetSquare: "d4",
    playerPiece: "p",
    hint: "Eerst schuin slaan, dan rechtdoor.",
    nextStep: "Goed! Loop nu rechtdoor naar de ster.",
    success: "Ster! Je sloeg schuin en liep rechtdoor.",
    minimumMoves: 2,
  },
  castling: {
    id: "castling",
    title: "Rokade",
    instruction: "Sleep de koning twee vakken naar rechts.",
    preview: "Kijk! De koning mag twee vakken naar rechts.",
    explanation: "Bij rokade wisselen de koning en de toren van plek. Dat mag als de weg vrij is.",
    initialFen: "4k3/8/8/8/8/8/8/4K2R w K - 0 1",
    targetSquare: "g1",
    playerPiece: "k",
    hint: "Sleep de koning van e1 naar g1.",
    success: "Rokade! Koning en toren zijn veilig.",
    minimumMoves: 1,
    goal: "castle-kingside",
  },
  check: {
    id: "check",
    title: "Schaak zetten",
    instruction: "Val de zwarte koning aan.",
    preview: "Kijk! Welke zet valt de koning aan?",
    explanation:
      "Schaak betekent: de koning wordt aangevallen. Hij moet vluchten of de aanval stoppen.",
    initialFen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1",
    playerPiece: "r",
    hint: "Zet de toren op de achtste rij.",
    success: "Schaak! De koning wordt aangevallen.",
    goal: "check",
  },
  checkmate: {
    id: "checkmate",
    title: "Schaakmat",
    instruction: "Sluit de koning in.",
    preview: "Kijk! Welke zet sluit de koning in?",
    explanation: "Schaakmat betekent: de koning wordt aangevallen en kan nergens meer naartoe.",
    initialFen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1",
    playerPiece: "q",
    hint: "Zet de dame naast de koning.",
    success: "Schaakmat! De koning kan nergens meer heen.",
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
