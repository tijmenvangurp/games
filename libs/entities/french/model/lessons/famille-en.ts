import type { EnglishLesson } from "../english";
import type { LESSON_FAMILLE } from "./famille";

export const FAMILLE_EN: EnglishLesson<typeof LESSON_FAMILLE> = {
  subtitle: "Family members and the people around you.",
  category: "Family",
  items: {
    "famille-mere": {
      meaning: "the mother",
      note: "‘la’ is feminine.",
      example: "My mother is called Anne.",
    },
    "famille-pere": {
      meaning: "the father",
      note: "‘le’ is masculine.",
      example: "My father works at home.",
    },
    "famille-soeur": {
      meaning: "the sister",
      note: "‘la’ is feminine.",
      example: "My sister is six years old.",
    },
    "famille-frere": {
      meaning: "the brother",
      note: "‘le’ is masculine.",
      example: "My brother plays football.",
    },
    "famille-grand-mere": {
      meaning: "the grandma",
      note: "Word for word: ‘grand mother’.",
      example: "My grandma lives in Paris.",
    },
    "famille-grand-pere": {
      meaning: "the grandpa",
      note: "Word for word: ‘grand father’.",
      example: "My grandpa reads the newspaper.",
    },
    "famille-fille": {
      meaning: "the girl",
      note: "‘la fille’ can also mean ‘the daughter’.",
      example: "The girl eats an apple.",
    },
    "famille-garcon": {
      meaning: "the boy",
      note: "‘le’ is masculine.",
      example: "The boy runs in the park.",
    },
    "famille-bebe": {
      meaning: "the baby",
      note: "‘le’ is masculine, even for a baby girl.",
      example: "The baby is sleeping.",
    },
    "famille-parents": {
      meaning: "the parents",
      note: "Plural; ‘un parent’ can also mean ‘a relative’.",
      example: "The parents are at home.",
    },
    "famille-frere-soeur": {
      meaning: "I have a sister and a brother.",
      note: "‘J’ai’ means ‘I have’.",
      distractors: ["I have two sisters.", "I have a dog and a cat.", "My sister has a brother."],
    },
    "famille-en-france": {
      meaning: "My family lives in France.",
      note: "‘habite’ comes from ‘habiter’ (to live).",
      distractors: [
        "My family lives in Belgium.",
        "My father lives in France.",
        "My family works in France.",
      ],
    },
    "famille-voici-ma-mere": {
      meaning: "This is my mother.",
      note: "‘Voici’ means ‘this is’ or ‘here is’.",
      distractors: ["This is my father.", "This is my sister.", "There is my mother."],
    },
    "famille-plus-grand": {
      meaning: "My brother is taller than me.",
      note: "‘plus … que’ means ‘more … than’.",
      distractors: [
        "My brother is shorter than me.",
        "My sister is taller than me.",
        "My father is taller than me.",
      ],
    },
    "famille-cinq-maison": {
      meaning: "There are five of us at home.",
      note: "‘Nous sommes’ means ‘we are’.",
      distractors: [
        "There are four of us at home.",
        "There are five of us at school.",
        "There are five of them at home.",
      ],
    },
  },
};
