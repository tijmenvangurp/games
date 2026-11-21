import { defineTexts } from "@shared/i18n";
import { PROMPTS, PUZZLE_STATUS_LINES, PUZZLE_TITLES } from "../model/audio";
import { PUZZLE_DIFFICULTIES } from "../model/types";

const [EASY, MEDIUM, HARD] = PUZZLE_DIFFICULTIES;

/**
 * Teksten van de schaakpuzzels. De Nederlandse kant komt uit de spraakcatalogus,
 * zodat het kind ziet wat het hoort; de opnames zelf zijn alleen Nederlands.
 */
export const puzzleTexts = defineTexts(
  {
    titles: {
      mate: PUZZLE_TITLES.mate.text,
      capture: PUZZLE_TITLES.capture.text,
      tactic: PUZZLE_TITLES.tactic.text,
    },
    prompts: {
      mate: { w: PROMPTS.mate.w.text, b: PROMPTS.mate.b.text },
      capture: { w: PROMPTS.capture.w.text, b: PROMPTS.capture.b.text },
      tactic: { w: PROMPTS.tactic.w.text, b: PROMPTS.tactic.b.text },
    },
    status: {
      solvedMate: PUZZLE_STATUS_LINES.solvedMate.text,
      solvedCapture: PUZZLE_STATUS_LINES.solvedCapture.text,
      solvedTactic: PUZZLE_STATUS_LINES.solvedTactic.text,
      wrong: PUZZLE_STATUS_LINES.wrong.text,
      correct: PUZZLE_STATUS_LINES.correct.text,
      opponent: PUZZLE_STATUS_LINES.opponent.text,
      idle: PUZZLE_STATUS_LINES.idle.text,
    },
    difficulties: { easy: EASY.label, medium: MEDIUM.label, hard: HARD.label },
    chooseDifficulty: "Kies een moeilijkheidsgraad",
    puzzleOf: (number: number, total: number) => `Puzzel ${number} van ${total}`,
    listenPrompt: "Beluister de opdracht",
    listenFeedback: "Beluister de feedback",
    board:
      "Schaakbord met coördinaten a tot en met h en 1 tot en met 8. Tik op een stuk om te kijken waar het heen kan. Sleep een stuk om te zetten.",
    hint: "Hint",
    reset: "Opnieuw",
    overview: "Overzicht",
    nextPuzzle: "Volgende puzzel",
    choosePuzzle: "Kies een puzzel",
    solvedCount: (solved: number, total: number) => `${solved} van ${total} opgelost`,
    progress: "Voortgang",
    again: "Nog een keer",
    continue: "Verder",
    puzzleButton: (number: number, done: boolean) =>
      `Puzzel ${number}${done ? ", opgelost" : ", nog niet opgelost"}`,
  },
  {
    titles: {
      mate: "Give checkmate!",
      capture: "Win a piece!",
      tactic: "Find the best move!",
    },
    prompts: {
      mate: {
        w: "You are white. Checkmate the black king.",
        b: "You are black. Checkmate the white king.",
      },
      capture: {
        w: "You are white. Which move wins a piece?",
        b: "You are black. Which move wins a piece?",
      },
      tactic: {
        w: "You are white. Which move is the best?",
        b: "You are black. Which move is the best?",
      },
    },
    status: {
      solvedMate: "Checkmate! Well done.",
      solvedCapture: "You did it! You won a piece.",
      solvedTactic: "You did it! You found the best move.",
      wrong: "That isn't the best move. Try again.",
      correct: "Well done! Your opponent has answered. It's your turn again.",
      opponent: "Look! This piece belongs to your opponent. Drag your own piece to move.",
      idle: "Tap a piece to see where it can go. Drag your piece to a green dot.",
    },
    difficulties: { easy: "Easy", medium: "Tricky", hard: "Challenging" },
    chooseDifficulty: "Choose a difficulty",
    puzzleOf: (number: number, total: number) => `Puzzle ${number} of ${total}`,
    listenPrompt: "Listen to the task",
    listenFeedback: "Listen to the feedback",
    board:
      "Chessboard with coordinates a to h and 1 to 8. Tap a piece to see where it can go. Drag a piece to move it.",
    hint: "Hint",
    reset: "Start again",
    overview: "Overview",
    nextPuzzle: "Next puzzle",
    choosePuzzle: "Choose a puzzle",
    solvedCount: (solved: number, total: number) => `${solved} of ${total} solved`,
    progress: "Progress",
    again: "Play again",
    continue: "Continue",
    puzzleButton: (number: number, done: boolean) =>
      `Puzzle ${number}${done ? ", solved" : ", not solved yet"}`,
  },
);
