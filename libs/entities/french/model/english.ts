import type { Language } from "@shared/i18n";
import { FRENCH_CURRICULUM } from "./curriculum";
import { ANIMAUX_EN } from "./lessons/animaux-en";
import { CORPS_EN } from "./lessons/corps-en";
import { ECOLE_EN } from "./lessons/ecole-en";
import { FAMILLE_EN } from "./lessons/famille-en";
import { METEO_EN } from "./lessons/meteo-en";
import { NOURRITURE_EN } from "./lessons/nourriture-en";
import { SALUTATIONS_EN } from "./lessons/salutations-en";
import type { FrenchExample, FrenchItem, FrenchLesson } from "./types";

/** De Engelse betekenis van één Frans woord of zinnetje. */
export interface EnglishItem {
  /** Vervangt `nl` als het spel in het Engels staat. */
  readonly meaning: string;
  readonly note?: string;
  /** Vertaling van de voorbeeldzin; alleen bij woorden. */
  readonly example?: string;
  /** Foute Engelse antwoorden; alleen bij zinnen. */
  readonly distractors?: readonly string[];
}

/**
 * Engelse kant van één les. De sleutels zijn de letterlijke item-id's van de les,
 * dus de compiler meldt een ontbrekend of overbodig item.
 */
export interface EnglishLesson<Lesson extends FrenchLesson> {
  readonly subtitle: string;
  readonly category: string;
  readonly items: { readonly [Id in Lesson["items"][number]["id"]]: EnglishItem };
}

interface AnyEnglishLesson {
  readonly subtitle: string;
  readonly category: string;
  readonly items: Readonly<Record<string, EnglishItem>>;
}

const ENGLISH_LESSONS: Readonly<Record<string, AnyEnglishLesson>> = {
  salutations: SALUTATIONS_EN,
  animaux: ANIMAUX_EN,
  famille: FAMILLE_EN,
  nourriture: NOURRITURE_EN,
  ecole: ECOLE_EN,
  meteo: METEO_EN,
  corps: CORPS_EN,
};

function translateExample(
  example: FrenchExample | undefined,
  translation: string | undefined,
): FrenchExample | undefined {
  return example && translation ? { ...example, nl: translation } : example;
}

/**
 * Het Franse item blijft gelijk (tekst, audio, id); alleen de betekenis, uitleg,
 * voorbeeldvertaling en afleiders wisselen naar het Engels. Zo werken quiz,
 * kaarten en sorteren zonder aparte Engelse logica.
 */
function translateItem(item: FrenchItem, english: EnglishItem): FrenchItem {
  return {
    ...item,
    nl: english.meaning,
    nlAlt: undefined,
    note: english.note,
    example: translateExample(item.example, english.example),
    distractors: english.distractors,
  };
}

function translateLesson(lesson: FrenchLesson, english: AnyEnglishLesson): FrenchLesson {
  return {
    ...lesson,
    subtitle: english.subtitle,
    category: english.category,
    items: lesson.items.map((item) => translateItem(item, english.items[item.id])),
  };
}

/** Eén keer vertaald, zodat elke render dezelfde objecten krijgt. */
const ENGLISH_CURRICULUM = new Map(
  FRENCH_CURRICULUM.map((lesson) => [
    lesson.id,
    translateLesson(lesson, ENGLISH_LESSONS[lesson.id]),
  ]),
);

const ENGLISH_ITEMS = new Map(
  [...ENGLISH_CURRICULUM.values()].flatMap((lesson) => lesson.items.map((item) => [item.id, item])),
);

const LESSON_IN: Readonly<Record<Language, (lesson: FrenchLesson) => FrenchLesson>> = {
  nl: (lesson) => lesson,
  en: (lesson) => ENGLISH_CURRICULUM.get(lesson.id) ?? lesson,
};

const ITEM_IN: Readonly<Record<Language, (item: FrenchItem) => FrenchItem>> = {
  nl: (item) => item,
  en: (item) => ENGLISH_ITEMS.get(item.id) ?? item,
};

/** Een les met betekenissen in de gekozen taal. Frans en audio blijven gelijk. */
export function localizeLesson(lesson: FrenchLesson, language: Language): FrenchLesson {
  return LESSON_IN[language](lesson);
}

/** Een los item met de betekenis in de gekozen taal, bijvoorbeeld voor herhalen. */
export function localizeItem(item: FrenchItem, language: Language): FrenchItem {
  return ITEM_IN[language](item);
}
