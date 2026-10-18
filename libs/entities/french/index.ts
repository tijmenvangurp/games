export { frenchAudioSrc, frenchExampleAudioSrc } from "./model/audio";
export {
  FRENCH_CURRICULUM,
  allFrenchItems,
  getLesson,
  listPublishedLessons,
} from "./model/curriculum";
export { LESSON_ANIMAUX } from "./model/lessons/animaux";
export {
  FRENCH_PROGRESS_VERSION,
  dueItemIds,
  emptyFrenchProgress,
  isDue,
  lessonStars,
  recordFrenchAnswer,
} from "./model/progress";
export type { FrenchItemProgress, FrenchProgressState } from "./model/progress";
export type { FrenchItem, FrenchLesson } from "./model/types";
export { validateCurriculum } from "./model/validate-curriculum";
