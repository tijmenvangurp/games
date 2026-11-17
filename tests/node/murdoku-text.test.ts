import { describe, expect, it } from "vitest";
import {
  MURDOKU_CASES,
  findMurdokuMurderer,
  loadMurdokuLevel,
  validateMurdokuPlacement,
  type LevelJson,
} from "@entities/murdoku";
import {
  MURDOKU_NL_TEXTS,
  MURDOKU_INTRO_LEVEL,
  MURDOKU_INTRO_SOLUTION,
  createMurdokuText,
} from "@features/murdoku-game";
import { MURDOKU_FIXTURE } from "./murdoku-fixtures";

/** Een level met per verdachte precies één v1-aanwijzing, om alle zinnen te lezen. */
const TEXT_LEVEL: LevelJson = {
  ...MURDOKU_FIXTURE,
  suspects: [
    {
      id: "A",
      name: "Anna",
      attributes: { gender: "f" },
      clues: [{ type: "onObject", object: "bed" }],
    },
    {
      id: "B",
      name: "Bram",
      attributes: { gender: "m" },
      clues: [{ type: "nearObject", object: "table" }],
    },
    {
      id: "C",
      name: "Cato",
      attributes: { gender: "f" },
      clues: [{ type: "nearWindow" }],
    },
    {
      id: "D",
      name: "Dries",
      attributes: { gender: "m" },
      clues: [{ type: "corner" }],
    },
    {
      id: "E",
      name: "Els",
      attributes: { gender: "f" },
      clues: [{ type: "inRoom", room: "2" }],
    },
    {
      id: "F",
      name: "Finn",
      attributes: { gender: "m" },
      clues: [{ type: "inRow", row: 0 }],
    },
    {
      id: "G",
      name: "Guus",
      attributes: { gender: "m" },
      clues: [{ type: "inCol", col: 2 }],
    },
    {
      id: "H",
      name: "Hilde",
      attributes: { gender: "f" },
      clues: [{ type: "alone" }],
    },
    {
      id: "I",
      name: "Iris",
      attributes: { gender: "f" },
      clues: [{ type: "sameRoom", as: "A", alone: true }],
    },
    {
      id: "J",
      name: "Joost",
      attributes: { gender: "m" },
      clues: [{ type: "uniqueOnObject", object: "chair" }],
    },
    {
      id: "K",
      name: "Karlijn",
      attributes: { gender: "f" },
      clues: [{ type: "direction", of: "A", dir: "west" }],
    },
    {
      id: "L",
      name: "Lars",
      attributes: { gender: "m" },
      clues: [{ type: "not", clue: { type: "onObject", object: "bed" } }],
    },
    {
      id: "M",
      name: "Mila",
      attributes: { gender: "f" },
      clues: [{ type: "roomCompanion", count: 1, attribute: "gender", value: "f" }],
    },
  ],
};

const puzzle = loadMurdokuLevel(TEXT_LEVEL);
const text = createMurdokuText(puzzle);

function firstClue(personId: string): string {
  const suspect = puzzle.suspects.find((person) => person.id === personId);
  if (!suspect) throw new Error(`Onbekende verdachte ${personId}`);
  return text.clue(suspect.clues[0], personId);
}

