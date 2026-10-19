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

export interface KlankCut {
  /** Woord waaruit de klank komt. */
  word: string;
  /** Aan het begin of einde van het woord. */
  from: "start" | "end";
  /** Lengte van het fragment in milliseconden. */
  durationMs: number;
  /** Fade aan de binnenkant, standaard 10 ms. */
  fadeMs?: number;
}

export interface KlankVariant {
  /** Korte id voor bestandsnamen en filters. */
  id: string;
  /** Label op de beluisterpagina. */
  label: string;
  /** De tekst die naar de TTS gaat. */
  ttsPrompt: string;
  /** Optionele afwijkende snelheid; standaard 1. */
  speed?: number;
  /** Knip deze variant uit een woord in plaats van losse TTS. */
  cut?: KlankCut;
}

export interface KlankMapping {
  id: string;
  teken: string;
  type: KlankType;
  ttsPrompt: string;
  filename: string;
  variants: readonly KlankVariant[];
}

export const AANBEVOLEN_VARIANTEN: Readonly<Record<string, string>> = {
  a: "fonetisch",
  e: "fonetisch",
  i: "fonetisch",
  o: "fonetisch",
  u: "fonetisch",
  aa: "letter",
  ee: "letter",
  oo: "letter",
  uu: "letter",
  oe: "oeh",
  ie: "letter",
  ij: "letter",
  ei: "letter",
  au: "letter",
  ou: "letter",
  eu: "euh",
  ui: "letter",
  b: "fonetisch",
  d: "fonetisch",
  f: "knip-100",
  g: "fonetisch",
  h: "fonetisch",
  j: "fonetisch",
  k: "fonetisch",
  l: "knip-100",
  m: "knip-100",
  n: "fonetisch",
  p: "fonetisch",
  r: "fonetisch",
  s: "knip-100",
  t: "fonetisch",
  v: "knip-100",
  w: "fonetisch",
  z: "knip-100",
  ng: "knip-100",
  ch: "knip-100",
};

function withExtraVariants(klank: KlankMapping, extra: readonly KlankVariant[]): KlankMapping {
  return { ...klank, variants: [...klank.variants, ...extra] };
}

