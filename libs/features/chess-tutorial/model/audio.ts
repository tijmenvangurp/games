import type { Color } from "chess.js";
import { getTexts } from "@shared/i18n";
import type { SpeechGroup, SpeechLine } from "@shared/lib";
import { TUTORIAL_LEVELS } from "./levels";
import { coachTexts, levelTexts } from "./texts";
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

const COACH = coachTexts.nl;

const CHESS_COACH_LINES = {
  stuck: line("coach-stuck", COACH.stuck),
  illegal: line("coach-illegal", COACH.illegal),
  hint: line("coach-hint", COACH.hint),
  movedTarget: line("coach-moved-target", COACH.movedTarget),
  movedFree: line("coach-moved-free", COACH.movedFree),
  selectedOpponent: line("coach-selected-opponent", COACH.selectedOpponent),
  selectedOwn: line("coach-selected-own", COACH.selectedOwn),
  successFallback: line("coach-success", COACH.successFallback),
  previewTap: line("coach-preview-tap", COACH.previewTap),
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
 * Eén bron, zodat een kind nooit iets anders hoort dan er staat. In het Engels
 * is er geen spraak; dan komt de tekst uit de Engelse lesteksten.
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
  const copy = getTexts(levelTexts)[level.id];
  const coach = getTexts(coachTexts);

  const terminal = (text: string, speech: SpeechLine): CoachSpeech => ({
    key,
    text,
    lines: [speech],
  });

  if (status === "completed") {
    const speech = levelSpeech.success ?? CHESS_COACH_LINES.successFallback;
    return terminal(copy.success ?? coach.successFallback, speech);
  }
  if (status === "stuck") {
    return terminal(coach.stuck, CHESS_COACH_LINES.stuck);
  }
  if (feedback === "illegal") {
    return terminal(coach.illegal, CHESS_COACH_LINES.illegal);
  }
  if (feedback === "hint") {
    return terminal(coach.hint, CHESS_COACH_LINES.hint);
  }
  if (feedback === "moved") {
    const fallback = level.targetSquare ? "movedTarget" : "movedFree";
    const speech = levelSpeech.nextStep ?? CHESS_COACH_LINES[fallback];
    return terminal(copy.nextStep ?? coach[fallback], speech);
  }
  if (preview) {
    const text = `${copy.preview} ${coach.previewTap}`;
    return { key, text, lines: [levelSpeech.preview, CHESS_COACH_LINES.previewTap] };
  }
  if (selectedSquare) {
    const choice = selectedColor === "b" ? "selectedOpponent" : "selectedOwn";
    return terminal(coach[choice], CHESS_COACH_LINES[choice]);
  }

  return terminal(copy.instruction, levelSpeech.instruction);
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
