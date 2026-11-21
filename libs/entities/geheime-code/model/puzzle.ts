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

function firstOccurrences(
  words: readonly string[],
  hiddenLetters: readonly string[],
): ReadonlyMap<string, { row: number; cell: number }> {
  const found = new Map<string, { row: number; cell: number }>();

  for (const [row, word] of words.entries()) {
    for (const [cell, letter] of [...word].entries()) {
      if (hiddenLetters.includes(letter) && !found.has(letter)) {
        found.set(letter, { row, cell });
      }
    }
  }

  for (const letter of hiddenLetters) {
    if (!found.has(letter)) {
      throw new Error(`Verborgen letter ${letter} komt niet in de woorden voor`);
    }
  }

  return found;
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
  if (set.level === 3 && (set.hidden?.length ?? 0) === 0) {
    throw new Error(`Niveau 3-set ${set.id} heeft geen verborgen letters`);
  }
  if (set.level !== 3 && set.hidden !== undefined) {
    throw new Error(`Set ${set.id} heeft verborgen letters buiten niveau 3`);
  }
}

export function createPuzzle(set: WordSet, random: () => number): Puzzle {
  validateSet(set);

  const letters = lettersIn(set.words);
  const symbolByLetter = assignSymbols(letters, random);
  const hiddenLetters = set.hidden ?? [];
  const givens = firstOccurrences(set.words, hiddenLetters);

  const table: readonly CodeTableCell[] = letters
    .map((letter) => ({
      letter,
      symbolId: symbolByLetter[letter]!,
      hidden: hiddenLetters.includes(letter),
    }))
    .sort((first, second) => {
      if (set.level === 1) {
        return (SYMBOL_ORDER[first.symbolId] ?? 0) - (SYMBOL_ORDER[second.symbolId] ?? 0);
      }
      return 0;
    });

  const orderedTable = set.level === 1 ? table : shuffled(table, random);

  const rows: readonly CodeWordRow[] = set.words.map((word, rowIndex) => ({
    word,
    cells: [...word].map<CodeWordCell>((letter, cellIndex) => {
      const given = givens.get(letter);
      return {
        letter,
        symbolId: symbolByLetter[letter]!,
        given: given?.row === rowIndex && given.cell === cellIndex,
      };
    }),
  }));

  return {
    theme: set.theme,
    level: set.level,
    round: set.round,
    set,
    table: orderedTable,
    rows,
    hiddenLetters,
  };
}

/** De eerste niet-gegeven lege cel van een woord, of -1 als het woord klaar is. */
export function firstEmptyCell(row: CodeWordRow, entries: readonly string[]): number {
  return row.cells.findIndex((cell, index) => !cell.given && !entries[index]);
}

export function wordComplete(row: CodeWordRow, entries: readonly string[]): boolean {
  return row.cells.every((cell, index) => Boolean(entries[index]));
}
