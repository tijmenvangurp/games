import { createSeed, mulberry32, shuffledIndexes } from "@shared/lib";
import { HARD_LEVEL_CHOICES, lookalikeCodes, regionLabel, subjectsFor } from "./config";
import {
  FLAG_DIRECTIONS,
  type FlagDirection,
  type FlagLevel,
  type FlagQuestion,
  type FlagRound,
  type FlagScope,
  type FlagSubject,
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

function withoutCode(subjects: readonly FlagSubject[], code: string): FlagSubject[] {
  return subjects.filter((subject) => subject.code !== code);
}

/**
 * Ordered groups of candidates for the wrong answers. Each level walks the
 * groups from left to right, so a level always gets its preferred kind of
 * distractor and only falls back when the scope is too small. In a scope
 * without other regions (the Dutch provinces) the "other regions" group is
 * empty, so every level ends up inside the scope.
 */
function distractorTiers(
  answer: FlagSubject,
  level: FlagLevel,
  pool: readonly FlagSubject[],
): readonly (readonly FlagSubject[])[] {
  const others = withoutCode(pool, answer.code);
  const sameRegion = others.filter((subject) => subject.region === answer.region);
  const otherRegions = others.filter((subject) => subject.region !== answer.region);
  const lookalikeCodesSet = new Set(lookalikeCodes(answer.code));
  const lookalikes = others.filter((subject) => lookalikeCodesSet.has(subject.code));

  switch (level) {
    case "makkelijk":
      return [otherRegions, sameRegion];
    case "gemiddeld":
      return [sameRegion, otherRegions];
    case "moeilijk":
      return [lookalikes, sameRegion, otherRegions];
  }
}

function distractorChoices(
  answer: FlagSubject,
  level: FlagLevel,
  pool: readonly FlagSubject[],
  needed: number,
  random: () => number,
): FlagSubject[] {
  const picked: FlagSubject[] = [];
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
    throw new Error(`Te weinig onderwerpen om ${level} te spelen`);
  }

  return picked;
}

/**
 * Half of the questions show a flag and ask for the name, the other half show a
 * name and ask for the flag. Shuffled, so both directions alternate
 * unpredictably inside one round.
 */
function directionsFor(random: () => number): FlagDirection[] {
  const perDirection = Math.floor(ROUND_SIZE / FLAG_DIRECTIONS.length);

  return shuffle(
    FLAG_DIRECTIONS.flatMap((direction) => Array.from({ length: perDirection }, () => direction)),
    random,
  );
}

function choiceCountFor(scope: FlagScope, level: FlagLevel, poolSize: number): number {
  // The hardest level asks for twelve options; a smaller scope offers all it has.
  if (level === "moeilijk") {
    return Math.min(HARD_LEVEL_CHOICES, poolSize);
  }

  return CHOICE_COUNT[level];
}

export function createRound(
  scope: FlagScope,
  level: FlagLevel,
  seed: number = createSeed(),
): FlagRound {
  const random = mulberry32(seed);
  const pool = subjectsFor(scope);
  const needed = choiceCountFor(scope, level, pool.length) - 1;

  if (pool.length < needed + 1) {
    throw new Error(`Te weinig onderwerpen voor ${scope}`);
  }

  const chosen = shuffle(pool, random).slice(0, Math.min(ROUND_SIZE, pool.length));
  const directions = directionsFor(random);

  const questions: FlagQuestion[] = chosen.map((subject, index) => {
    const choices = shuffle(
      [subject, ...distractorChoices(subject, level, pool, needed, random)],
      random,
    );

    return {
      id: index,
      direction: directions[index] ?? FLAG_DIRECTIONS[0],
      subject,
      choices,
    };
  });

  return { scope, level, seed, questions };
}

function capitalSentence(subject: FlagSubject): string {
  if (!subject.capital) {
    return "";
  }
  // South Africa has three capitals; they are stored as "Bloemfontein, ...".
  const plural = subject.capital.includes(",");
  return ` De ${plural ? "hoofdsteden zijn" : "hoofdstad is"} ${subject.capital}.`;
}

export function explanationFor(question: FlagQuestion): string {
  const { subject, direction } = question;
  const region = regionLabel(subject.region);

  if (direction === "vlag-naar-land") {
    return `Dit is de vlag van ${subject.name}. ${subject.name} ligt in ${region}.${capitalSentence(subject)}`;
  }

  return `De vlag van ${subject.name} is de juiste. ${subject.name} ligt in ${region}.${capitalSentence(subject)}`;
}
