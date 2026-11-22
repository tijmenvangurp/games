import { shuffledIndexes } from "@shared/lib";
import { SYMBOLS, SYMBOL_ORDER } from "./symbols";
import type { CodeTableCell, CodeWordCell, CodeWordRow, Puzzle, WordSet } from "./types";

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  return shuffledIndexes(items.length, random).map((index) => items[index]);
}

function lettersIn(words: readonly string[]): string[] {
  return [...new Set(words.join(""))].sort();
}

function assignSymbols(
  letters: readonly string[],
  random: () => number,
): Readonly<Record<string, string>> {
  const pool = shuffled(SYMBOLS, random);
  const used = new Set<string>();
  const mapping: Record<string, string> = {};

  for (const letter of letters) {
    // Vermijd dat de beginletter van de Nederlandse naam de letter verklapt.
    const preferred = pool.find(
      (symbol) => !used.has(symbol.id) && symbol.name[0]?.toLowerCase() !== letter,
    );
    const fallback = pool.find((symbol) => !used.has(symbol.id));
    const chosen = preferred ?? fallback;
    if (!chosen) {
      throw new Error(`Geen symbool meer voor letter ${letter}`);
    }
    used.add(chosen.id);
    mapping[letter] = chosen.id;
  }

  return mapping;
}

function validateSet(set: WordSet): void {
  if (set.words.length === 0) {
    throw new Error(`Woordenset ${set.id} is leeg`);
  }
  if (new Set(set.words).size !== set.words.length) {
    throw new Error(`Woordenset ${set.id} bevat dubbele woorden`);
  }
  for (const word of set.words) {
    if (!/^[a-z]+$/.test(word)) {
      throw new Error(`Woord ${word} in ${set.id} is niet lowercase a-z`);
    }
  }
}

export function createPuzzle(set: WordSet, random: () => number): Puzzle {
  validateSet(set);

  const letters = lettersIn(set.words);
  const symbolByLetter = assignSymbols(letters, random);

  const table: readonly CodeTableCell[] = letters
    .map((letter) => ({ letter, symbolId: symbolByLetter[letter]! }))
    .sort((first, second) => {
      if (set.level === 1) {
        return (SYMBOL_ORDER[first.symbolId] ?? 0) - (SYMBOL_ORDER[second.symbolId] ?? 0);
      }
      return 0;
    });

  const orderedTable = set.level === 1 ? table : shuffled(table, random);

  const rows: readonly CodeWordRow[] = set.words.map((word) => ({
    word,
    cells: [...word].map<CodeWordCell>((letter) => ({
      letter,
      symbolId: symbolByLetter[letter]!,
    })),
  }));

  return {
    theme: set.theme,
    level: set.level,
    round: set.round,
    set,
    table: orderedTable,
    rows,
  };
}

/** De eerste lege cel van een woord, of -1 als het woord klaar is. */
export function firstEmptyCell(row: CodeWordRow, entries: readonly string[]): number {
  return row.cells.findIndex((_, index) => !entries[index]);
}

export function wordComplete(row: CodeWordRow, entries: readonly string[]): boolean {
  return row.cells.every((_, index) => Boolean(entries[index]));
}
