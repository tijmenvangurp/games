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
import { MURDOKU_INTRO_LEVEL, MURDOKU_INTRO_SOLUTION } from "@features/murdoku-game";
import { MURDOKU_FIXTURE, MURDOKU_SOLUTION } from "./murdoku-fixtures";

function goodCase(overrides: Partial<MurdokuCase> = {}): MurdokuCase {
  return {
    id: "test-4x4-verjaardag",
    title: "De verdwenen taart",
    intro: "Er is een taart verdwenen. Zoek uit wie er als enige bij Vera was.",
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

  it("meldt een ontbrekend slachtoffer in de oplossing", () => {
    const broken = goodCase({
      solution: Object.fromEntries(
        Object.entries(MURDOKU_SOLUTION).filter(([id]) => id !== VICTIM_ID),
      ),
    });

    expect(validateMurdokuCases([broken]).join("\n")).toMatch(/slachtoffer/i);
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
      intro: "De taart is weg. Zoek uit wie er als enige bij Vera was.",
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
