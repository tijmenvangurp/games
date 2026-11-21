import type { Language } from "@shared/i18n";
import type { Level } from "./types";

interface LevelText {
  readonly name: string;
  readonly intro: string;
}

/**
 * Engelse naam en uitleg per level-id. De Nederlandse tekst staat in het level zelf,
 * zodat de leveldata één bron blijft.
 */
const ENGLISH_LEVELS: Readonly<Record<string, LevelText>> = {
  "eerste-tand": { name: "First tooth", intro: "One gear touches the motor and the goal." },
  "twee-tussenwielen": {
    name: "Two in-between wheels",
    intro: "Two in-between wheels turn the goal the other way.",
  },
  "de-riem": { name: "The chain loop", intro: "A chain connects two wheels." },
  "de-ketting": {
    name: "The long chain",
    intro: "A long chain carries the movement to a big wheel.",
  },
  "groot-en-klein": {
    name: "Big and small",
    intro: "A big gear turns more slowly than a small one.",
  },
  "de-meter": { name: "The meter", intro: "The meter shows the right speed." },
  "de-riemvertraging": {
    name: "Slow chain",
    intro: "A chain over a big wheel makes the goal slower.",
  },
  "twee-maten": {
    name: "Two sizes",
    intro: "The same chain, two speeds: small wheel fast, big wheel slow.",
  },
  gekruist: { name: "Crossed", intro: "A crossed chain turns the direction around." },
  "de-omweg": { name: "The detour", intro: "The straight way is blocked. Find a detour." },
  "precies-genoeg": { name: "Just enough", intro: "There are just enough parts." },
  andersom: {
    name: "The other way",
    intro: "The motor turns the other way. Watch the arrow.",
  },
  "lamp-aan": {
    name: "Lamp on",
    intro: "The lamp only lights up when the generator turns fast enough.",
  },
  "de-lift": { name: "The lift", intro: "A chain over a big wheel raises the lift slowly." },
  "twee-kanten-op": {
    name: "Two ways",
    intro: "One motor, two goals. Share out the movement.",
  },
  "snel-en-langzaam": {
    name: "Fast and slow",
    intro: "The lamp turns fast, the lift slowly. Split the motor.",
  },
  "twee-kettingen": {
    name: "Two chains",
    intro: "One motor, two chains: one open and one crossed.",
  },
  "ketting-naar-tandwiel": {
    name: "Chain to gear",
    intro: "The chain carries the movement to a gear.",
  },
  "de-hijskraan": {
    name: "The crane",
    intro: "A fast lamp on the left, a slow lift on the right. Two chains.",
  },
  "de-verdeelbox": {
    name: "The splitter box",
    intro: "A gear for the lamp, a chain for the lift.",
  },
  tegenrichting: {
    name: "Opposite ways",
    intro: "Two big goals, each turning a different way and both half as fast.",
  },
  "de-keerkoppeling": {
    name: "The reverse coupling",
    intro: "First a gear to turn around, then a chain to slow down.",
  },
  "de-wenteltrap": {
    name: "The spiral staircase",
    intro: "The gears aren't in one row. Find the diagonal route.",
  },
  "de-drievoudige": {
    name: "The triple",
    intro: "Three goals, three chains. One has to turn the other way.",
  },
  "de-productielijn": {
    name: "The production line",
    intro: "A fast lamp, a slow lift and a goal that turns the other way.",
  },
};

const LEVEL_TEXT: Readonly<Record<Language, (level: Level) => LevelText>> = {
  nl: (level) => level,
  en: (level) => ENGLISH_LEVELS[level.id] ?? level,
};

/** Naam en uitleg van een level in de gekozen taal. */
export function levelText(level: Level, language: Language): LevelText {
  return LEVEL_TEXT[language](level);
}
