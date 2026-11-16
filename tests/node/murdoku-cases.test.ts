import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  MURDOKU_CASES,
  MURDOKU_DEFAULT_CASE_ID,
  VICTIM_ID,
  murdokuCaseById,
  validateMurdokuCases,
  type MurdokuCase,
} from "@entities/murdoku";
import {
  MURDOKU_LEVELS_FILE,
  checkMurdokuLevelsFile,
  murdokuV1ClueProblems,
} from "../../scripts/lib/murdoku-levels";
import {
  MURDOKU_INTRO_LEVEL,
  MURDOKU_INTRO_LOOT,
  MURDOKU_INTRO_SOLUTION,
} from "@features/murdoku-game";
import { MURDOKU_FIXTURE, MURDOKU_SOLUTION } from "./murdoku-fixtures";

function goodCase(overrides: Partial<MurdokuCase> = {}): MurdokuCase {
  return {
    id: "test-4x4-verjaardag",
    title: "De verdwenen taart",
    intro: "Er is een taart verdwenen. Zoek uit wie er als enige bij de buit was.",
    loot: { name: "de taart", icon: "cake" },
    level: { ...MURDOKU_FIXTURE, id: "test-4x4-verjaardag" },
    solution: MURDOKU_SOLUTION,
    ...overrides,
  };
}

describe("murdoku zaken", () => {
  it("keurt een eigen, unieke en logisch oplosbare zaak goed", () => {
    expect(validateMurdokuCases([goodCase()])).toEqual([]);
  });

  it("meldt een oplossing die de aanwijzingen niet volgt", () => {
    const broken = goodCase({
      solution: { ...MURDOKU_SOLUTION, A: 0 },
    });

    const problems = validateMurdokuCases([broken]);

    expect(problems.join("\n")).toMatch(/oplossing/i);
  });

  it("meldt een ontbrekende buit in de oplossing", () => {
    const broken = goodCase({
      solution: Object.fromEntries(
        Object.entries(MURDOKU_SOLUTION).filter(([id]) => id !== VICTIM_ID),
      ),
    });

    expect(validateMurdokuCases([broken]).join("\n")).toMatch(/buit/i);
  });

  it("meldt een dubbele zaak-id en een lege titel", () => {
    const problems = validateMurdokuCases([goodCase(), goodCase({ title: "  ", intro: "" })]);

    expect(problems.join("\n")).toMatch(/dubbele/i);
    expect(problems.join("\n")).toMatch(/titel/i);
    expect(problems.join("\n")).toMatch(/intro/i);
  });

  it("weigert een overgenomen zaak met een auteur of engine-id", () => {
    const problems = validateMurdokuCases([
      goodCase({
        id: "gen-apartment-864520663",
        level: {
          ...MURDOKU_FIXTURE,
          id: "gen-apartment-864520663",
          author: "Manuel Garand",
        },
      }),
    ]);

    expect(problems.join("\n")).toMatch(/auteur/i);
    expect(problems.join("\n")).toMatch(/eigen id/i);
  });
});

describe("de instapzaak van Wie was het?", () => {
  it("is uniek, vooruit oplosbaar en heeft één dader", () => {
    const intro: MurdokuCase = {
      id: MURDOKU_INTRO_LEVEL.id,
      title: MURDOKU_INTRO_LEVEL.title ?? "",
      intro: "De taart is weg. Zoek uit wie er als enige bij de buit was.",
      loot: MURDOKU_INTRO_LOOT,
      level: MURDOKU_INTRO_LEVEL,
      solution: Object.fromEntries(MURDOKU_INTRO_SOLUTION),
    };

    expect(validateMurdokuCases([intro])).toEqual([]);
  });
});

