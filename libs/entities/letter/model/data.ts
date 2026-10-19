import {
  LETTER_IDS,
  type KlankPosition,
  type Letter,
  type LetterId,
  type LetterLessonInfo,
  type LetterWord,
} from "./types";

const sound = (id: string) => `/audio/letters/v1/sounds/${id}.wav`;
const audio = (id: string) => `/audio/letters/v1/words/${id}.wav`;

/**
 * Alle lessen van Letterpret. Ze delen hetzelfde spelkaartje op het
 * homescherm en dezelfde pagina; de keuzelijst bepaalt welke ronde start.
 */
export const LETTER_LESSONS: readonly LetterLessonInfo[] = [
  {
    id: "letters",
    title: "Letterronde",
    description: "Hoor de klank en kies de letter. Zes korte vragen.",
  },
  {
    id: "woorden",
    title: "Woordlezen",
    description: "Luister naar een woord en kies het juiste woord. Zes woorden.",
  },
  {
    id: "trein",
    title: "Woordtrein",
    description: "Bouw het woord met letters. Zes korte woorden.",
  },
  {
    id: "klankplek",
    title: "Klankplek",
    description: "Waar hoor je de klank? Sleep de letter naar het juiste vakje. Zes woorden.",
  },
];

export const KLANK_POSITIONS: readonly KlankPosition[] = ["begin", "midden", "eind"];

export const KLANK_POSITION_PHRASES: Readonly<Record<KlankPosition, string>> = {
  begin: "vooraan in",
  midden: "in het midden van",
  eind: "achteraan in",
};

export const LETTERS: readonly Letter[] = [
  { id: "i", glyph: "i", kind: "vowel", sound: sound("i") },
  { id: "k", glyph: "k", kind: "consonant", sound: sound("k") },
  { id: "m", glyph: "m", kind: "consonant", sound: sound("m") },
  { id: "s", glyph: "s", kind: "consonant", sound: sound("s") },
  { id: "p", glyph: "p", kind: "consonant", sound: sound("p") },
  { id: "v", glyph: "v", kind: "consonant", sound: sound("v") },
  { id: "e", glyph: "e", kind: "vowel", sound: sound("e") },
  { id: "n", glyph: "n", kind: "consonant", sound: sound("n") },
  { id: "t", glyph: "t", kind: "consonant", sound: sound("t") },
  { id: "a", glyph: "a", kind: "vowel", sound: sound("a") },
];

export const LETTER_BY_ID: Readonly<Record<LetterId, Letter>> = Object.fromEntries(
  LETTERS.map((letter) => [letter.id, letter]),
) as Record<LetterId, Letter>;

export const LETTER_ORDER: readonly LetterId[] = LETTER_IDS;

/**
 * Kleine, kindvriendelijke woorden. Elk woord begint met de letter die in
 * `letter` staat. Voor de woordtrein gebruiken we alleen woorden met unieke
 * letters, zodat elke tegel maar één keer nodig is.
 */
export const WORDS: readonly LetterWord[] = [
  { id: "aap", word: "aap", letter: "a", letters: ["a", "a", "p"], audio: audio("aap") },
  { id: "eet", word: "eet", letter: "e", letters: ["e", "e", "t"], audio: audio("eet") },
  { id: "ik", word: "ik", letter: "i", letters: ["i", "k"], audio: audio("ik") },
  { id: "is", word: "is", letter: "i", letters: ["i", "s"], audio: audio("is") },
  { id: "mis", word: "mis", letter: "m", letters: ["m", "i", "s"], audio: audio("mis") },
  { id: "mes", word: "mes", letter: "m", letters: ["m", "e", "s"], audio: audio("mes") },
  { id: "mat", word: "mat", letter: "m", letters: ["m", "a", "t"], audio: audio("mat") },
  { id: "kim", word: "kim", letter: "k", letters: ["k", "i", "m"], audio: audio("kim") },
  { id: "kip", word: "kip", letter: "k", letters: ["k", "i", "p"], audio: audio("kip") },
  { id: "vis", word: "vis", letter: "v", letters: ["v", "i", "s"], audio: audio("vis") },
  { id: "pet", word: "pet", letter: "p", letters: ["p", "e", "t"], audio: audio("pet") },
  { id: "pen", word: "pen", letter: "p", letters: ["p", "e", "n"], audio: audio("pen") },
  { id: "net", word: "net", letter: "n", letters: ["n", "e", "t"], audio: audio("net") },
  { id: "tak", word: "tak", letter: "t", letters: ["t", "a", "k"], audio: audio("tak") },
  { id: "sap", word: "sap", letter: "s", letters: ["s", "a", "p"], audio: audio("sap") },
];

export const WORDS_BY_LETTER: Readonly<Record<LetterId, readonly LetterWord[]>> = {
  i: WORDS.filter((word) => word.letter === "i"),
  k: WORDS.filter((word) => word.letter === "k"),
  m: WORDS.filter((word) => word.letter === "m"),
  s: WORDS.filter((word) => word.letter === "s"),
  p: WORDS.filter((word) => word.letter === "p"),
  v: WORDS.filter((word) => word.letter === "v"),
  e: WORDS.filter((word) => word.letter === "e"),
  n: WORDS.filter((word) => word.letter === "n"),
  t: WORDS.filter((word) => word.letter === "t"),
  a: WORDS.filter((word) => word.letter === "a"),
};

export const TRAIN_WORDS: readonly LetterWord[] = WORDS.filter(
  (word) => word.letters.length >= 2 && new Set(word.letters).size === word.letters.length,
);

/**
 * Letters die visueel of qua klank op elkaar lijken. De generator gebruikt
 * deze groepen om didactisch zinvolle afleiders te kiezen.
 */
export const CONFUSION_GROUPS: readonly (readonly LetterId[])[] = [
  ["m", "n"],
  ["p", "t"],
  ["e", "i"],
  ["s", "v"],
  ["k", "t"],
  ["a", "e"],
];