describe("Nederlandse aanwijzingen", () => {
  it("maakt van elke v1-aanwijzing een volledige zin met de naam", () => {
    expect(firstClue("A")).toBe("Anna stond op een bed.");
    expect(firstClue("B")).toBe("Bram stond naast een tafel.");
    expect(firstClue("C")).toBe("Cato stond bij een raam.");
    expect(firstClue("D")).toBe("Dries stond in een hoek.");
    expect(firstClue("E")).toBe("Els stond in de gang.");
    expect(firstClue("F")).toBe("Finn stond in rij 1.");
    expect(firstClue("G")).toBe("Guus stond in kolom 3.");
    expect(firstClue("H")).toBe("Hilde stond alleen in de kamer.");
    expect(firstClue("I")).toBe("Iris was alleen in een kamer met Anna.");
    expect(firstClue("J")).toBe("Joost was de enige op een stoel.");
    expect(firstClue("K")).toBe("Karlijn stond links van Anna.");
    expect(firstClue("L")).toBe("Lars stond niet op een bed.");
    expect(firstClue("M")).toBe("Mila stond alleen met een vrouwelijke verdachte.");
  });

  it("houdt de kamernaam, het object en de richting in gewone taal", () => {
    expect(text.roomName("room.keuken")).toBe("keuken");
    expect(text.roomName("room.badkamer")).toBe("badkamer");
    expect(text.roomName("room.forest")).toBe("bos");
    expect(text.objectName("chair")).toBe("Stoel");
    expect(text.objectName("shelf")).toBe("Boekenkast");
    expect(text.direction("north")).toBe("boven");
    expect(text.direction("west")).toBe("links");
    expect(text.directionPhrase("north")).toBe("in een hogere rij dan");
    expect(text.directionPhrase("south")).toBe("in een lagere rij dan");
    expect(text.directionPhrase("east")).toBe("rechts van");
    expect(text.directionPhrase("west")).toBe("links van");
  });

  it("maakt de vier richtingen expliciet en zonder 'van'-fout", () => {
    const level: LevelJson = {
      ...MURDOKU_FIXTURE,
      suspects: [
        {
          id: "P0",
          name: "Daan",
          attributes: { gender: "m" },
          clues: [{ type: "direction", of: "P1", dir: "north" }],
        },
        {
          id: "P1",
          name: "Cato",
          attributes: { gender: "f" },
          clues: [{ type: "direction", of: "P0", dir: "south" }],
        },
        {
          id: "P2",
          name: "Eva",
          attributes: { gender: "f" },
          clues: [{ type: "direction", of: "P0", dir: "east" }],
        },
        {
          id: "P3",
          name: "Finn",
          attributes: { gender: "m" },
          clues: [{ type: "direction", of: "P0", dir: "west" }],
        },
      ],
    };
    const directionPuzzle = loadMurdokuLevel(level);
    const directionText = createMurdokuText(directionPuzzle);

    expect(directionText.clue(directionPuzzle.suspects[0]!.clues[0], "P0")).toBe(
      "Daan stond in een hogere rij dan Cato.",
    );
    expect(directionText.clue(directionPuzzle.suspects[1]!.clues[0], "P1")).toBe(
      "Cato stond in een lagere rij dan Daan.",
    );
    expect(directionText.clue(directionPuzzle.suspects[2]!.clues[0], "P2")).toBe(
      "Eva stond rechts van Daan.",
    );
    expect(directionText.clue(directionPuzzle.suspects[3]!.clues[0], "P3")).toBe(
      "Finn stond links van Daan.",
    );
  });

  it("gebruikt dezelfde richting in een object-aanwijzing", () => {
    const level: LevelJson = {
      ...MURDOKU_FIXTURE,
      suspects: [
        {
          id: "A",
          name: "Anna",
          attributes: { gender: "f" },
          clues: [{ type: "directionFromObject", object: "table", dir: "north", room: "any" }],
        },
      ],
    };
    const objectPuzzle = loadMurdokuLevel(level);
    const objectText = createMurdokuText(objectPuzzle);

    expect(objectText.clue(objectPuzzle.suspects[0]!.clues[0], "A")).toBe(
      "Anna stond in een hogere rij dan een tafel.",
    );
  });

  it("levert de vaste bordregels als lopende tekst", () => {
    expect(text.rule("aloneWithVictim")).toBe(
      "De buit is in een kamer met precies één verdachte. Die verdachte is de dief.",
    );
    expect(text.rule("oneEachLine")).toBe("Iedereen staat in een eigen rij en kolom.");
  });

  it("gebruikt het juiste lidwoord bij een het-kamer", () => {
    const forestLevel: LevelJson = {
      ...TEXT_LEVEL,
      rooms: {
        ...TEXT_LEVEL.rooms,
        "2": { nameKey: "room.forest", color: TEXT_LEVEL.rooms["2"].color },
      },
    };
    const forestPuzzle = loadMurdokuLevel(forestLevel);
    const forestText = createMurdokuText(forestPuzzle);
    const els = forestPuzzle.suspects.find((person) => person.id === "E");

    expect(els).toBeDefined();
    expect(forestText.clue(els!.clues[0], "E")).toBe("Els stond in het bos.");
  });

  it("dekt alle 73 aanwijzingstemplates", () => {
    const clue = MURDOKU_NL_TEXTS.clue as Record<string, unknown>;
    expect(Object.keys(clue)).toHaveLength(73);

    for (const key of [
      "onObject",
      "nearObject",
      "nearWindow",
      "corner",
      "inRoom",
      "inRow",
      "inCol",
      "alone",
      "aloneWith",
      "uniqueOnObject",
      "direction",
      "not",
    ]) {
      expect(clue[key]).toBeTypeOf("string");
      expect(clue[key]).not.toBe("");
    }
  });
});

describe("de twaalf eigen zaken", () => {
  it("maakt van elke aanwijzing een Nederlandse zin zonder sleutels", () => {
    for (const entry of MURDOKU_CASES) {
      const casePuzzle = loadMurdokuLevel(entry.level);
      const caseText = createMurdokuText(casePuzzle);

      for (const suspect of casePuzzle.suspects) {
        for (const clue of suspect.clues) {
          const sentence = caseText.clue(clue, suspect.id);
          expect(sentence).toMatch(/^[A-Z].*\.$/);
          expect(sentence).not.toMatch(/\b(?:clue|room|object|attr|dir)\.|[[{]/);
        }
      }
      for (const room of casePuzzle.board.rooms.values()) {
        expect(caseText.roomName(room.nameKey)).not.toMatch(/^room\./);
      }
    }
  });
});

describe("instapzaak", () => {
  it("laadt de 4×4-fixture met vier kamers en drie verdachten", () => {
    const intro = loadMurdokuLevel(MURDOKU_INTRO_LEVEL);

    expect(intro.board.width).toBe(4);
    expect(intro.board.height).toBe(4);
    expect([...intro.board.rooms.keys()]).toEqual(["1", "2", "3", "4"]);
    expect(intro.suspects).toHaveLength(3);
  });

  it("heeft een kloppende oplossing en één dader in de kamer van het slachtoffer", () => {
    expect(validateMurdokuPlacement(MURDOKU_INTRO_LEVEL, MURDOKU_INTRO_SOLUTION)).toEqual([]);
    expect(findMurdokuMurderer(MURDOKU_INTRO_LEVEL, MURDOKU_INTRO_SOLUTION)).toMatchObject({
      suspectId: "C",
      roomId: "4",
    });
  });
});
