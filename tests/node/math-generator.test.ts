import { describe, expect, it } from "vitest";
import {
  createRound,
  explanationFor,
  groupingFor,
  levelHint,
  MATH_LEVELS,
  MATH_MODES,
  type MathLevel,
  type MathMode,
  type MathQuestion,
} from "@entities/math";

function expectedAnswer(mode: MathMode, left: number, right: number): number {
  switch (mode) {
    case "plus":
      return left + right;
    case "min":
      return left - right;
    case "keer":
      return left * right;
    case "deel":
      return left / right;
  }
}

function factorRange(mode: MathMode, level: MathLevel): [number, number] {
  if (mode === "keer") {
    if (level === "makkelijk") {
      return [1, 5];
    }
    if (level === "gemiddeld") {
      return [1, 10];
    }
    return [6, 10];
  }

  if (level === "makkelijk") {
    return [2, 5];
  }
  if (level === "gemiddeld") {
    return [2, 10];
  }
  return [6, 10];
}

function expectValidQuestion(question: MathQuestion, mode: MathMode, level: MathLevel): void {
  expect(question.mode).toBe(mode);
  expect(question.level).toBe(level);
  expect(question.left).toBeGreaterThan(0);
  expect(question.right).toBeGreaterThan(0);
  expect(question.answer).toBe(expectedAnswer(mode, question.left, question.right));
  expect(question.answer).toBeGreaterThanOrEqual(0);
  expect(question.answer).toBeLessThanOrEqual(100);

  expect(question.choices).toHaveLength(3);
  expect(new Set(question.choices).size).toBe(3);
  expect(question.choices).toContain(question.answer);
  for (const choice of question.choices) {
    expect(Number.isInteger(choice)).toBe(true);
    expect(choice).toBeGreaterThanOrEqual(0);
  }

  if (mode === "min") {
    expect(question.left).toBeGreaterThan(question.right);
  }

  if (mode === "deel") {
    expect(question.left % question.right).toBe(0);
    const [min, max] = factorRange(mode, level);
    expect(question.right).toBeGreaterThanOrEqual(min);
    expect(question.right).toBeLessThanOrEqual(max);
  }

  if (mode === "plus" && level === "makkelijk") {
    expect(question.answer).toBeLessThanOrEqual(10);
  }
  if (mode === "plus" && level === "gemiddeld") {
    expect(question.answer).toBeLessThanOrEqual(20);
  }
}

describe("createRound", () => {
  for (const mode of MATH_MODES) {
    for (const level of MATH_LEVELS) {
      it(`creates ten valid ${mode}/${level} questions`, () => {
        const round = createRound(mode, level, 42);

        expect(round.mode).toBe(mode);
        expect(round.level).toBe(level);
        expect(round.questions).toHaveLength(10);
        expect(new Set(round.questions.map((question) => question.prompt)).size).toBe(10);

        for (const question of round.questions) {
          expectValidQuestion(question, mode, level);
        }
      });
    }
  }

  it("is deterministic for the same seed", () => {
    const first = createRound("keer", "gemiddeld", 7);
    const second = createRound("keer", "gemiddeld", 7);

    expect(second.questions.map((question) => question.prompt)).toEqual(
      first.questions.map((question) => question.prompt),
    );
    expect(second.questions.map((question) => question.choices)).toEqual(
      first.questions.map((question) => question.choices),
    );
  });
});

describe("groupingFor", () => {
  it("draws a division as quotient groups of divisor dots", () => {
    for (const level of MATH_LEVELS) {
      for (const question of createRound("deel", level, 5).questions) {
        const { groups, perGroup } = groupingFor(question);

        expect(groups).toBe(question.answer);
        expect(perGroup).toBe(question.right);
        expect(groups * perGroup).toBe(question.left);
      }
    }
  });

  it("keeps a multiplication as left groups of right dots", () => {
    for (const level of MATH_LEVELS) {
      for (const question of createRound("keer", level, 5).questions) {
        const { groups, perGroup } = groupingFor(question);

        expect(groups).toBe(question.left);
        expect(perGroup).toBe(question.right);
      }
    }
  });
});

describe("explanations and hints", () => {
  it("explains every mode", () => {
    for (const mode of MATH_MODES) {
      const round = createRound(mode, "makkelijk", 3);
      const question = round.questions[0];
      if (!question) {
        throw new Error("No question");
      }
      expect(explanationFor(question)).toContain(String(question.answer));
    }
  });

  it("gives a hint per mode and level", () => {
    for (const mode of MATH_MODES) {
      for (const level of MATH_LEVELS) {
        expect(levelHint(mode, level)).not.toHaveLength(0);
      }
    }
  });
});
