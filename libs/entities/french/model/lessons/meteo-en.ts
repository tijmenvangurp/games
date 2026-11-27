import type { EnglishLesson } from "../english";
import type { LESSON_METEO } from "./meteo";

export const METEO_EN: EnglishLesson<typeof LESSON_METEO> = {
  subtitle: "Weather and free time.",
  category: "Weather and free time",
  items: {
    "meteo-soleil": {
      meaning: "the sun",
      note: "‘le’ is masculine.",
      example: "The sun is shining.",
    },
    "meteo-pluie": {
      meaning: "the rain",
      note: "‘la’ is feminine.",
      example: "The rain is falling hard.",
    },
    "meteo-vent": {
      meaning: "the wind",
      note: "‘le’ is masculine.",
      example: "The wind is strong.",
    },
    "meteo-neige": {
      meaning: "the snow",
      note: "‘la’ is feminine.",
      example: "The snow is white.",
    },
    "meteo-nuage": {
      meaning: "the cloud",
      note: "‘le’ is masculine.",
      example: "There is a cloud in the sky.",
    },
    "meteo-chaud": {
      meaning: "warm",
      note: "‘Il fait chaud’ means ‘it is warm’.",
      example: "It is warm today.",
    },
    "meteo-froid": {
      meaning: "cold",
      note: "‘Il fait froid’ means ‘it is cold’.",
      example: "It is cold in winter.",
    },
    "meteo-sport": {
      meaning: "the sport",
      note: "‘le’ is masculine.",
      example: "I do sport.",
    },
    "meteo-velo": {
      meaning: "the bike",
      note: "‘le’ is masculine.",
      example: "I ride my bike.",
    },
    "meteo-piscine": {
      meaning: "the swimming pool",
      note: "‘la’ is feminine.",
      example: "We swim in the swimming pool.",
    },
    "meteo-quel-temps": {
      meaning: "What's the weather like?",
      note: "Word for word: ‘what weather does it make?’.",
      distractors: ["What time is it?", "What are you doing?", "Where is it?"],
    },
    "meteo-il-fait-beau": {
      meaning: "The weather is nice today.",
      note: "‘beau’ means ‘nice’ or ‘beautiful’.",
      distractors: ["It is cold today.", "It is raining today.", "It is warm today."],
    },
    "meteo-joue-au-foot": {
      meaning: "I play football with my friends.",
      note: "‘jouer au foot’ means ‘to play football’.",
      distractors: [
        "I play with my friends.",
        "I play football with my brother.",
        "I watch football.",
      ],
    },
    "meteo-allons-piscine": {
      meaning: "We are going to the swimming pool.",
      note: "‘Nous allons’ means ‘we go’.",
      distractors: [
        "We are going to the sea.",
        "We swim in the swimming pool.",
        "They are going to the swimming pool.",
      ],
    },
    "meteo-hiver-neige": {
      meaning: "In winter, it snows.",
      note: "‘En hiver’ means ‘in winter’.",
      distractors: ["In summer, it snows.", "In winter, it rains.", "In autumn, it snows."],
    },
  },
};