describe("de twaalf eigen zaken van Wie was het?", () => {
  it("bevat twaalf unieke zaken van 4×4, 5×5 en 6×6", () => {
    expect(MURDOKU_CASES).toHaveLength(12);
    expect(new Set(MURDOKU_CASES.map((entry) => entry.id)).size).toBe(12);
    expect(new Set(MURDOKU_CASES.map((entry) => entry.title)).size).toBe(12);
    expect(new Set(MURDOKU_CASES.map((entry) => entry.intro)).size).toBe(12);

    const sizes = new Set(MURDOKU_CASES.map((entry) => entry.level.size.width));
    expect(sizes).toEqual(new Set([4, 5, 6]));
  });

  it("houdt de standaardzaak en de opzoekfunctie consistent", () => {
    expect(murdokuCaseById(MURDOKU_DEFAULT_CASE_ID)).toBe(MURDOKU_CASES[0]);
    expect(murdokuCaseById("bestaat-niet")).toBeNull();
  });

  it("heeft alleen eigen, unieke en vooruit oplosbare zaken", () => {
    expect(validateMurdokuCases(MURDOKU_CASES)).toEqual([]);
  });

  it("gebruikt Nederlandse titels, intro's en kamersleutels", () => {
    for (const entry of MURDOKU_CASES) {
      expect(entry.title).toMatch(/[a-z]/);
      expect(entry.intro.split(".").length).toBeGreaterThanOrEqual(2);
      expect(entry.level.title).toBe(entry.title);
      for (const room of Object.values(entry.level.rooms)) {
        expect(room.nameKey).toMatch(/^room\.[a-z]+$/);
      }
    }
  });

  it("geeft elke zaak een buit met een lokaal icoon en dezelfde naam in het level", async () => {
    for (const entry of MURDOKU_CASES) {
      expect(entry.loot.name.trim(), entry.id).not.toBe("");
      expect(entry.loot.icon, entry.id).toMatch(/^[a-z0-9-]+$/);
      expect(entry.level.victim.name, entry.id).toBe(entry.loot.name);

      const icon = await readFile(
        path.join(process.cwd(), "apps", "games", "public", "elements", `${entry.loot.icon}.svg`),
        "utf8",
      );
      expect(icon, entry.id).toContain("<svg");
    }
    expect(MURDOKU_INTRO_LEVEL.victim.name).toBe(MURDOKU_INTRO_LOOT.name);
  });

  it("laat titel en intro bij de buit passen en noemt geen verdwenen aquarium", () => {
    const contentWord = (name: string): string =>
      name.replace(/^(de|het|een)\s+/i, "").split(/\s+/)[0] ?? name;

    for (const entry of MURDOKU_CASES) {
      const word = contentWord(entry.loot.name);
      const copy = `${entry.title} ${entry.intro}`.toLowerCase();
      expect(copy, `${entry.id} noemt de buit "${word}"`).toContain(word.toLowerCase());
      expect(copy, entry.id).not.toContain("aquarium");
      expect(copy, entry.id).not.toMatch(/slachtoffer|dader|moord/);
    }
  });
});

