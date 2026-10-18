import { describe, expect, it } from "vitest";
import { LESSON_ANIMAUX } from "@entities/french";
import {
  createSentencePuzzle,
  isSentenceCorrect,
  tokenizeSentence,
} from "@features/french-listening";

const phrase = LESSON_ANIMAUX.items.find((item) => item.kind === "phrase");
if (!phrase) {
  throw new Error("Geen zin in de les");
}

describe("Franse zinnen bouwen", () => {
  it("splitst een zin in woorden en leestekens", () => {
    expect(tokenizeSentence("Le chat dort sur le canapé.")).toEqual([
      "Le",
      "chat",
      "dort",
      "sur",
      "le",
      "canapé.",
    ]);
  });

  it("maakt een deterministische puzzel met alle tokens", () => {
    const first = createSentencePuzzle(phrase, 11);
    expect(createSentencePuzzle(phrase, 11)).toEqual(first);
    expect(first.map((token) => token.text).sort()).toEqual(tokenizeSentence(phrase.fr).sort());
    expect(new Set(first.map((token) => token.id)).size).toBe(first.length);
  });

  it("keurt alleen de oorspronkelijke volgorde goed", () => {
    const tokens = tokenizeSentence(phrase.fr).map((text, id) => ({ id, text }));
    expect(isSentenceCorrect(tokens, phrase)).toBe(true);
    expect(isSentenceCorrect([...tokens].reverse(), phrase)).toBe(false);
  });
});
