import type { EnglishLesson } from "../english";
import type { LESSON_NOURRITURE } from "./nourriture";

export const NOURRITURE_EN: EnglishLesson<typeof LESSON_NOURRITURE> = {
  subtitle: "Food and drink.",
  category: "Food and drink",
  items: {
    "nourriture-pain": {
      meaning: "the bread",
      note: "‘le’ is masculine.",
      example: "I love bread and cheese.",
    },
    "nourriture-fromage": {
      meaning: "the cheese",
      note: "‘le’ is masculine.",
      example: "The cheese comes from France.",
    },
    "nourriture-pomme": {
      meaning: "the apple",
      note: "‘la’ is feminine.",
      example: "The apple is red.",
    },
    "nourriture-banane": {
      meaning: "the banana",
      note: "‘la’ is feminine.",
      example: "I'm eating a banana.",
    },
    "nourriture-eau": {
      meaning: "the water",
      note: "‘l’’ stands for ‘la’ before a vowel.",
      example: "I drink water.",
    },
    "nourriture-lait": {
      meaning: "the milk",
      note: "‘le’ is masculine.",
      example: "The milk is cold.",
    },
    "nourriture-jus": {
      meaning: "the juice",
      note: "‘le jus d’orange’ is orange juice.",
      example: "The orange juice is sweet.",
    },
    "nourriture-gateau": {
      meaning: "the cake",
      note: "‘le’ is masculine.",
      example: "The cake is delicious.",
    },
    "nourriture-soupe": {
      meaning: "the soup",
      note: "‘la’ is feminine.",
      example: "The soup is hot.",
    },
    "nourriture-legumes": {
      meaning: "the vegetables",
      note: "Plural; ‘un légume’ is one vegetable.",
      example: "The vegetables are green.",
    },
    "nourriture-verre-eau": {
      meaning: "I would like a glass of water.",
      note: "‘Je voudrais’ is polite: ‘I would like’.",
      distractors: [
        "I would like a glass of milk.",
        "I'm drinking a glass of water.",
        "I would like a bowl of soup.",
      ],
    },
    "nourriture-tu-veux-pain": {
      meaning: "Do you want some bread?",
      note: "‘Tu veux’ means ‘you want’.",
      distractors: ["Do you want some cheese?", "Have you got any bread?", "Do you want an apple?"],
    },
    "nourriture-nous-mangeons-soupe": {
      meaning: "We are eating soup.",
      note: "‘Nous mangeons’ means ‘we eat’.",
      distractors: ["We are making soup.", "We are drinking soup.", "They are eating soup."],
    },
    "nourriture-petit-dejeuner": {
      meaning: "Breakfast is ready.",
      note: "‘Le petit-déjeuner’ is breakfast.",
      distractors: ["Dinner is ready.", "Breakfast is tasty.", "The table is ready."],
    },
    "nourriture-fruits-legumes": {
      meaning: "I love fruit and vegetables.",
      note: "‘les fruits’ is the plural of ‘le fruit’.",
      distractors: [
        "I love bread and cheese.",
        "I'm eating fruit and vegetables.",
        "I love fruit and meat.",
      ],
    },
  },
};
