import type { FrenchExample, FrenchItem } from "../types";

type WordInput = Omit<FrenchItem, "kind" | "reviewed" | "distractors" | "example"> & {
  example: FrenchExample;
};

type PhraseInput = Omit<FrenchItem, "kind" | "reviewed" | "example" | "contrastWith"> & {
  distractors: readonly string[];
};

/** Het id blijft letterlijk, zodat de Engelse betekenissen per item compleet moeten zijn. */
export function word<const Id extends string>(
  input: WordInput & { id: Id },
): FrenchItem & { id: Id } {
  return { ...input, kind: "word", reviewed: true };
}

export function phrase<const Id extends string>(
  input: PhraseInput & { id: Id },
): FrenchItem & { id: Id } {
  return { ...input, kind: "phrase", reviewed: true };
}
