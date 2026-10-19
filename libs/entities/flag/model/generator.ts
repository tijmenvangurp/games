import { createSeed, mulberry32, shuffledIndexes } from "@shared/lib";
import { continentLabel, countriesFor, lookalikeCodes } from "./config";
import {
  FLAG_DIRECTIONS,
  type FlagCountry,
  type FlagDirection,
  type FlagLevel,
  type FlagQuestion,
  type FlagRound,
  type FlagScope,
} from "./types";

const ROUND_SIZE = 10;

const CHOICE_COUNT: Record<FlagLevel, number> = {
  makkelijk: 3,
  gemiddeld: 4,
  moeilijk: 4,
};

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  return shuffledIndexes(items.length, random).map((index) => items[index] as T);
}

function withoutCode(countries: readonly FlagCountry[], code: string): FlagCountry[] {
  return countries.filter((country) => country.code !== code);
}

/**
 * Ordered groups of candidates for the wrong answers. Each level walks the
 * groups from left to right, so a level always gets its preferred kind of
 * distractor and only falls back when the scope is too small.
 */
function distractorTiers(
  answer: FlagCountry,
  level: FlagLevel,
  pool: readonly FlagCountry[],
): readonly (readonly FlagCountry[])[] {
  const others = withoutCode(pool, answer.code);
  const sameContinent = others.filter((country) => country.continent === answer.continent);
  const otherContinents = others.filter((country) => country.continent !== answer.continent);
  const lookalikeCodesSet = new Set(lookalikeCodes(answer.code));
  const lookalikes = others.filter((country) => lookalikeCodesSet.has(country.code));

  switch (level) {
    case "makkelijk":
      return [otherContinents, sameContinent];
    case "gemiddeld":
      return [sameContinent, otherContinents];
    case "moeilijk":
      return [lookalikes, sameContinent, otherContinents];
  }
}

function distractorChoices(
  answer: FlagCountry,
  level: FlagLevel,
  pool: readonly FlagCountry[],
  random: () => number,
): FlagCountry[] {
  const needed = CHOICE_COUNT[level] - 1;
  const picked: FlagCountry[] = [];
  const pickedCodes = new Set([answer.code]);

  for (const tier of distractorTiers(answer, level, pool)) {
    for (const candidate of shuffle(tier, random)) {
      if (picked.length >= needed) {
        break;
      }
      if (pickedCodes.has(candidate.code)) {
        continue;
      }
      pickedCodes.add(candidate.code);
      picked.push(candidate);
    }
    if (picked.length >= needed) {
      break;
    }
  }

  if (picked.length < needed) {
    throw new Error(`Te weinig landen om ${level} te spelen`);
  }

  return picked;
}

/**
 * Half of the questions show a flag and ask for the country name, the other
 * half show a country name and ask for the flag. Shuffled, so both directions
 * alternate unpredictably inside one round.
 */
function directionsFor(random: () => number): FlagDirection[] {
  const perDirection = Math.floor(ROUND_SIZE / FLAG_DIRECTIONS.length);

  return shuffle(
    FLAG_DIRECTIONS.flatMap((direction) => Array.from({ length: perDirection }, () => direction)),
    random,
  );
}

export function createRound(
  scope: FlagScope,
  level: FlagLevel,
  seed: number = createSeed(),
): FlagRound {
  const random = mulberry32(seed);
  const pool = countriesFor(scope);
  const needed = CHOICE_COUNT[level] - 1;

  if (pool.length < needed + 1) {
    throw new Error(`Te weinig landen voor ${scope}`);
  }

  const chosen = shuffle(pool, random).slice(0, Math.min(ROUND_SIZE, pool.length));
  const directions = directionsFor(random);

  const questions: FlagQuestion[] = chosen.map((country, index) => {
    const choices = shuffle([country, ...distractorChoices(country, level, pool, random)], random);

    return {
      id: index,
      direction: directions[index] ?? FLAG_DIRECTIONS[0],
      country,
      choices,
    };
  });

  return { scope, level, seed, questions };
}

export function explanationFor(question: FlagQuestion): string {
  const { country, direction } = question;
  const continent = continentLabel(country.continent);

  if (direction === "vlag-naar-land") {
    return `Dit is de vlag van ${country.name}. ${country.name} ligt in ${continent}.`;
  }

  return `De vlag van ${country.name} is de juiste. ${country.name} ligt in ${continent}.`;
}
