import type { EnglishLesson } from "../english";
import type { LESSON_ANIMAUX } from "./animaux";

export const ANIMAUX_EN: EnglishLesson<typeof LESSON_ANIMAUX> = {
  subtitle: "Animals: listen and choose the right translation.",
  category: "Animals",
  items: {
    "animaux-chat": {
      meaning: "the cat",
      note: "‘le’ is masculine.",
      example: "My cat loves milk.",
    },
    "animaux-chien": {
      meaning: "the dog",
      note: "‘le’ is masculine.",
      example: "The dog plays in the garden.",
    },
    "animaux-oiseau": {
      meaning: "the bird",
      note: "‘l’’ stands for ‘le’ or ‘la’ before a vowel.",
      example: "The bird sings in the morning.",
    },
    "animaux-poisson": {
      meaning: "the fish",
      note: "‘le’ is masculine.",
      example: "The fish swims in the water.",
    },
    "animaux-cheval": {
      meaning: "the horse",
      note: "‘le’ is masculine.",
      example: "The horse eats an apple.",
    },
    "animaux-vache": {
      meaning: "the cow",
      note: "‘la’ is feminine.",
      example: "The cow eats grass.",
    },
    "animaux-lapin": {
      meaning: "the rabbit",
      note: "‘le’ is masculine.",
      example: "The rabbit jumps in the garden.",
    },
    "animaux-souris": {
      meaning: "the mouse",
      note: "‘la’ is feminine.",
      example: "The mouse eats cheese.",
    },
    "animaux-lion": {
      meaning: "the lion",
      note: "‘le’ is masculine.",
      example: "The lion sleeps under the tree.",
    },
    "animaux-elephant": {
      meaning: "the elephant",
      note: "‘l’’ stands for ‘le’ before a vowel.",
      example: "The elephant drinks lots of water.",
    },
    "animaux-chat-canape": {
      meaning: "The cat sleeps on the sofa.",
      note: "‘dort’ comes from ‘dormir’ (to sleep).",
      distractors: [
        "The dog sleeps on the sofa.",
        "The cat sits on the sofa.",
        "The cat sleeps in the garden.",
      ],
    },
    "animaux-chien-maison": {
      meaning: "I have a dog at home.",
      note: "‘à la maison’ means ‘at home’.",
      distractors: ["I have a cat at home.", "I see a dog in the garden.", "My dog lives outside."],
    },
    "animaux-oiseau-jardin": {
      meaning: "The bird sings in the garden.",
      note: "‘chante’ comes from ‘chanter’ (to sing).",
      distractors: [
        "The bird flies in the garden.",
        "The bird sings in the forest.",
        "The hen sings in the garden.",
      ],
    },
    "animaux-poisson-eau": {
      meaning: "The fish swims in the water.",
      note: "‘nage’ comes from ‘nager’ (to swim).",
      distractors: [
        "The fish swims in the sea.",
        "The fish eats in the water.",
        "The duck swims in the water.",
      ],
    },
    "animaux-cheval-vite": {
      meaning: "The horse runs very fast.",
      note: "‘très vite’ means ‘very fast’.",
      distractors: [
        "The horse walks very slowly.",
        "The dog runs very fast.",
        "The horse jumps over the hedge.",
      ],
    },
  },
};
