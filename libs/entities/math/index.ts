export { levelHint, MATH_LEVEL_INFO, MATH_MODE_INFO } from "./model/config";
export {
  MATH_LINES,
  mathFeedbackSpeech,
  mathQuestionSpeech,
  numberSpeech,
  operatorSpeech,
  speechGroups as MATH_SPEECH_GROUPS,
} from "./model/audio";
export { createRound, explanationFor, groupingFor } from "./model/generator";
export { dutchNumberWord } from "./model/number-words";
export { MATH_LEVELS, MATH_MODES } from "./model/types";
export type { MathLevel, MathMode, MathQuestion, MathRound } from "./model/types";
