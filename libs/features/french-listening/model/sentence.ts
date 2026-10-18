import type { FrenchItem } from "@entities/french";
import { createSeed, mulberry32, shuffledIndexes } from "@shared/lib";

export interface SentenceToken {
  id: number;
  text: string;
}

export function tokenizeSentence(sentence: string): string[] {
  return sentence.split(/\s+/u).filter(Boolean);
}

export function createSentencePuzzle(
  item: Pick<FrenchItem, "fr">,
  seed: number = createSeed(),
): SentenceToken[] {
  const tokens = tokenizeSentence(item.fr);
  return shuffledIndexes(tokens.length, mulberry32(seed)).map((index) => ({
    id: index,
    text: tokens[index],
  }));
}

export function isSentenceCorrect(
  selected: readonly SentenceToken[],
  item: Pick<FrenchItem, "fr">,
): boolean {
  return selected.map((token) => token.text).join(" ") === item.fr;
}
