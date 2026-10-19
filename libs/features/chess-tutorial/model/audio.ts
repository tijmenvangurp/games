import type { Color } from "chess.js";
import type { SpeechGroup, SpeechLine } from "@shared/lib";
import { TUTORIAL_LEVELS } from "./levels";
import type {
  TutorialFeedback,
  TutorialLevel,
  TutorialLevelId,
  TutorialPreview,
  TutorialStatus,
} from "./types";

const FOLDER = "chess";

function line(id: string, text: string, audioText?: string): SpeechLine {
  const spoken = audioText ?? AUDIO_TEXT_OVERRIDES[id];
  return { folder: FOLDER, id, text, ...(spoken ? { audioText: spoken } : {}) };
}

const AUDIO_TEXT_OVERRIDES: Readonly<Record<string, string>> = {
  "castling-hint": "Sleep de koning van e één naar g één.",
};

const CHESS_COACH_LINES = {
  stuck: line("coach-stuck", "Oei! De rokade kan niet meer. Druk op Opnieuw."),
  illegal: line("coach-illegal", "Die mag niet. Sleep naar een groene stip."),
  hint: line("coach-hint", "Kijk! Sleep naar de groene stip."),
  movedTarget: line("coach-moved-target", "Goed! Ga verder naar de ster."),
  movedFree: line("coach-moved-free", "Goed! Nog een zet."),
  selectedOpponent: line(
    "coach-selected-opponent",
    "Kijk! Dit is een zwart stuk. Sleep je eigen stuk om te zetten.",
  ),
  selectedOwn: line("coach-selected-own", "Sleep naar een groene stip."),
  successFallback: line("coach-success", "Ster! Knap gedaan."),
  previewTap: line("coach-preview-tap", "Tik op het stuk om te kijken."),
} as const;

interface LevelSpeech {
  readonly instruction: SpeechLine;
  readonly preview: SpeechLine;
  readonly explanation: SpeechLine;
  readonly hint: SpeechLine;
  readonly nextStep?: SpeechLine;
  readonly success?: SpeechLine;
}

const LEVEL_SPEECH = {} as Record<TutorialLevelId, LevelSpeech>;
for (const level of Object.values(TUTORIAL_LEVELS) as readonly TutorialLevel[]) {
  LEVEL_SPEECH[level.id] = {
    instruction: line(`${level.id}-instruction`, level.instruction),
    preview: line(`${level.id}-preview`, level.preview),
    explanation: line(`${level.id}-explanation`, level.explanation),
    hint: line(`${level.id}-hint`, level.hint),
    ...(level.nextStep ? { nextStep: line(`${level.id}-next-step`, level.nextStep) } : {}),
    ...(level.success ? { success: line(`${level.id}-success`, level.success) } : {}),
  };
}

export const CHESS_LEVEL_LINES: Readonly<Record<TutorialLevelId, LevelSpeech>> = LEVEL_SPEECH;

export interface CoachSpeech {
  readonly key: string;
  readonly text: string;
  readonly lines: readonly SpeechLine[];
}

function coachKey(
  level: TutorialLevel,
  feedback: TutorialFeedback,
  preview: TutorialPreview | null,
  selectedColor: Color | null,
  selectedSquare: string | null,
  status: TutorialStatus,
  moveCount: number,
): string {
  return [
    level.id,
    status,
    feedback,
    preview ? "preview" : "task",
    selectedColor ?? "",
    selectedSquare ?? "",
    moveCount,
  ].join(":");
}

/**
 * Dezelfde tekst die de coachbubbel toont en de spraakregels die daarbij horen.
 * Eén bron, zodat een kind nooit iets anders hoort dan er staat.
 */
export function coachSpeechFor(
  level: TutorialLevel,
  feedback: TutorialFeedback,
  preview: TutorialPreview | null,
  selectedColor: Color | null,
  selectedSquare: string | null,
  status: TutorialStatus,
  moveCount: number,
): CoachSpeech {
  const key = coachKey(level, feedback, preview, selectedColor, selectedSquare, status, moveCount);
  const levelSpeech = CHESS_LEVEL_LINES[level.id];

  const terminal = (text: string, speech: SpeechLine): CoachSpeech => ({
    key,
    text,
    lines: [speech],
  });

  if (status === "completed") {
    const speech = levelSpeech.success ?? CHESS_COACH_LINES.successFallback;
    return terminal(level.success ?? speech.text, speech);
  }
  if (status === "stuck") {
    return terminal(CHESS_COACH_LINES.stuck.text, CHESS_COACH_LINES.stuck);
  }
  if (feedback === "illegal") {
    return terminal(CHESS_COACH_LINES.illegal.text, CHESS_COACH_LINES.illegal);
  }
  if (feedback === "hint") {
    return terminal(CHESS_COACH_LINES.hint.text, CHESS_COACH_LINES.hint);
  }
  if (feedback === "moved") {
    const fallback = level.targetSquare
      ? CHESS_COACH_LINES.movedTarget
      : CHESS_COACH_LINES.movedFree;
    const speech = levelSpeech.nextStep ?? fallback;
    return terminal(speech.text, speech);
  }
  if (preview) {
    const text = `${level.preview} ${CHESS_COACH_LINES.previewTap.text}`;
    return { key, text, lines: [levelSpeech.preview, CHESS_COACH_LINES.previewTap] };
  }
  if (selectedSquare) {
    const speech =
      selectedColor === "b" ? CHESS_COACH_LINES.selectedOpponent : CHESS_COACH_LINES.selectedOwn;
    return terminal(speech.text, speech);
  }

  return terminal(levelSpeech.instruction.text, levelSpeech.instruction);
}

const allLevelLines = Object.values(CHESS_LEVEL_LINES).flatMap((speech) => [
  speech.instruction,
  speech.preview,
  speech.explanation,
  speech.hint,
  ...(speech.nextStep ? [speech.nextStep] : []),
  ...(speech.success ? [speech.success] : []),
]);

export const speechGroups = [
  {
    folder: FOLDER,
    lines: [...Object.values(CHESS_COACH_LINES), ...allLevelLines],
  },
] satisfies readonly SpeechGroup[];
