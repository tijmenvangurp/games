import { createSeed, mulberry32, shuffledIndexes } from "@shared/lib";
import { MATH_MODE_INFO } from "./config";
import type { MathLevel, MathMode, MathQuestion, MathRound } from "./types";

const ROUND_SIZE = 10;
const MAX_PROMPT_ATTEMPTS = 300;
const MAX_CHOICE_STEPS = 40;

function randomInt(min: number, max: number, random: () => number): number {
  return min + Math.floor(random() * (max - min + 1));
}

interface Operands {
  left: number;
  right: number;
  answer: number;
}

function plusOperands(level: MathLevel, random: () => number): Operands {
  const maxSum = level === "makkelijk" ? 10 : level === "gemiddeld" ? 20 : 100;
  const minLeft = level === "moeilijk" ? 10 : 1;
  const maxLeft = level === "moeilijk" ? maxSum - 10 : maxSum - 1;
  const left = randomInt(minLeft, maxLeft, random);
  const right = randomInt(level === "moeilijk" ? 10 : 1, maxSum - left, random);

  return { left, right, answer: left + right };
}

function minOperands(level: MathLevel, random: () => number): Operands {
  const minLeft = level === "makkelijk" ? 2 : level === "gemiddeld" ? 5 : 20;
  const maxLeft = level === "makkelijk" ? 10 : level === "gemiddeld" ? 20 : 100;
  const left = randomInt(minLeft, maxLeft, random);
  const minRight = level === "moeilijk" ? 5 : 1;
  const right = randomInt(Math.min(minRight, left - 1), left - 1, random);

  return { left, right, answer: left - right };
}

function keerOperands(level: MathLevel, random: () => number): Operands {
  const min = level === "makkelijk" ? 1 : level === "gemiddeld" ? 1 : 6;
  const max = level === "makkelijk" ? 5 : 10;
  const left = randomInt(min, max, random);
  const right = randomInt(min, max, random);

  return { left, right, answer: left * right };
}

function deelOperands(level: MathLevel, random: () => number): Operands {
  const minDivisor = level === "makkelijk" ? 2 : level === "gemiddeld" ? 2 : 6;
  const maxDivisor = level === "makkelijk" ? 5 : 10;
  const minQuotient = level === "makkelijk" ? 1 : level === "gemiddeld" ? 1 : 2;
  const maxQuotient = level === "makkelijk" ? 5 : 10;
  const right = randomInt(minDivisor, maxDivisor, random);
  const answer = randomInt(minQuotient, maxQuotient, random);

  return { left: right * answer, right, answer };
}

function operandsFor(mode: MathMode, level: MathLevel, random: () => number): Operands {
  switch (mode) {
    case "plus":
      return plusOperands(level, random);
    case "min":
      return minOperands(level, random);
    case "keer":
      return keerOperands(level, random);
    case "deel":
      return deelOperands(level, random);
  }
}

function candidateOffsets(mode: MathMode, left: number, right: number): number[] {
  if (mode === "keer" || mode === "deel") {
    return [1, -1, 2, -2, left, -left, right, -right, 10, -10];
  }
  return [1, -1, 2, -2, 10, -10];
}

function addFallbackCandidates(candidates: Set<number>, answer: number): void {
  for (let step = 1; candidates.size < 2 && step < MAX_CHOICE_STEPS; step += 1) {
    if (answer + step >= 0) {
      candidates.add(answer + step);
    }
    if (answer - step >= 0) {
      candidates.add(answer - step);
    }
  }
}

function choiceCandidates(answer: number, mode: MathMode, left: number, right: number): number[] {
  const candidates = new Set<number>();

  for (const offset of candidateOffsets(mode, left, right)) {
    const value = answer + offset;
    if (value >= 0 && value !== answer) {
      candidates.add(value);
    }
  }

  addFallbackCandidates(candidates, answer);
  return [...candidates];
}

function buildChoices(
  answer: number,
  mode: MathMode,
  left: number,
  right: number,
  random: () => number,
): number[] {
  const candidates = choiceCandidates(answer, mode, left, right);
  const pool = candidates.slice(0, 6);
  const distractors = shuffledIndexes(pool.length, random)
    .slice(0, 2)
    .map((index) => pool[index]);
  const options = [answer, ...distractors];

  return shuffledIndexes(options.length, random).map((index) => options[index]);
}

function makeQuestion(
  mode: MathMode,
  level: MathLevel,
  id: number,
  random: () => number,
): MathQuestion {
  const operands = operandsFor(mode, level, random);
  const symbol = MATH_MODE_INFO[mode].symbol;

  return {
    id,
    mode,
    level,
    ...operands,
    prompt: `${operands.left} ${symbol} ${operands.right}`,
    choices: buildChoices(operands.answer, mode, operands.left, operands.right, random),
  };
}

export function createRound(
  mode: MathMode,
  level: MathLevel,
  seed: number = createSeed(),
): MathRound {
  const random = mulberry32(seed);
  const questions: MathQuestion[] = [];
  const prompts = new Set<string>();
  let attempts = 0;

  while (questions.length < ROUND_SIZE && attempts < MAX_PROMPT_ATTEMPTS) {
    attempts += 1;
    const question = makeQuestion(mode, level, questions.length, random);
    if (prompts.has(question.prompt)) {
      continue;
    }
    prompts.add(question.prompt);
    questions.push(question);
  }

  if (questions.length < ROUND_SIZE) {
    throw new Error(`Kon geen ronde maken voor ${mode}/${level}`);
  }

  return { mode, level, seed, questions };
}

interface DotGrouping {
  groups: number;
  perGroup: number;
}

/**
 * De verdeling in groepjes die bij een som hoort. Alleen zinvol voor keer en delen.
 * Bij delen is het aantal groepjes de deler, zodat "15 ÷ 3" als drie groepjes van vijf
 * wordt getekend en niet als vijf groepjes van drie.
 */
export function groupingFor(question: MathQuestion): DotGrouping {
  if (question.mode === "deel") {
    return { groups: question.right, perGroup: question.answer };
  }

  return { groups: question.left, perGroup: question.right };
}

export function explanationFor(question: MathQuestion): string {
  const { mode, left, right, answer } = question;

  switch (mode) {
    case "plus":
      return `${left} + ${right} = ${answer}. Tel verder vanaf ${left}.`;
    case "min":
      return `${left} − ${right} = ${answer}. Tel terug vanaf ${left}.`;
    case "keer": {
      const { groups, perGroup } = groupingFor(question);
      return `${left} × ${right} = ${answer}. Dat zijn ${groups} groepjes van ${perGroup}.`;
    }
    case "deel": {
      const { groups, perGroup } = groupingFor(question);
      return `${left} ÷ ${right} = ${answer}. ${left} eerlijk verdelen over ${groups} groepjes geeft ${perGroup} per groep.`;
    }
  }
}
