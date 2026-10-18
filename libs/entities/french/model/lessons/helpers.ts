import type { FrenchExample, FrenchItem } from "../types";

type WordInput = Omit<FrenchItem, "kind" | "reviewed" | "distractors" | "example"> & {
  example: FrenchExample;
};

type PhraseInput = Omit<FrenchItem, "kind" | "reviewed" | "example" | "contrastWith"> & {
  distractors: readonly string[];
};

export function word(input: WordInput): FrenchItem {
  return { ...input, kind: "word", reviewed: true };
}

export function phrase(input: PhraseInput): FrenchItem {
  return { ...input, kind: "phrase", reviewed: true };
}
