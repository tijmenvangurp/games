import { HOME_ROW } from "./fingers";
import type { Lesson } from "./types";

export const ROUND_LENGTH = 20;

/** Vanaf deze nauwkeurigheid ontgrendelt de volgende les. */
export const UNLOCK_ACCURACY = 0.8;
/** Onder deze nauwkeurigheid stellen we dezelfde les nog eens voor. */
export const RETRY_ACCURACY = 0.7;
/** Na zoveel fouten op één doelteken komt de vingerzone groter in beeld. */
export const HINT_AFTER_MISTAKES = 3;

export const LESSONS: readonly Lesson[] = [
  {
    id: "f-j",
    title: "F en J",
    description: "Voel de ribbeltjes en zet je wijsvingers erop.",
    kind: "oefenreeks",
    keys: ["f", "j"],
    newKeys: ["f", "j"],
  },
  {
    id: "d-k",
    title: "D en K",
    description: "Je middelvingers doen mee.",
    kind: "oefenreeks",
    keys: ["f", "j", "d", "k"],
    newKeys: ["d", "k"],
  },
  {
    id: "s-l",
    title: "S en L",
    description: "Nu de ringvingers.",
    kind: "oefenreeks",
    keys: ["f", "j", "d", "k", "s", "l"],
    newKeys: ["s", "l"],
  },
  {
    id: "a-puntkomma",
    title: "A en ;",
    description: "De pinken zijn aan de beurt.",
    kind: "oefenreeks",
    keys: ["f", "j", "d", "k", "s", "l", "a", ";"],
    newKeys: ["a", ";"],
  },
  {
    id: "g-h",
    title: "G en H",
    description: "Je wijsvingers reiken zijwaarts.",
    kind: "oefenreeks",
    keys: HOME_ROW,
    newKeys: ["g", "h"],
  },
  {
    id: "basisrij",
    title: "De hele basisrij",
    description: "Alle tien toetsen door elkaar.",
    kind: "oefenreeks",
    keys: HOME_ROW,
    newKeys: [],
  },
  {
    id: "woorden-1",
    title: "Korte woorden",
    description: "Woorden van drie of vier letters.",
    kind: "woorden",
    keys: HOME_ROW,
    newKeys: [],
    wordLength: { min: 3, max: 4 },
  },
  {
    id: "woorden-2",
    title: "Langere woorden",
    description: "Woorden van vier of vijf letters.",
    kind: "woorden",
    keys: HOME_ROW,
    newKeys: [],
    wordLength: { min: 4, max: 5 },
  },
];

export const LESSON_BY_ID: Readonly<Record<string, Lesson>> = Object.fromEntries(
  LESSONS.map((lesson) => [lesson.id, lesson]),
);
