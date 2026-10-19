import { describe, expect, it } from "vitest";
import {
  MATH_LINES,
  MATH_SPEECH_GROUPS,
  mathFeedbackSpeech,
  mathQuestionSpeech,
  numberSpeech,
  operatorSpeech,
  type MathQuestion,
} from "@entities/math";

const QUESTION: MathQuestion = {
  id: 1,
  mode: "plus",
  level: "makkelijk",
  left: 10,
  right: 5,
  answer: 15,
  prompt: "10 + 5",
  choices: [15, 14, 16],
};

describe("reken-spraak", () => {
  it("bouwt de vraag uit losse getallen en de bewerking", () => {
    expect(mathQuestionSpeech(QUESTION).map((line) => line.id)).toEqual([
      "math-what-is",
      "math-number-10",
      "math-plus",
      "math-number-5",
    ]);
  });

  it("gebruikt de juiste woorden voor delen en vermenigvuldigen", () => {
    expect(operatorSpeech("keer").text).toBe("keer");
    expect(operatorSpeech("deel").text).toBe("gedeeld door");
    expect(operatorSpeech("min").text).toBe("min");
  });

  it("bouwt positieve en negatieve feedback", () => {
    expect(mathFeedbackSpeech(QUESTION, true)).toEqual([MATH_LINES.correct]);
    expect(mathFeedbackSpeech(QUESTION, false).map((line) => line.id)).toEqual([
      "math-answer-prefix",
      "math-number-15",
    ]);
  });

  it("hergebruikt dezelfde getalclips voor antwoorden", () => {
    expect(numberSpeech(15)).toBe(numberSpeech(15));
    expect(numberSpeech(100).text).toBe("honderd");
    expect(() => numberSpeech(101)).toThrow(RangeError);
  });

  it("levert één catalogus met alle getallen, bewerkingen en feedback", () => {
    const lines = MATH_SPEECH_GROUPS.flatMap((group) => group.lines);
    expect(lines).toHaveLength(110);
    expect(new Set(lines.map((line) => line.id)).size).toBe(lines.length);
  });
});
