import type { EnglishLesson } from "../english";
import type { LESSON_ECOLE } from "./ecole";

export const ECOLE_EN: EnglishLesson<typeof LESSON_ECOLE> = {
  subtitle: "At school.",
  category: "School",
  items: {
    "ecole-ecole": {
      meaning: "the school",
      note: "‘l’’ stands for ‘la’ before a vowel.",
      example: "I go to school.",
    },
    "ecole-livre": {
      meaning: "the book",
      note: "‘le’ is masculine.",
      example: "The book is on the table.",
    },
    "ecole-crayon": {
      meaning: "the pencil",
      note: "‘le’ is masculine.",
      example: "I write with a pencil.",
    },
    "ecole-table": {
      meaning: "the table",
      note: "‘la’ is feminine.",
      example: "The table is big.",
    },
    "ecole-chaise": {
      meaning: "the chair",
      note: "‘la’ is feminine.",
      example: "The chair is blue.",
    },
    "ecole-cartable": {
      meaning: "the school bag",
      note: "‘le’ is masculine.",
      example: "My school bag is heavy.",
    },
    "ecole-maitresse": {
      meaning: "the teacher (woman)",
      note: "A female teacher.",
      example: "The teacher reads a story.",
    },
    "ecole-maitre": {
      meaning: "the teacher (man)",
      note: "A male teacher.",
      example: "The teacher writes on the board.",
    },
    "ecole-ami": {
      meaning: "the friend (boy)",
      note: "A friend who is a boy.",
      example: "My friend is called Tom.",
    },
    "ecole-amie": {
      meaning: "the friend (girl)",
      note: "A friend who is a girl.",
      example: "My friend is in my class.",
    },
    "ecole-livre-cartable": {
      meaning: "I have a book in my school bag.",
      note: "‘dans’ means ‘in’.",
      distractors: [
        "I have a notebook in my school bag.",
        "I have a book on the table.",
        "My book is in my bag.",
      ],
    },
    "ecole-classe-huit-heures": {
      meaning: "The lesson starts at eight o'clock.",
      note: "‘commence’ comes from ‘commencer’ (to start).",
      distractors: [
        "The lesson starts at nine o'clock.",
        "School starts at eight o'clock.",
        "The lesson ends at eight o'clock.",
      ],
    },
    "ecole-salle-classe": {
      meaning: "Where is the classroom?",
      note: "‘Où est’ means ‘where is’.",
      distractors: ["Where is the school?", "Where is the teacher?", "Where is the table?"],
    },
    "ecole-devoirs": {
      meaning: "I'm doing my homework.",
      note: "‘les devoirs’ is homework.",
      distractors: ["I'm doing my exercise.", "I'm reading a book.", "I'm writing my homework."],
    },
    "ecole-lisons-ensemble": {
      meaning: "We read a book together.",
      note: "‘ensemble’ means ‘together’.",
      distractors: ["We read a story together.", "We write a book.", "They read a book together."],
    },
  },
};
