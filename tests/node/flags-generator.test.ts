import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CONTINENTS,
  COUNTRIES,
  createRound,
  explanationFor,
  FLAG_LEVELS,
  FLAG_LOOKALIKES,
  FLAG_SCOPES,
  flagSrc,
  lookalikeCodes,
  PROVINCES,
  subjectsFor,
  type FlagQuestion,
} from "@entities/geography";

const ASSET_DIR = path.resolve(process.cwd(), "apps/games/public/flags");
const ATLAS_FILE = path.resolve(process.cwd(), "libs/entities/geography/model/world-110m.json");

interface AtlasTopology {
  objects?: {
    countries?: { geometries?: readonly { id?: string }[] };
    land?: unknown;
  };
}

/** Everything a flag can fetch, in the same shape the generator checks. */
const EXTERNAL_REFERENCE =
  /\b(?:href|src)\s*=\s*["'](?!#|data:)[^"']*["']|\burl\(\s*["']?(?!#|data:)[^)"']+/i;

const ALL_SUBJECTS = [...COUNTRIES, ...PROVINCES];

function choicesWithoutAnswer(question: FlagQuestion) {
  return question.choices.filter((choice) => choice.code !== question.subject.code);
}

describe("country data", () => {
  it("holds a complete, consistent country list", () => {
    expect(COUNTRIES.length).toBeGreaterThanOrEqual(190);

    const codes = COUNTRIES.map((country) => country.code);
    const names = COUNTRIES.map((country) => country.name);
    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(names).size).toBe(names.length);

    for (const country of COUNTRIES) {
      expect(country.code).toMatch(/^[a-z]{2}$/);
      expect(country.name.trim()).toBe(country.name);
      expect(country.name.length).toBeGreaterThan(1);
      expect(CONTINENTS).toContain(country.region);
    }
  });

  it("carries the capital, numeric code and coordinates the map needs", () => {
    const numerics = COUNTRIES.map((country) => country.numeric).filter(Boolean);
    expect(new Set(numerics).size).toBe(numerics.length);

    for (const country of COUNTRIES) {
      expect(country.capital.trim()).toBe(country.capital);
      expect(country.capital.length).toBeGreaterThan(1);
      // Kosovo has no ISO 3166-1 numeric code; every other country has three digits.
      expect(country.numeric).toMatch(/^(\d{3})?$/);
      expect(country.latitude).toBeGreaterThanOrEqual(-90);
      expect(country.latitude).toBeLessThanOrEqual(90);
      expect(country.longitude).toBeGreaterThanOrEqual(-180);
      expect(country.longitude).toBeLessThanOrEqual(180);
    }
  });

  it("keeps every continent big enough for a full round", () => {
    for (const continent of CONTINENTS) {
      expect(subjectsFor(continent).length).toBeGreaterThanOrEqual(10);
    }
    expect(subjectsFor("wereld")).toHaveLength(COUNTRIES.length);
  });

  it("builds local flag paths only", () => {
    for (const subject of ALL_SUBJECTS) {
      const src = flagSrc(subject);
      expect(src).toBe(`/flags/${subject.code}.svg`);
      expect(src.startsWith("http")).toBe(false);
    }
  });
});

describe("province data", () => {
  it("holds the twelve provinces with an ISO 3166-2 code", () => {
    expect(PROVINCES).toHaveLength(12);

    const codes = PROVINCES.map((province) => province.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(codes)).toEqual(
      new Set([
        "nl-dr",
        "nl-fl",
        "nl-fr",
        "nl-ge",
        "nl-gr",
        "nl-li",
        "nl-nb",
        "nl-nh",
        "nl-ov",
        "nl-ut",
        "nl-ze",
        "nl-zh",
      ]),
    );

    for (const province of PROVINCES) {
      expect(province.code).toMatch(/^nl-[a-z]{2}$/);
      expect(province.region).toBe("nederland");
      expect(province.name.length).toBeGreaterThan(3);
      expect(province.capital.length).toBeGreaterThan(3);
      expect(province.latitude).toBeGreaterThan(50);
      expect(province.latitude).toBeLessThan(54);
      expect(province.longitude).toBeGreaterThan(3);
      expect(province.longitude).toBeLessThan(8);
    }
  });

  it("does not reuse a country code", () => {
    const countryCodes = new Set(COUNTRIES.map((country) => country.code));
    for (const province of PROVINCES) {
      expect(countryCodes.has(province.code)).toBe(false);
    }
  });

  it("answers the province scope with provinces only", () => {
    expect(subjectsFor("nederland")).toHaveLength(PROVINCES.length);
    expect(subjectsFor("nederland")).not.toContain(COUNTRIES[0]);
  });
});

describe("lookalike list", () => {
  it("only points at existing subjects", () => {
    const known = new Set(ALL_SUBJECTS.map((subject) => subject.code));

    for (const [code, lookalikes] of Object.entries(FLAG_LOOKALIKES)) {
      expect(known.has(code)).toBe(true);
      expect(lookalikes.length).toBeGreaterThan(0);
      for (const lookalike of lookalikes) {
        expect(known.has(lookalike)).toBe(true);
        expect(lookalike).not.toBe(code);
      }
    }
  });

  it("covers the provinces, except the one flag that stands alone", () => {
    const withoutLookalikes = PROVINCES.filter(
      (province) => lookalikeCodes(province.code).length === 0,
    ).map((province) => province.code);

    // Flevoland's flag has no close relative among the other provinces.
    expect(withoutLookalikes).toEqual(["nl-fl"]);
  });
});

describe("flag rounds", () => {
  it("creates ten unique subjects with both directions", () => {
    const round = createRound("wereld", "makkelijk", 7);

    expect(round.questions).toHaveLength(10);
    expect(round.seed).toBe(7);
    expect(new Set(round.questions.map((question) => question.subject.code)).size).toBe(10);

    const directions = round.questions.map((question) => question.direction);
    expect(directions.filter((direction) => direction === "vlag-naar-land")).toHaveLength(5);
    expect(directions.filter((direction) => direction === "land-naar-vlag")).toHaveLength(5);
  });

  it("gives every question distinct choices including the answer", () => {
    for (const level of FLAG_LEVELS) {
      const round = createRound("wereld", level, 11);
      for (const question of round.questions) {
        const expected = level === "makkelijk" ? 3 : 4;
        expect(question.choices).toHaveLength(expected);
        expect(new Set(question.choices.map((choice) => choice.code)).size).toBe(expected);
        expect(question.choices.some((choice) => choice.code === question.subject.code)).toBe(true);
      }
    }
  });

  it("is deterministic for a seed and varies across seeds", () => {
    const first = createRound("europa", "gemiddeld", 123);
    const again = createRound("europa", "gemiddeld", 123);
    const other = createRound("europa", "gemiddeld", 124);

    expect(JSON.stringify(again)).toBe(JSON.stringify(first));
    expect(JSON.stringify(other)).not.toBe(JSON.stringify(first));
  });

  it("picks easy distractors from another region", () => {
    const round = createRound("wereld", "makkelijk", 21);
    for (const question of round.questions) {
      for (const choice of choicesWithoutAnswer(question)) {
        expect(choice.region).not.toBe(question.subject.region);
      }
    }
  });

  it("keeps harder distractors in the same region or in the lookalike list", () => {
    for (const level of ["gemiddeld", "moeilijk"] as const) {
      const round = createRound("wereld", level, 31);
      for (const question of round.questions) {
        const lookalikes = new Set(lookalikeCodes(question.subject.code));
        for (const choice of choicesWithoutAnswer(question)) {
          const related = choice.region === question.subject.region || lookalikes.has(choice.code);
          expect(related).toBe(true);
        }
      }
    }
  });

  it("prefers lookalike flags on the hardest level", () => {
    const rounds = [1, 2, 3, 4, 5].map((seed) => createRound("wereld", "moeilijk", seed));
    const withLookalike = rounds
      .flatMap((round) => round.questions)
      .filter((question) => {
        const lookalikes = new Set(lookalikeCodes(question.subject.code));
        return choicesWithoutAnswer(question).some((choice) => lookalikes.has(choice.code));
      });

    expect(withLookalike.length).toBeGreaterThan(0);
  });

  it("stays inside the chosen scope", () => {
    for (const scope of FLAG_SCOPES.filter((value) => value !== "wereld")) {
      const round = createRound(scope, "gemiddeld", 5);
      const subjects = new Set(subjectsFor(scope).map((subject) => subject.code));
      for (const question of round.questions) {
        expect(question.subject.region).toBe(scope);
        for (const choice of question.choices) {
          expect(subjects.has(choice.code)).toBe(true);
        }
      }
    }
  });

  it("plays a full round of provinces, in both directions", () => {
    const round = createRound("nederland", "moeilijk", 42);

    expect(round.questions).toHaveLength(10);
    expect(new Set(round.questions.map((question) => question.subject.code)).size).toBe(10);
    for (const question of round.questions) {
      expect(question.subject.region).toBe("nederland");
      // The hardest level asks with all twelve provinces.
      expect(question.choices).toHaveLength(12);
      for (const choice of question.choices) {
        expect(choice.region).toBe("nederland");
      }
    }

    const directions = new Set(round.questions.map((question) => question.direction));
    expect(directions).toEqual(new Set(["vlag-naar-land", "land-naar-vlag"]));
  });

  it("keeps four choices for the provinces on lower levels", () => {
    for (const level of ["makkelijk", "gemiddeld"] as const) {
      const round = createRound("nederland", level, 7);
      const expected = level === "makkelijk" ? 3 : 4;
      for (const question of round.questions) {
        expect(question.choices).toHaveLength(expected);
      }
    }
  });

  it("explains the answer with the subject, its region and its capital", () => {
    const countries = createRound("afrika", "makkelijk", 8);
    for (const question of countries.questions) {
      const explanation = explanationFor(question);
      expect(explanation).toContain(question.subject.name);
      expect(explanation).toContain("Afrika");
      expect(explanation).toContain(question.subject.capital);
    }

    const provinces = createRound("nederland", "gemiddeld", 8);
    for (const question of provinces.questions) {
      const explanation = explanationFor(question);
      expect(explanation).toContain(question.subject.name);
      expect(explanation).toContain("Nederland");
      expect(explanation).toContain(question.subject.capital);
    }
  });
});

describe("local flag assets", () => {
  it("has a flag for every subject and nothing else", async () => {
    const files = (await readdir(ASSET_DIR)).filter((file) => file.endsWith(".svg"));
    expect(files).toHaveLength(ALL_SUBJECTS.length);

    for (const subject of ALL_SUBJECTS) {
      const file = path.join(ASSET_DIR, `${subject.code}.svg`);
      expect(existsSync(file)).toBe(true);
      const svg = await readFile(file, "utf8");
      expect(svg).toContain("<svg");
      expect(EXTERNAL_REFERENCE.test(svg)).toBe(false);
    }
  });
});

describe("world atlas", () => {
  it("holds land and country outlines without external references", async () => {
    const raw = await readFile(ATLAS_FILE, "utf8");
    expect(raw.length).toBeLessThan(150_000);
    expect(raw).not.toMatch(/https?:\/\//);

    const topology = JSON.parse(raw) as AtlasTopology;
    const geometries = topology.objects?.countries?.geometries ?? [];
    expect(topology.objects?.land).toBeDefined();
    expect(geometries.length).toBeGreaterThanOrEqual(170);

    const atlasIds = new Set(geometries.map((geometry) => String(geometry.id).padStart(3, "0")));
    const mapped = COUNTRIES.filter((country) => country.numeric);
    const missing = mapped.filter((country) => !atlasIds.has(country.numeric));

    // Natural Earth 1:110m omits the smallest island states. They still get a
    // marker on the map; the rest must have an outline.
    expect(missing.length / mapped.length).toBeLessThan(0.2);
    for (const id of ["076", "250", "528", "710", "840"]) {
      expect(atlasIds.has(id)).toBe(true);
    }
  });
});
