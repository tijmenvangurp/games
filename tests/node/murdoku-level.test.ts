import { describe, expect, it } from "vitest";
import {
  ENGINE_VERSION,
  VICTIM_ID,
  checkMurdokuLevel,
  countMurdokuSolutions,
  findMurdokuMurderer,
  loadMurdokuLevel,
  placementOf,
  validateMurdokuPlacement,
} from "@entities/murdoku";
import {
  MURDOKU_FIXTURE,
  MURDOKU_GENERATED_FIXTURE,
  MURDOKU_SOLUTION,
  placement,
} from "./murdoku-fixtures";

describe("murdoku level laden", () => {
  it("laadt de 4×4-fixture met alle personen en kamers", () => {
    const puzzle = loadMurdokuLevel(MURDOKU_FIXTURE);

    expect(ENGINE_VERSION).toBe("0.1.0");
    expect(puzzle.id).toBe("test-4x4-verjaardag");
    expect(puzzle.board.width).toBe(4);
    expect(puzzle.board.height).toBe(4);
    expect(puzzle.allIds()).toEqual(["A", "B", "C", VICTIM_ID]);
    expect([...puzzle.board.rooms.keys()].sort()).toEqual(["1", "2", "3", "4"]);
  });

  it("weigert een ongeldig level met een duidelijke fout", () => {
    const invalid = {
      ...MURDOKU_FIXTURE,
      roomMap: ["9112", "1112", "3344", "3344"],
    };

    expect(() => loadMurdokuLevel(invalid)).toThrow(/Invalid level: unknown room "9"/);
  });

  it("weigert een level met een onbekend object in de topMap", () => {
    const invalid = {
      ...MURDOKU_FIXTURE,
      topMap: ["zttr", "xxsr", "bxxx", "xrxs"],
    };

    expect(() => loadMurdokuLevel(invalid)).toThrow(/Invalid level: unknown object char "z"/);
  });
});

describe("murdoku bordregels", () => {
  it("bevat precies één persoon per rij en per kolom in de oplossing", () => {
    const check = checkMurdokuLevel(MURDOKU_FIXTURE);
    expect(check.solution).not.toBeNull();

    const cells = [...placementOf(check.solution!).values()];
    const rows = cells.map((cell) => Math.floor(cell / 4));
    const cols = cells.map((cell) => cell % 4);

    expect(rows.sort()).toEqual([0, 1, 2, 3]);
    expect(cols.sort()).toEqual([0, 1, 2, 3]);
  });

  it("laat alleen bedden, stoelen en tapijten toe als bezetbare vakjes", () => {
    const puzzle = loadMurdokuLevel(MURDOKU_FIXTURE);

    expect(puzzle.board.occupiableCells()).toEqual([3, 6, 7, 8, 13, 15]);
    for (const cell of puzzle.board.occupiableCells()) {
      const types = puzzle.board
        .tileAt(cell)
        .objects()
        .map((object) => object.type);
      expect(types.some((type) => type === "bed" || type === "chair" || type === "carpet")).toBe(
        true,
      );
    }

    // Een tafel, doos en plant zijn nooit bezetbaar.
    expect(puzzle.board.isOccupiable(1)).toBe(false);
    expect(puzzle.board.isOccupiable(0)).toBe(false);
    expect(puzzle.board.isOccupiable(15)).toBe(true);
  });

  it("telt een raam tussen twee vakjes aan beide kanten mee", () => {
    const puzzle = loadMurdokuLevel(MURDOKU_FIXTURE);

    // Het raam zit op de grens van (0,3) en (1,3).
    expect(puzzle.board.hasWindow(3)).toBe(true);
    expect(puzzle.board.hasWindow(7)).toBe(true);
    expect(puzzle.board.hasWindow(2)).toBe(false);
  });
});

describe("murdoku oplossingen en dader", () => {
  it("vindt precies één oplossing die met voorwaartse deductie oplosbaar is", () => {
    const check = checkMurdokuLevel(MURDOKU_FIXTURE);

    expect(check.solutions).toBe(1);
    expect(check.unique).toBe(true);
    expect(check.solvable).toBe(true);
    expect(Object.fromEntries(placementOf(check.solution!))).toEqual(MURDOKU_SOLUTION);
    expect(countMurdokuSolutions(MURDOKU_FIXTURE)).toBe(1);
  });

  it("wijst de enige verdachte in de kamer van het slachtoffer als dader aan", () => {
    const puzzle = loadMurdokuLevel(MURDOKU_FIXTURE);
    const check = checkMurdokuLevel(MURDOKU_FIXTURE);
    const murderer = findMurdokuMurderer(puzzle, placementOf(check.solution!));

    expect(murderer.suspectId).toBe("C");
    expect(murderer.roomId).toBe("3");
    expect(murderer.suspectsInRoom).toEqual(["C"]);
  });

  it("geeft geen dader als er twee verdachten bij het slachtoffer staan", () => {
    const puzzle = loadMurdokuLevel(MURDOKU_FIXTURE);
    const murderer = findMurdokuMurderer(puzzle, placement({ A: 0, B: 9, C: 8, [VICTIM_ID]: 13 }));

    expect(murderer.suspectId).toBeNull();
    expect(murderer.suspectsInRoom).toEqual(["B", "C"]);
  });

  it("keurt een volledige, kloppende plaatsing goed", () => {
    expect(validateMurdokuPlacement(MURDOKU_FIXTURE, placement())).toEqual([]);
  });

  it("accepteert een plaatsing ook als gewoon object", () => {
    expect(validateMurdokuPlacement(MURDOKU_FIXTURE, MURDOKU_SOLUTION)).toEqual([]);
  });
});

describe("murdoku fixture uit de MIT-generator", () => {
  it("laadt, is uniek oplosbaar en heeft een unieke dader", () => {
    const check = checkMurdokuLevel(MURDOKU_GENERATED_FIXTURE);

    expect(check.unique).toBe(true);
    expect(check.solvable).toBe(true);
    const murderer = findMurdokuMurderer(
      loadMurdokuLevel(MURDOKU_GENERATED_FIXTURE),
      placementOf(check.solution!),
    );
    expect(murderer.suspectId).not.toBeNull();
    expect(murderer.suspectsInRoom).toEqual([murderer.suspectId]);
  });
});
