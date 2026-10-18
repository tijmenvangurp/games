import { describe, expect, it } from "vitest";
import { buildCrossword, POKEMON_CROSSWORD, type CrosswordEntry } from "@entities/crossword";

function entry(answer: string): CrosswordEntry {
  const found = POKEMON_CROSSWORD.entries.find((item) => item.answer === answer);
  if (!found) {
    throw new Error(`Missing entry ${answer}`);
  }
  return found;
}

describe("pokemon crossword", () => {
  it("builds the expected grid and entries", () => {
    expect(POKEMON_CROSSWORD.width).toBe(8);
    expect(POKEMON_CROSSWORD.height).toBe(9);
    expect(POKEMON_CROSSWORD.entries).toHaveLength(6);
    expect(POKEMON_CROSSWORD.entries.filter((item) => item.direction === "across")).toHaveLength(4);
    expect(POKEMON_CROSSWORD.entries.filter((item) => item.direction === "down")).toHaveLength(2);

    expect(entry("BULBASAUR").number).toBe(1);
    expect(entry("ARTICUNO").number).toBe(2);
    expect(entry("SNORLAX").number).toBe(3);
    expect(entry("MAGIKARP").number).toBe(4);
    expect(entry("MEW").number).toBe(4);
    expect(entry("EEVEE").number).toBe(5);
  });

  it("matches every answer to the grid", () => {
    for (const item of POKEMON_CROSSWORD.entries) {
      expect(item.clue.length).toBeGreaterThan(0);
      for (let index = 0; index < item.answer.length; index += 1) {
        const row = item.row + (item.direction === "down" ? index : 0);
        const col = item.col + (item.direction === "across" ? index : 0);
        expect(POKEMON_CROSSWORD.cells[row]?.[col]?.solution).toBe(item.answer[index]);
      }
    }
  });

  it("numbers the start cells", () => {
    const numbered = POKEMON_CROSSWORD.cells
      .flat()
      .filter((cell) => cell.number !== null)
      .map((cell) => cell.number);
    expect(numbered).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("buildCrossword validation", () => {
  it("rejects rows with different lengths", () => {
    expect(() =>
      buildCrossword({
        id: "broken",
        title: "Broken",
        category: "Test",
        grid: ["ABC", "DE"],
        entries: [],
      }),
    ).toThrow();
  });

  it("rejects an answer that does not match the grid", () => {
    expect(() =>
      buildCrossword({
        id: "broken",
        title: "Broken",
        category: "Test",
        grid: ["ABC"],
        entries: [
          {
            direction: "across",
            row: 0,
            col: 0,
            answer: "XYZ",
            clue: "Past niet",
          },
        ],
      }),
    ).toThrow();
  });
});
