import { defineTexts, type Texts } from "@shared/i18n";
import { TUTORIAL_LEVELS } from "./levels";
import type { TutorialLevelId } from "./types";

/** De zichtbare teksten van één les. */
interface LevelCopy {
  readonly title: string;
  readonly instruction: string;
  readonly preview: string;
  readonly explanation: string;
  readonly hint: string;
  readonly nextStep?: string;
  readonly success?: string;
}

/**
 * Lesteksten per taal. Het Nederlands staat in `TUTORIAL_LEVELS` (ook de bron van
 * de spraakregels); de opnames zijn alleen Nederlands, het Engels is alleen tekst.
 */
export const levelTexts: Texts<Readonly<Record<TutorialLevelId, LevelCopy>>> = {
  nl: TUTORIAL_LEVELS,
  en: {
    "rook-train": {
      title: "The Rook Train",
      instruction: "Drive the rook to the star.",
      preview: "Look! This is how the rook drives.",
      explanation:
        "The rook drives in straight lines: along the rows and the columns. It can't go diagonally.",
      hint: "Drag the rook along the lines, not diagonally.",
      nextStep: "Good! One more move to the star.",
      success: "Star! The rook drives in straight lines.",
    },
    "bishop-line": {
      title: "The Bishop's Path",
      instruction: "Glide the bishop to the star.",
      preview: "Look! This is how the bishop glides.",
      explanation: "The bishop only glides diagonally. It always stays on its own colour.",
      hint: "Drag the bishop diagonally across the board.",
      nextStep: "Good! Glide on to the star.",
      success: "Star! The bishop glides diagonally.",
    },
    "queen-dance": {
      title: "The Queen's Dance",
      instruction: "Dance with the queen to the star.",
      preview: "Look! The queen goes straight and diagonally.",
      explanation: "The queen can go straight and diagonally. That's why she's so strong.",
      hint: "First straight, then diagonally. Or the other way round.",
      nextStep: "Good! Dance on to the star.",
      success: "Star! The queen dances straight and diagonally.",
    },
    "knight-jump": {
      title: "The Knight's Jump",
      instruction: "Jump with the knight to the star.",
      preview: "Look! The knight jumps in an L.",
      explanation: "The knight jumps in an L: two squares to the side and one up.",
      hint: "Two squares to the side and one up.",
      nextStep: "Good! Jump on to the star.",
      success: "Star! The knight jumped in an L.",
    },
    "king-step": {
      title: "The King's Step",
      instruction: "Step with the king to the star.",
      preview: "Look! The king takes one step.",
      explanation: "The king takes one small step. He can go in any direction.",
      hint: "One square diagonally up.",
      nextStep: "Good! Step on to the star.",
      success: "Star! The king took one step.",
    },
    "pawn-crossing": {
      title: "Pawn Crossing",
      instruction: "Capture the pawn and walk to the star.",
      preview: "Look! Pawns capture diagonally.",
      explanation: "Pawns walk straight forward. They capture diagonally.",
      hint: "First capture diagonally, then go straight ahead.",
      nextStep: "Good! Now walk straight ahead to the star.",
      success: "Star! You captured diagonally and walked straight ahead.",
    },
    castling: {
      title: "Castling",
      instruction: "Drag the king two squares to the right.",
      preview: "Look! The king may move two squares to the right.",
      explanation:
        "When you castle, the king and the rook swap sides. You may do it when the way is clear.",
      hint: "Drag the king from e1 to g1.",
      success: "Castled! The king and the rook are safe.",
    },
    check: {
      title: "Giving Check",
      instruction: "Attack the black king.",
      preview: "Look! Which move attacks the king?",
      explanation: "Check means the king is being attacked. He has to escape or stop the attack.",
      hint: "Put the rook on the eighth row.",
      success: "Check! The king is under attack.",
    },
    checkmate: {
      title: "Checkmate",
      instruction: "Trap the king.",
      preview: "Look! Which move traps the king?",
      explanation: "Checkmate means the king is attacked and has nowhere left to go.",
      hint: "Put the queen next to the king.",
      success: "Checkmate! The king has nowhere left to go.",
    },
  },
};

/** De vaste zinnen van de coach. De Nederlandse kant is ook de tekst van de spraakregels. */
export const coachTexts = defineTexts(
  {
    stuck: "Oei! De rokade kan niet meer. Druk op Opnieuw.",
    illegal: "Die mag niet. Sleep naar een groene stip.",
    hint: "Kijk! Sleep naar de groene stip.",
    movedTarget: "Goed! Ga verder naar de ster.",
    movedFree: "Goed! Nog een zet.",
    selectedOpponent: "Kijk! Dit is een zwart stuk. Sleep je eigen stuk om te zetten.",
    selectedOwn: "Sleep naar een groene stip.",
    successFallback: "Ster! Knap gedaan.",
    previewTap: "Tik op het stuk om te kijken.",
  },
  {
    stuck: "Oops! Castling isn't possible any more. Press Start again.",
    illegal: "That's not allowed. Drag to a green dot.",
    hint: "Look! Drag to the green dot.",
    movedTarget: "Good! Keep going to the star.",
    movedFree: "Good! One more move.",
    selectedOpponent: "Look! This is a black piece. Drag your own piece to move.",
    selectedOwn: "Drag to a green dot.",
    successFallback: "Star! Well done.",
    previewTap: "Tap the piece to have a look.",
  },
);