function cutVariants(word: string, from: "start" | "end", label: string): KlankVariant[] {
  return [60, 80, 100, 120].map((durationMs) => ({
    id: `knip-${durationMs}`,
    label: `${label} ${durationMs} ms`,
    ttsPrompt: word,
    cut: { word, from, durationMs, fadeMs: 10 },
  }));
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
  withExtraVariants(digraph("oe", "oe", "oever", "u"), [
    { id: "oeh", label: "Fonetisch (oeh)", ttsPrompt: "oeh" },
    { id: "oeh-langzaam", label: "Fonetisch (oeh), langzaam", ttsPrompt: "oeh", speed: 0.7 },
    { id: "boek", label: "Woord: boek (knip zelf)", ttsPrompt: "boek" },
    { id: "doek", label: "Woord: doek (knip zelf)", ttsPrompt: "doek" },
  ]),
  digraph("ie", "ie", "iets", "i"),
  digraph("ij", "ij", "ijs", "ɛi"),
  digraph("ei", "ei", "ei", "ɛi"),
  digraph("au", "au", "auto", "ɑu"),
  digraph("ou", "ou", "oud", "ɑu"),
  withExtraVariants(digraph("eu", "eu", "Europa", "øː"), [
    { id: "euh", label: "Fonetisch (euh)", ttsPrompt: "euh" },
    { id: "euh-langzaam", label: "Fonetisch (euh), langzaam", ttsPrompt: "euh", speed: 0.7 },
    { id: "neus", label: "Woord: neus (knip zelf)", ttsPrompt: "neus" },
    { id: "deur", label: "Woord: deur (knip zelf)", ttsPrompt: "deur" },
    { id: "reus", label: "Woord: reus (knip zelf)", ttsPrompt: "reus" },
  ]),
  digraph("ui", "ui", "uit", "œy"),

  // Medeklinkers
  consonant("b", "buh", "bal", "b"),
  consonant("d", "duh", "das", "d"),
  withExtraVariants(consonant("f", "fuh", "fee", "f"), [
    { id: "lang4", label: "Verlengd (4 tekens)", ttsPrompt: "ffff" },
    { id: "lang6", label: "Verlengd (6 tekens)", ttsPrompt: "ffffff" },
    { id: "ellipsis", label: "Met ellips", ttsPrompt: "fff..." },
    { id: "traag", label: "Losse letter, langzaam", ttsPrompt: "f", speed: 0.5 },
    { id: "fiets", label: "Woord: fiets (knip zelf)", ttsPrompt: "fiets" },
    { id: "fles", label: "Woord: fles (knip zelf)", ttsPrompt: "fles" },
    ...cutVariants("fiets", "start", "Knip uit 'fiets' (begin)"),
  ]),
  consonant("g", "guh", "geel", "x"),
  consonant("h", "huh", "huis", "h"),
  consonant("j", "juh", "jas", "j"),
  consonant("k", "kuh", "kip", "k"),
  withExtraVariants(
    consonant("l", "luh", "lam", "l"),
    cutVariants("lam", "start", "Knip uit 'lam' (begin)"),
  ),
  withExtraVariants(
    consonant("m", "muh", "mat", "m"),
    cutVariants("mat", "start", "Knip uit 'mat' (begin)"),
  ),
  consonant("n", "nuh", "net", "n"),
  consonant("p", "puh", "pen", "p"),
  consonant("r", "ruh", "rat", "r"),
  withExtraVariants(
    consonant("s", "suh", "sap", "s"),
    cutVariants("sap", "start", "Knip uit 'sap' (begin)"),
  ),
  consonant("t", "tuh", "tak", "t"),
  withExtraVariants(consonant("v", "vuh", "vis", "v"), [
    { id: "lang4", label: "Verlengd (4 tekens)", ttsPrompt: "vvvv" },
    { id: "lang6", label: "Verlengd (6 tekens)", ttsPrompt: "vvvvvv" },
    { id: "ellipsis", label: "Met ellips", ttsPrompt: "vvv..." },
    { id: "traag", label: "Losse letter, langzaam", ttsPrompt: "v", speed: 0.5 },
    { id: "veel", label: "Woord: veel (knip zelf)", ttsPrompt: "veel" },
    ...cutVariants("vis", "start", "Knip uit 'vis' (begin)"),
  ]),
  withExtraVariants(consonant("w", "wuh", "wip", "ʋ"), [
    { id: "lang4", label: "Verlengd (4 tekens)", ttsPrompt: "wwww" },
    { id: "lang6", label: "Verlengd (6 tekens)", ttsPrompt: "wwwwww" },
    { id: "ellipsis", label: "Met ellips", ttsPrompt: "www..." },
    { id: "traag", label: "Losse letter, langzaam", ttsPrompt: "w", speed: 0.5 },
    { id: "water", label: "Woord: water (knip zelf)", ttsPrompt: "water" },
  ]),
  withExtraVariants(consonant("z", "zuh", "zon", "z"), [
    { id: "lang4", label: "Verlengd (4 tekens)", ttsPrompt: "zzzz" },
    { id: "lang6", label: "Verlengd (6 tekens)", ttsPrompt: "zzzzzz" },
    { id: "ellipsis", label: "Met ellips", ttsPrompt: "zzz..." },
    { id: "traag", label: "Losse letter, langzaam", ttsPrompt: "z", speed: 0.5 },
    { id: "zee", label: "Woord: zee (knip zelf)", ttsPrompt: "zee" },
    ...cutVariants("zon", "start", "Knip uit 'zon' (begin)"),
  ]),

  // Medeklinkerdigrafen
  withExtraVariants(consonantDigraph("ng", "nguh", "lang", "ŋ"), [
    { id: "bang", label: "Woord: bang (laatste klank)", ttsPrompt: "bang" },
    { id: "ring", label: "Woord: ring (laatste klank)", ttsPrompt: "ring" },
    { id: "eng", label: "Woord: eng (laatste klank)", ttsPrompt: "eng" },
    ...cutVariants("lang", "end", "Knip uit 'lang' (einde)"),
  ]),
  withExtraVariants(consonantDigraph("ch", "guh", "lach", "x"), [
    { id: "acht", label: "Woord: acht (klank in het midden)", ttsPrompt: "acht" },
    { id: "chaos", label: "Woord: chaos (eerste klank)", ttsPrompt: "chaos" },
    { id: "g", label: "Losse letter g", ttsPrompt: "g" },
    { id: "geel", label: "Woord: geel (eerste klank)", ttsPrompt: "geel" },
    ...cutVariants("lach", "end", "Knip uit 'lach' (einde)"),
  ]),
];
