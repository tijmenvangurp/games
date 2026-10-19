/**
 * Prototype-data voor het genereren van losse Nederlandse klanken met TTS.
 *
 * TTS leest losse letters vaak als letternamen. Daarom heeft elke klank
 * meerdere varianten: de kale letter, een fonetische spelling ("buh"), een
 * aangehouden of herhaalde klank, een voorbeeldwoord en eventueel IPA/SSML.
 * De eigenaar beluistert de varianten en kiest wat het beste werkt.
 *
 * De `filename` is de canonieke naam van de standaardvariant. De generator zet
 * de stem erbij in de uiteindelijke bestandsnaam.
 */

export type KlankType = "kort" | "lang" | "tweeteken" | "medeklinker";

export interface KlankVariant {
  /** Korte id voor bestandsnamen en filters. */
  id: string;
  /** Label op de beluisterpagina. */
  label: string;
  /** De tekst die naar de TTS gaat. */
  ttsPrompt: string;
  /** Optionele afwijkende snelheid; standaard 1. */
  speed?: number;
}

export interface KlankMapping {
  id: string;
  teken: string;
  type: KlankType;
  ttsPrompt: string;
  filename: string;
  variants: readonly KlankVariant[];
}

function vowel(
  id: string,
  type: "kort" | "lang",
  phonetic: string,
  word: string,
  ipa: string,
): KlankMapping {
  return {
    id,
    teken: id,
    type,
    ttsPrompt: phonetic,
    filename: `${id}-fonetisch.mp3`,
    variants: [
      { id: "letter", label: "Losse letter", ttsPrompt: id },
      { id: "fonetisch", label: "Fonetische spelling", ttsPrompt: phonetic },
      { id: "langzaam", label: "Fonetisch, langzaam", ttsPrompt: phonetic, speed: 0.7 },
      { id: "woord", label: `Woord: ${word} (knip zelf)`, ttsPrompt: word },
      { id: "ipa", label: "IPA-teken (experiment)", ttsPrompt: `/${ipa}/` },
    ],
  };
}

function digraph(id: string, phonetic: string, word: string, ipa: string): KlankMapping {
  return {
    id,
    teken: id,
    type: "tweeteken",
    ttsPrompt: phonetic,
    filename: `${id}-fonetisch.mp3`,
    variants: [
      { id: "letter", label: "Losse letters", ttsPrompt: id },
      { id: "fonetisch", label: "Fonetische spelling", ttsPrompt: phonetic },
      { id: "langzaam", label: "Fonetisch, langzaam", ttsPrompt: phonetic, speed: 0.7 },
      { id: "woord", label: `Woord: ${word} (knip zelf)`, ttsPrompt: word },
      { id: "ipa", label: "IPA-teken (experiment)", ttsPrompt: `/${ipa}/` },
    ],
  };
}

function consonant(
  id: string,
  phonetic: string,
  word: string,
  ipa: string,
  held = `${id}${id}${id}`,
): KlankMapping {
  return {
    id,
    teken: id,
    type: "medeklinker",
    ttsPrompt: phonetic,
    filename: `${id}-fonetisch.mp3`,
    variants: [
      { id: "letter", label: "Losse letter", ttsPrompt: id },
      { id: "fonetisch", label: "Fonetische spelling", ttsPrompt: phonetic },
      { id: "aangehouden", label: "Aangehouden / herhaald", ttsPrompt: held },
      { id: "woord", label: `Woord: ${word} (knip zelf)`, ttsPrompt: word },
      { id: "ipa", label: "IPA-teken (experiment)", ttsPrompt: `/${ipa}/` },
      {
        id: "ssml",
        label: "SSML (experiment)",
        ttsPrompt: `<phoneme alphabet="ipa" ph="${ipa}">${id}</phoneme>`,
      },
    ],
  };
}

function consonantDigraph(id: string, phonetic: string, word: string, ipa: string): KlankMapping {
  return {
    id,
    teken: id,
    type: "medeklinker",
    ttsPrompt: phonetic,
    filename: `${id}-fonetisch.mp3`,
    variants: [
      { id: "letter", label: "Losse letters", ttsPrompt: id },
      { id: "fonetisch", label: "Fonetische spelling", ttsPrompt: phonetic },
      { id: "woord", label: `Woord: ${word} (klank achteraan)`, ttsPrompt: word },
      { id: "ipa", label: "IPA-teken (experiment)", ttsPrompt: `/${ipa}/` },
      {
        id: "ssml",
        label: "SSML (experiment)",
        ttsPrompt: `<phoneme alphabet="ipa" ph="${ipa}">${id}</phoneme>`,
      },
    ],
  };
}

export const KLANKEN: readonly KlankMapping[] = [
  // Korte klinkers
  vowel("a", "kort", "ah", "mat", "ɑ"),
  vowel("e", "kort", "eh", "mes", "ɛ"),
  vowel("i", "kort", "ih", "vis", "ɪ"),
  vowel("o", "kort", "oh", "pot", "ɔ"),
  vowel("u", "kort", "uh", "bus", "ʏ"),

  // Lange klinkers
  vowel("aa", "lang", "aa", "aap", "aː"),
  vowel("ee", "lang", "ee", "eet", "eː"),
  vowel("oo", "lang", "oo", "oom", "oː"),
  vowel("uu", "lang", "uu", "uur", "yː"),

  // Tweetekenklinkers en diftongen
  digraph("oe", "oe", "oever", "u"),
  digraph("ie", "ie", "iets", "i"),
  digraph("ij", "ij", "ijs", "ɛi"),
  digraph("ei", "ei", "ei", "ɛi"),
  digraph("au", "au", "auto", "ɑu"),
  digraph("ou", "ou", "oud", "ɑu"),
  digraph("eu", "eu", "Europa", "øː"),
  digraph("ui", "ui", "uit", "œy"),

  // Medeklinkers
  consonant("b", "buh", "bal", "b"),
  consonant("d", "duh", "das", "d"),
  consonant("f", "fff", "fee", "f"),
  consonant("g", "guh", "geel", "x"),
  consonant("h", "huh", "huis", "h"),
  consonant("j", "juh", "jas", "j"),
  consonant("k", "kuh", "kip", "k"),
  consonant("l", "lll", "lam", "l"),
  consonant("m", "mmm", "mat", "m"),
  consonant("n", "nnn", "net", "n"),
  consonant("p", "puh", "pen", "p"),
  consonant("r", "ruh", "rat", "r"),
  consonant("s", "sss", "sap", "s"),
  consonant("t", "tuh", "tak", "t"),
  consonant("v", "vvv", "vis", "v"),
  consonant("w", "wuh", "wip", "ʋ"),
  consonant("z", "zzz", "zon", "z"),

  // Medeklinkerdigrafen
  consonantDigraph("ng", "ng", "lang", "ŋ"),
  consonantDigraph("ch", "ch", "lach", "x"),
];
