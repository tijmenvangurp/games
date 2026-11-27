export { levelHint, MATH_MODE_SYMBOLS } from "./model/config";
export {
  MATH_LINES,
  MATH_PRAISE_LINES,
  mathFeedbackSpeech,
  mathQuestionSpeech,
  numberSpeech,
  operatorSpeech,
  praiseSpeech,
  speechGroups as MATH_SPEECH_GROUPS,
} from "./model/audio";
export { createRound, explanationFor, groupingFor, praiseText } from "./model/generator";
export { dutchNumberWord } from "./model/number-words";
export { mathTexts } from "./model/texts";
export { MATH_LEVELS, MATH_MODES } from "./model/types";
export type { MathLevel, MathMode, MathQuestion, MathRound } from "./model/types";