describe("de v1-allowlist van de aanwijzingen", () => {
  it("keurt de aanwijzingen van het gecommitte zakenbestand goed", async () => {
    const raw = JSON.parse(await readFile(MURDOKU_LEVELS_FILE, "utf8")) as {
      cases: { id: string; level: Parameters<typeof murdokuV1ClueProblems>[0] }[];
    };

    for (const entry of raw.cases) {
      expect(murdokuV1ClueProblems(entry.level), entry.id).toEqual([]);
    }
  });

  it("bevat geen aanwijzing die de buit als persoon telt", async () => {
    const forbidden = new Set([
      "alone",
      "notAlone",
      "aloneWith",
      "uniqueOnObject",
      "uniqueNearObject",
      "uniqueNearWindow",
      "uniqueNearDoor",
      "uniqueInside",
      "uniqueOutside",
      "roomExists",
      "roomCompanion",
      "roomAttribute",
      "directionFromAttr",
      "countOnObject",
      "emptyRooms",
      "everyRoomCount",
    ]);
    const raw = JSON.parse(await readFile(MURDOKU_LEVELS_FILE, "utf8")) as {
      cases: {
        id: string;
        level: {
          suspects: { clues?: unknown[] }[];
          globalClues?: unknown[];
          boardClues?: unknown[];
        };
      }[];
    };

    const leafTypes = (value: unknown, out: string[]): void => {
      if (typeof value !== "object" || value === null) return;
      const clue = value as { type?: string; clues?: unknown[]; clue?: unknown };
      if (clue.type === "and" || clue.type === "or") {
        for (const child of clue.clues ?? []) leafTypes(child, out);
        return;
      }
      if (clue.type === "not") {
        leafTypes(clue.clue, out);
        return;
      }
      if (clue.type) out.push(clue.type);
    };

    for (const entry of raw.cases) {
      const types: string[] = [];
      for (const suspect of entry.level.suspects) {
        for (const clue of suspect.clues ?? []) leafTypes(clue, types);
      }
      for (const clue of entry.level.globalClues ?? []) leafTypes(clue, types);
      for (const type of types) {
        expect(forbidden.has(type), `${entry.id}: ${type}`).toBe(false);
      }
      expect(entry.level.boardClues ?? [], entry.id).toEqual([]);
    }
  });

  it("wijst geslachts-, baard- en brilaanwijzingen en diagonalen af", () => {
    const level = {
      suspects: [
        {
          id: "A",
          name: "Anna",
          clues: [
            { type: "roomAttribute", quantifier: "none", attribute: "gender", value: "m" },
            { type: "directionFromAttr", attribute: "bald", value: true, dir: "northwest" },
            { type: "direction", of: "B", dir: "southeast" },
          ],
        },
      ],
    } as Parameters<typeof murdokuV1ClueProblems>[0];

    const problems = murdokuV1ClueProblems(level);

    expect(problems.join("\n")).toMatch(/roomAttribute/);
    expect(problems.join("\n")).toMatch(/directionFromAttr/);
    expect(problems.join("\n")).toMatch(/diagonaal southeast/);
  });

  it("wijst aanwijzingen af die de buit als persoon tellen", () => {
    const level = {
      suspects: [
        {
          id: "A",
          name: "Anna",
          clues: [
            { type: "alone" },
            { type: "not", clue: { type: "notAlone" } },
            { type: "uniqueOnObject", object: "chair" },
            { type: "inRoom", room: "1", occupancy: "alone" },
            { type: "sameRoom", as: "B", alone: true },
          ],
        },
      ],
      boardClues: [{ type: "emptyRooms", count: 1 }],
    } as Parameters<typeof murdokuV1ClueProblems>[0];

    const problems = murdokuV1ClueProblems(level).join("\n");

    expect(problems).toMatch(/alone staat niet/);
    expect(problems).toMatch(/notAlone staat niet/);
    expect(problems).toMatch(/uniqueOnObject staat niet/);
    expect(problems).toMatch(/inRoom met een bezetting/);
    expect(problems).toMatch(/sameRoom met alone/);
    expect(problems).toMatch(/bordbrede aanwijzing emptyRooms/);
  });
});

describe("murdoku:levels:check", () => {
  it("keurt het gecommitte zakenbestand goed", { timeout: 30_000 }, async () => {
    await expect(checkMurdokuLevelsFile(MURDOKU_LEVELS_FILE)).resolves.toEqual([]);
  });

  it("faalt op een zaak die niet meer bij de vaste seeds past", { timeout: 30_000 }, async () => {
    const raw = JSON.parse(await readFile(MURDOKU_LEVELS_FILE, "utf8")) as {
      version: number;
      cases: { id: string; solution: Record<string, number> }[];
    };
    const first = raw.cases[0];
    first.solution.A = (first.solution.A + 1) % 16;

    const directory = await mkdtemp(path.join(tmpdir(), "murdoku-check-"));
    const file = path.join(directory, "levels.json");
    await writeFile(file, JSON.stringify(raw), "utf8");

    const problems = await checkMurdokuLevelsFile(file);

    expect(problems.length).toBeGreaterThan(0);
    expect(problems.join("\n")).toMatch(/wijkt af|oplossing/i);
  });
});
