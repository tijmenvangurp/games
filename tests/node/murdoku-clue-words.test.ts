import { describe, expect, it } from "vitest";
import { loadMurdokuLevel, type LevelJson } from "@entities/murdoku";
import { clueWords, createMurdokuText, focusView } from "@features/murdoku-game";
import { MURDOKU_FIXTURE } from "./murdoku-fixtures";

type ClueJson = NonNullable<LevelJson["suspects"][number]["clues"]>[number];

/** Een zaak met per verdachte precies één aanwijzing, om de woorden te lezen. */
const LEVEL: LevelJson = {
  ...MURDOKU_FIXTURE,
  suspects: [
    {
      id: "A",
      name: "Anna",
      attributes: { gender: "f" },
      clues: [{ type: "inRoom", room: "1" }],
    },
    {
      id: "B",
      name: "Bram",
      attributes: { gender: "m" },
      clues: [{ type: "onObject", object: "chair" }],
    },
    {
      id: "C",
      name: "Cato",
      attributes: { gender: "f" },
      clues: [{ type: "direction", of: "A", dir: "west" }],
    },
  ],
};

/** Elke aanwijzingsvorm die een tikbaar woord kan opleveren. */
const BROAD_CLUES: { clue: ClueJson; label: string }[] = [
  { clue: { type: "inRow", row: 0 }, label: "rij 1" },
  { clue: { type: "inCol", col: 2 }, label: "kolom 3" },
  { clue: { type: "corner" }, label: "in een hoek" },
  { clue: { type: "atWall" }, label: "tegen een muur" },
  { clue: { type: "outside" }, label: "buiten" },
  { clue: { type: "inside" }, label: "binnen" },
  { clue: { type: "nearWindow" }, label: "een raam" },
  { clue: { type: "nearDoor" }, label: "een deur" },
  { clue: { type: "uniqueOnObject", object: "chair" }, label: "een stoel" },
  { clue: { type: "uniqueNearObject", object: "table" }, label: "een tafel" },
  { clue: { type: "nearObjectAny", objects: ["table", "chair"] }, label: "een tafel" },
  {
    clue: { type: "sameLineAsObject", object: "table", line: "row", room: "any" },
    label: "een tafel",
  },
  { clue: { type: "sameRoomAsObject", object: "bed" }, label: "een bed" },
  { clue: { type: "sameRoom", as: "P0" }, label: "Persoon 0" },
  {
    clue: { type: "directionFromObject", object: "table", dir: "north", room: "any" },
    label: "een tafel",
  },
  {
    clue: { type: "directionFromObject", object: "table", dir: "north", room: "any", all: true },
    label: "elke tafel",
  },
  {
    clue: { type: "besideSameObject", object: "table", mate: { kind: "any" } },
    label: "dezelfde tafel",
  },
  { clue: { type: "not", clue: { type: "onObject", object: "bed" } }, label: "een bed" },
  {
    clue: { type: "and", clues: [{ type: "inRoom", room: "2" }, { type: "corner" }] },
    label: "de gang",
  },
];

const puzzle = loadMurdokuLevel(LEVEL);
const text = createMurdokuText(puzzle);

function wordsOf(personId: string) {
  const suspect = puzzle.suspects.find((person) => person.id === personId);
  if (!suspect) throw new Error(`Onbekende verdachte ${personId}`);
  return clueWords(puzzle, suspect.clues[0], personId, text);
}

describe("tikbare woorden in een aanwijzing", () => {
  it("maakt van een kamer een tikbaar woord en laat de zin verder heel", () => {
    const words = wordsOf("A");

    expect(words.map((word) => word.text).join("")).toBe("Anna stond in de keuken.");
    const room = words.find((word) => word.focus);
    expect(room?.text).toBe("de keuken");
    expect(room?.focus).toEqual({ kind: "room", roomId: "1" });
  });

  it("wijst een object aan", () => {
    const words = wordsOf("B");
    const chair = words.find((word) => word.focus);

    expect(chair?.text).toBe("een stoel");
    expect(chair?.focus).toMatchObject({ kind: "ring" });
    expect(words.map((word) => word.text).join("")).toBe("Bram stond op een stoel.");
  });

  it("wijst een andere persoon en het halfvlak van de richting aan", () => {
    const words = wordsOf("C");
    const person = words.find((word) => word.focus?.kind === "person");
    const direction = words.find((word) => word.focus?.kind === "halfPlane");

    expect(person?.text).toBe("Anna");
    expect(person?.focus).toEqual({ kind: "person", personId: "A" });
    expect(direction?.text).toBe("links van");
    expect(direction?.focus).toEqual({ kind: "halfPlane", of: "A", direction: "west" });
    expect(words.map((word) => word.text).join("")).toBe("Cato stond links van Anna.");
  });

  it("geeft elke aanwijzingsvorm minstens één tikbaar woord", () => {
    const broad = loadMurdokuLevel({
      ...MURDOKU_FIXTURE,
      suspects: BROAD_CLUES.map((entry, index) => ({
        id: `P${index}`,
        name: `Persoon ${index}`,
        attributes: { gender: index % 2 === 0 ? "f" : "m" },
        clues: [entry.clue],
      })),
    });
    const broadText = createMurdokuText(broad);

    BROAD_CLUES.forEach((entry, index) => {
      const suspect = broad.suspects[index];
      const words = clueWords(broad, suspect.clues[0], suspect.id, broadText);

      expect(words.map((word) => word.text).join("")).toBe(
        broadText.clue(suspect.clues[0], suspect.id),
      );
      expect(words.map((word) => word.text)).toContain(entry.label);
      expect(words.some((word) => word.focus)).toBe(true);
    });
  });

  it("vertaalt een tik naar de vakjes en de kamer op het bord", () => {
    const room = focusView(puzzle, { kind: "room", roomId: "1" });
    expect(room.rooms.has("1")).toBe(true);
    expect(room.cells.has(6)).toBe(true);
    expect(room.cells.has(15)).toBe(false);

    const chair = focusView(puzzle, { kind: "ring", cells: [6] });
    expect([...chair.marks.ring]).toEqual([6]);
    expect(chair.cells.has(6)).toBe(true);
  });

  it("licht de vakjes van een persoon op en niets zonder verwijzing", () => {
    const person = focusView(puzzle, { kind: "person", personId: "B" });
    expect(person.cells.size).toBeGreaterThan(0);
    expect(person.cells.has(6)).toBe(true);
    expect(person.marks.areas).toHaveLength(1);

    const empty = focusView(puzzle, null);
    expect(empty.cells.size).toBe(0);
    expect(empty.rooms.size).toBe(0);
    expect(empty.marks.areas).toEqual([]);

    const area = focusView(puzzle, { kind: "area", cells: [0, 1] });
    expect([...area.cells]).toEqual([0, 1]);
    expect(area.marks.areas[0]?.cells.has(0)).toBe(true);
  });

  it("licht bij een richting het hele halfvlak op, niet één cel", () => {
    const placements = new Map([["B", 6]]);
    const south = focusView(puzzle, { kind: "halfPlane", of: "B", direction: "south" }, placements);

    // B staat op rij 2, kolom 3. Elke lagere rij telt, ook andere kolommen.
    expect(south.cells.has(8)).toBe(true);
    expect(south.cells.has(13)).toBe(true);
    expect(south.cells.has(3)).toBe(false);
    expect(south.marks.areas).toHaveLength(1);

    const north = focusView(puzzle, { kind: "halfPlane", of: "B", direction: "north" }, placements);
    expect(north.cells.has(3)).toBe(true);
    expect(north.cells.has(8)).toBe(false);
  });
});
