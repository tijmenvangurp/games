import type { EnglishLesson } from "../english";
import type { LESSON_CORPS } from "./corps";

export const CORPS_EN: EnglishLesson<typeof LESSON_CORPS> = {
  subtitle: "The body.",
  category: "The body",
  items: {
    "corps-tete": {
      meaning: "the head",
      note: "‘la’ is feminine.",
      example: "I have a headache.",
    },
    "corps-main": {
      meaning: "the hand",
      note: "‘la’ is feminine.",
      example: "I put my hand up.",
    },
    "corps-pied": {
      meaning: "the foot",
      note: "‘le’ is masculine.",
      example: "My foot is cold.",
    },
    "corps-yeux": {
      meaning: "the eyes",
      note: "Plural; one eye is ‘un œil’.",
      example: "My eyes are blue.",
    },
    "corps-nez": {
      meaning: "the nose",
      note: "‘le’ is masculine.",
      example: "My nose is small.",
    },
    "corps-bouche": {
      meaning: "the mouth",
      note: "‘la’ is feminine.",
      example: "The mouth is closed.",
    },
    "corps-oreille": {
      meaning: "the ear",
      note: "‘l’’ stands for ‘la’ before a vowel.",
      example: "My ear is red.",
    },
    "corps-cheveux": {
      meaning: "the hair",
      note: "Plural; one hair is ‘un cheveu’.",
      example: "My hair is long.",
    },
    "corps-bras": {
      meaning: "the arm",
      note: "‘le’ is masculine.",
      example: "My arm is strong.",
    },
    "corps-jambe": {
      meaning: "the leg",
      note: "‘la’ is feminine.",
      example: "My leg is tired.",
    },
    "corps-mal-au-ventre": {
      meaning: "I have a tummy ache.",
      note: "‘avoir mal à’ means ‘to have a pain in’.",
      distractors: ["I have a headache.", "I have a sore throat.", "My tummy is big."],
    },
    "corps-lave-toi-les-mains": {
      meaning: "Wash your hands.",
      note: "‘Lave-toi’ tells someone what to do.",
      distractors: ["Wash your face.", "Dry your hands.", "Wash your feet."],
    },
    "corps-yeux-verts": {
      meaning: "I have green eyes.",
      note: "‘les yeux verts’ means ‘green eyes’.",
      distractors: ["I have blue eyes.", "She has green eyes.", "I have green shoes."],
    },
    "corps-cheveux-courts": {
      meaning: "He has short hair.",
      note: "‘courts’ means ‘short’.",
      distractors: ["He has long hair.", "She has short hair.", "He has no hair."],
    },
    "corps-leve-le-bras": {
      meaning: "She puts her arm up.",
      note: "‘Elle lève’ means ‘she raises’.",
      distractors: ["He puts his arm up.", "She puts her hand up.", "She hurts her arm."],
    },
  },
};
