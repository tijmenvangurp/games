import type { Color } from "chess.js";
import type { SpeechGroup, SpeechLine } from "@shared/lib";
import type { PuzzleFeedback, PuzzleKind, PuzzleStatus } from "./types";

const FOLDER = "chess-puzzles";

function line(id: string, text: string): SpeechLine {
  return { folder: FOLDER, id, text };
}

const PUZZLE_TITLES: Record<PuzzleKind, SpeechLine> = {
  mate: line("puzzle-mate-title", "Zet schaakmat!"),
  capture: line("puzzle-capture-title", "Win een stuk!"),
  tactic: line("puzzle-tactic-title", "Vind de beste zet!"),
};

const PROMPTS: Record<PuzzleKind, Record<"w" | "b", SpeechLine>> = {
  mate: {
    w: line("puzzle-mate-w", "Je bent wit. Zet de zwarte koning schaakmat."),
    b: line("puzzle-mate-b", "Je bent zwart. Zet de witte koning schaakmat."),
  },
  capture: {
    w: line("puzzle-capture-w", "Je bent wit. Welke zet wint een stuk?"),
    b: line("puzzle-capture-b", "Je bent zwart. Welke zet wint een stuk?"),
  },
  tactic: {
    w: line("puzzle-tactic-w", "Je bent wit. Welke zet is de beste?"),
    b: line("puzzle-tactic-b", "Je bent zwart. Welke zet is de beste?"),
  },
};

const PUZZLE_STATUS_LINES = {
  solvedMate: line("puzzle-solved-mate", "Schaakmat! Knap gedaan."),
  solvedCapture: line("puzzle-solved-capture", "Gelukt! Je hebt een stuk gewonnen."),
  solvedTactic: line("puzzle-solved-tactic", "Gelukt! Je hebt de beste zet gevonden."),
  wrong: line("puzzle-wrong", "Die zet is niet de beste. Probeer nog eens."),
  correct: line("puzzle-correct", "Goed zo! De tegenstander heeft geantwoord. Jij mag weer."),
  opponent: line(
    "puzzle-opponent",
    "Kijk! Dit stuk is van de tegenstander. Sleep je eigen stuk om te zetten.",
  ),
  idle: line(
    "puzzle-idle",
    "Tik op een stuk om te kijken waar het heen kan. Sleep je stuk naar een groene stip.",
  ),
} as const;

export function puzzleTitleSpeech(kind: PuzzleKind): SpeechLine {
  return PUZZLE_TITLES[kind];
}

export function puzzlePromptSpeech(kind: PuzzleKind, color: "w" | "b"): SpeechLine {
  return PROMPTS[kind][color];
}

export function puzzleStatusSpeech(
  feedback: PuzzleFeedback,
  kind: PuzzleKind,
  status: PuzzleStatus,
  playerColor: Color,
  selectedColor: Color | null,
): SpeechLine {
  if (status === "solved") {
    if (kind === "mate") {
      return PUZZLE_STATUS_LINES.solvedMate;
    }
    if (kind === "capture") {
      return PUZZLE_STATUS_LINES.solvedCapture;
    }
    return PUZZLE_STATUS_LINES.solvedTactic;
  }
  if (feedback === "wrong") {
    return PUZZLE_STATUS_LINES.wrong;
  }
  if (feedback === "correct") {
    return PUZZLE_STATUS_LINES.correct;
  }
  if (selectedColor && selectedColor !== playerColor) {
    return PUZZLE_STATUS_LINES.opponent;
  }
  return PUZZLE_STATUS_LINES.idle;
}

export const speechGroups = [
  {
    folder: FOLDER,
    lines: [
      ...Object.values(PUZZLE_TITLES),
      ...Object.values(PROMPTS).flatMap((prompts) => Object.values(prompts)),
      ...Object.values(PUZZLE_STATUS_LINES),
    ],
  },
] satisfies readonly SpeechGroup[];
