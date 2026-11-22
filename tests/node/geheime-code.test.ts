import { describe, expect, it } from "vitest";
import {
  applyAttempt,
  createPuzzle,
  emptyProgress,
  firstEmptyCell,
  LEVELS,
  MAX_LOG_ENTRIES,
  setsFor,
  SYMBOL_ORDER,
  THEMES,
  WORD_SETS,
  wordComplete,
  type Attempt,
  type WordSet,
} from "@entities/geheime-code";
import { mulberry32 } from "@shared/lib";

function lettersOf(set: WordSet): string[] {
  return [...new Set(set.words.join(""))].sort();
}

describe("geheime code: woordensets", () => {
  it("heeft twee gecureerde rondes per thema en niveau", () => {
    expect(WORD_SETS).toHaveLength(THEMES.length * LEVELS.length * 2);
    for (const theme of THEMES) {
      for (const level of LEVELS) {
        expect(setsFor(theme, level)).toHaveLength(2);
      }
    }
  });

  it("houdt de woorden en de legenda binnen de afspraken", () => {
    for (const set of WORD_SETS) {
      expect(new Set(set.words).size).toBe(set.words.length);
      expect(set.words.length).toBeGreaterThanOrEqual(4);
      expect(set.words.length).toBeLessThanOrEqual(6);

      const maxLength = set.level === 1 ? 4 : 6;
      for (const word of set.words) {
        expect(word).toMatch(/^[a-z]+$/);
        expect(word.length).toBeGreaterThanOrEqual(3);
        expect(word.length).toBeLessThanOrEqual(maxLength);
      }

      const letters = lettersOf(set);
      expect(letters.length).toBeLessThanOrEqual(set.level === 1 ? 12 : 14);
    }
  });
});

describe("geheime code: puzzel bouwen", () => {
  it("maakt een bijectie en codeert elk woord", () => {
    for (const [index, set] of WORD_SETS.entries()) {
      const puzzle = createPuzzle(set, mulberry32(1000 + index));
      const letters = lettersOf(set);
      expect(puzzle.table).toHaveLength(letters.length);
      expect(new Set(puzzle.table.map((cell) => cell.letter)).size).toBe(letters.length);
      expect(new Set(puzzle.table.map((cell) => cell.symbolId)).size).toBe(letters.length);
      expect(puzzle.table.map((cell) => cell.letter).sort()).toEqual(letters);

      for (const row of puzzle.rows) {
        expect(row.cells.map((cell) => cell.letter).join("")).toBe(row.word);
        for (const cell of row.cells) {
          const tableCell = puzzle.table.find((entry) => entry.letter === cell.letter);
          expect(tableCell?.symbolId).toBe(cell.symbolId);
        }
      }
    }
  });

  it("geeft niveau 1 een vaste symboolvolgorde en niveau 2/3 een geschudde kaart", () => {
    const levelOne = WORD_SETS.find((set) => set.level === 1);
    const levelTwo = WORD_SETS.find((set) => set.level === 2);
    if (!levelOne || !levelTwo) {
      throw new Error("Geen set gevonden");
    }
    const first = createPuzzle(levelOne, mulberry32(7));
    const ordered = [...first.table].sort(
      (left, right) => (SYMBOL_ORDER[left.symbolId] ?? 0) - (SYMBOL_ORDER[right.symbolId] ?? 0),
    );
    expect(first.table).toEqual(ordered);

    const second = createPuzzle(levelTwo, mulberry32(7));
    expect(second.table).toHaveLength(lettersOf(levelTwo).length);
  });

  it("toont altijd letters in de codekaart", () => {
    for (const set of WORD_SETS.filter((entry) => entry.level === 3)) {
      const puzzle = createPuzzle(set, mulberry32(42));
      expect(puzzle.table.every((cell) => /^[a-z]$/.test(cell.letter))).toBe(true);
    }
  });

  it("is deterministisch voor dezelfde seed", () => {
    const set = WORD_SETS[0];
    if (!set) {
      throw new Error("Geen set");
    }
    expect(createPuzzle(set, mulberry32(99))).toEqual(createPuzzle(set, mulberry32(99)));
  });

  it("vindt de eerste lege cel en herkent een klaar woord", () => {
    const set = WORD_SETS[0];
    if (!set) {
      throw new Error("Geen set");
    }
    const puzzle = createPuzzle(set, mulberry32(1));
    const row = puzzle.rows[0];
    if (!row) {
      throw new Error("Geen rij");
    }
    const empty = row.cells.map(() => "");
    expect(firstEmptyCell(row, empty)).toBe(0);
    expect(wordComplete(row, empty)).toBe(false);
    const filled = row.cells.map((cell) => cell.letter);
    expect(firstEmptyCell(row, filled)).toBe(-1);
    expect(wordComplete(row, filled)).toBe(true);
  });
});

describe("geheime code: voortgang", () => {
  it("bewaart het beste aantal en begrenst het log", () => {
    const base = emptyProgress();
    const attempt: Attempt = {
      theme: "tuin",
      level: 1,
      round: 1,
      firstTry: 3,
      total: 4,
      at: 1,
    };

    let progress = applyAttempt(base, attempt);
    expect(progress.best["tuin-1"]).toBe(3);
    progress = applyAttempt(progress, { ...attempt, firstTry: 2 });
    expect(progress.best["tuin-1"]).toBe(3);
    progress = applyAttempt(progress, { ...attempt, firstTry: 4 });
    expect(progress.best["tuin-1"]).toBe(4);

    for (let index = 0; index < MAX_LOG_ENTRIES + 8; index += 1) {
      progress = applyAttempt(progress, { ...attempt, at: index });
    }
    expect(progress.log).toHaveLength(MAX_LOG_ENTRIES);
  });
});
