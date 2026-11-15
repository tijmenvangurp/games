import {
  MATH_LINES,
  mathFeedbackSpeech,
  mathQuestionSpeech,
  type MathQuestion,
  type MathRound,
} from "@entities/math";
import { useAutoSpeech } from "@shared/lib";

interface MathSpeechInput {
  readonly round: MathRound | null;
  readonly question: MathQuestion | undefined;
  readonly answered: boolean;
  readonly correct: boolean;
  readonly wrongChoices: readonly number[];
}

/**
 * Houdt de automatische spraak voor rekenen buiten het scherm. De sleutel
 * bevat het rondeseed, zodat de eerste som van een nieuwe ronde opnieuw klinkt.
 */
export function useMathSpeech({
  round,
  question,
  answered,
  correct,
  wrongChoices,
}: MathSpeechInput): void {
  const seed = round?.seed ?? "geen";
  useAutoSpeech(
    question ? `math-question-${seed}-${question.id}` : "math-question-none",
    question ? mathQuestionSpeech(question) : null,
  );
  useAutoSpeech(
    question
      ? `math-feedback-${seed}-${question.id}-${answered}-${correct}-${wrongChoices.length}`
      : "math-feedback-none",
    question
      ? answered
        ? mathFeedbackSpeech(question, correct)
        : wrongChoices.length > 0
          ? [MATH_LINES.almost]
          : null
      : null,
  );
}
