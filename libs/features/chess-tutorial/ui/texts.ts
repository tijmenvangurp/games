import { defineTexts } from "@shared/i18n";

/** Teksten van het lesbord. De lesteksten zelf staan in `model/texts.ts`. */
export const tutorialTexts = defineTexts(
  {
    lessonOf: (number: number, total: number) => `Les ${number} van ${total}`,
    chooseLesson: "Kies een les",
    chooseChessLesson: "Kies een schaakles",
    lessonButton: (number: number, title: string) => `Les ${number}: ${title}`,
    board: (goal: string) =>
      `Schaakbord met coördinaten a tot en met h en 1 tot en met 8. Tik op een stuk om te kijken waar het heen kan. Sleep een stuk om te zetten. ${goal}`,
    listenCoach: "Beluister de coach",
    look: "Kijk",
    showMove: "Toon zet",
    reset: "Opnieuw",
    nextLesson: "Volgende les",
    goals: {
      check: "Doel: de zwarte koning schaak zetten.",
      checkmate: "Doel: de zwarte koning schaakmat zetten.",
      "castle-kingside": "Doel: rokade, de koning naar g1.",
      "castle-queenside": "Doel: rokade, de koning naar c1.",
    },
    starGoal: (square: string) => `Doel: de ster op ${square}.`,
    why: "Waarom?",
    listenExplanation: "Beluister de uitleg",
    listenTip: "Beluister de tip",
    tip: (hint: string) => `Tip: ${hint}`,
  },
  {
    lessonOf: (number: number, total: number) => `Lesson ${number} of ${total}`,
    chooseLesson: "Choose a lesson",
    chooseChessLesson: "Choose a chess lesson",
    lessonButton: (number: number, title: string) => `Lesson ${number}: ${title}`,
    board: (goal: string) =>
      `Chessboard with coordinates a to h and 1 to 8. Tap a piece to see where it can go. Drag a piece to move it. ${goal}`,
    listenCoach: "Listen to the coach",
    look: "Look",
    showMove: "Show move",
    reset: "Start again",
    nextLesson: "Next lesson",
    goals: {
      check: "Goal: put the black king in check.",
      checkmate: "Goal: checkmate the black king.",
      "castle-kingside": "Goal: castle, with the king to g1.",
      "castle-queenside": "Goal: castle, with the king to c1.",
    },
    starGoal: (square: string) => `Goal: the star on ${square}.`,
    why: "Why?",
    listenExplanation: "Listen to the explanation",
    listenTip: "Listen to the tip",
    tip: (hint: string) => `Tip: ${hint}`,
  },
);
