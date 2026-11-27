import { afterEach, describe, expect, it } from "vitest";
import {
  ELEMENT_CATEGORIES,
  ELEMENTS,
  MISSIONS,
  categoryLabel,
  elementFact,
  elementName,
  missionTitle,
} from "@entities/alchemy";
import {
  COUNTRIES,
  FLAG_LEVELS,
  FLAG_SCOPES,
  PROVINCES,
  createRound,
  directionPrompt,
  explanationFor,
  flagLevelLabel,
  flagScopeHint,
  flagScopeLabel,
  levelHint,
  subjectName,
  subjectNameInSentence,
  type FlagQuestion,
  type FlagSubject,
} from "@entities/geography";
import { setLanguage } from "@shared/i18n";
import { ENGLISH_CAPITALS } from "../../libs/entities/geography/model/names-en";

afterEach(() => {
  setLanguage("nl");
});

function subject(code: string): FlagSubject {
  const found = [...COUNTRIES, ...PROVINCES].find((candidate) => candidate.code === code);
  if (!found) {
    throw new Error(`Onbekend onderwerp ${code}`);
  }
  return found;
}

function question(code: string, direction: FlagQuestion["direction"]): FlagQuestion {
  const answer = subject(code);
  return { id: 0, direction, subject: answer, choices: [answer] };
}

describe("Mengelmoes in het Engels", () => {
  it("geeft elk element een eigen Engelse naam en een weetje", () => {
    const names = ELEMENTS.map((element) => elementName(element.id, "en"));

    for (const element of ELEMENTS) {
      expect(elementName(element.id, "en").trim().length).toBeGreaterThan(1);
      expect(elementFact(element.id, "en")).toMatch(/^[A-Z].*\.$/);
    }
    expect(new Set(names).size).toBe(names.length);
  });

  it("houdt het Nederlands gelijk aan de bron", () => {
    for (const element of ELEMENTS) {
      expect(elementName(element.id, "nl")).toBe(element.name);
      expect(elementFact(element.id, "nl")).toBe(element.fact);
    }
    expect(elementName("steam")).toBe("Stoom");
  });

  it("volgt de actieve taal als er geen taal is meegegeven", () => {
    setLanguage("en");

    expect(elementName("steam")).toBe("Steam");
    expect(elementFact("mud")).toBe("Mud is wet earth.");
    expect(categoryLabel("food")).toBe("Food");
    expect(missionTitle(MISSIONS[0]!)).toBe("Make mud.");
  });

  it("valt terug op het id of een leeg weetje bij een onbekend element", () => {
    expect(elementName("onbekend", "en")).toBe("onbekend");
    expect(elementFact("onbekend", "en")).toBe("");
    expect(elementFact("onbekend", "nl")).toBe("");
  });

  it("vertaalt categorieën en opdrachten", () => {
    for (const category of ELEMENT_CATEGORIES) {
      expect(categoryLabel(category, "en").length).toBeGreaterThan(2);
    }
    expect(categoryLabel("tech", "nl")).toBe("Techniek");
    expect(categoryLabel("tech", "en")).toBe("Technology");

    for (const mission of MISSIONS) {
      expect(missionTitle(mission, "en")).toMatch(/^[A-Z].*\.$/);
      expect(missionTitle(mission, "nl")).toBe(mission.title);
    }
    expect(missionTitle({ id: "nieuw", title: "Maak iets.", target: "mud", set: 1 }, "en")).toBe(
      "Maak iets.",
    );
  });
});

describe("Vlaggenreis in het Engels", () => {
  it("heeft voor elk land een Engelse naam en hoofdstad", () => {
    const codes = COUNTRIES.map((country) => country.code).sort();
    expect(Object.keys(ENGLISH_CAPITALS).sort()).toEqual(codes);

    const names = COUNTRIES.map((country) => subjectName(country, "en"));
    expect(new Set(names).size).toBe(names.length);
    for (const country of COUNTRIES) {
      const name = subjectName(country, "en");
      expect(name).not.toBe(country.code.toUpperCase());
      expect(name).not.toMatch(/&|\(/);
      expect(ENGLISH_CAPITALS[country.code]?.trim().length).toBeGreaterThan(1);
    }
  });

  it("gebruikt gewone Engelse namen en lidwoorden in een zin", () => {
    expect(subjectName(subject("de"), "en")).toBe("Germany");
    expect(subjectName(subject("ba"), "en")).toBe("Bosnia and Herzegovina");
    expect(subjectName(subject("nl"), "en")).toBe("Netherlands");
    expect(subjectNameInSentence(subject("nl"), "en")).toBe("the Netherlands");
    expect(subjectNameInSentence(subject("de"), "en")).toBe("Germany");
    expect(subjectNameInSentence(subject("nl"), "nl")).toBe("Nederland");
    expect(subjectName(subject("de"))).toBe("Duitsland");
  });

  it("houdt provincienamen en hun hoofdsteden als eigennamen", () => {
    for (const province of PROVINCES) {
      expect(subjectName(province, "en")).toBe(province.name);
    }

    const explanation = explanationFor(question("nl-gr", "vlag-naar-land"), "en");
    expect(explanation).toBe(
      "This is the flag of Groningen. It is in the Netherlands. The capital is Groningen.",
    );
  });

  it("legt het antwoord uit met Engelse hoofdsteden", () => {
    expect(explanationFor(question("de", "vlag-naar-land"), "en")).toBe(
      "This is the flag of Germany. It is in Europe. The capital is Berlin.",
    );
    expect(explanationFor(question("gb", "land-naar-vlag"), "en")).toBe(
      "The flag of the United Kingdom is the right one. It is in Europe. The capital is London.",
    );
    expect(explanationFor(question("za", "vlag-naar-land"), "en")).toBe(
      "This is the flag of South Africa. It is in Africa. The capitals are Bloemfontein, Cape Town, Pretoria.",
    );
    expect(explanationFor(question("de", "vlag-naar-land"), "nl")).toBe(
      "Dit is de vlag van Duitsland. Duitsland ligt in Europa. De hoofdstad is Berlijn.",
    );

    setLanguage("en");
    expect(explanationFor(question("fr", "vlag-naar-land"))).toContain("The capital is Paris.");
  });

  it("valt terug op de Nederlandse gegevens voor een onbekend onderwerp", () => {
    const unknown: FlagSubject = {
      code: "zz",
      name: "Testland",
      region: "europa",
      capital: "",
      latitude: 0,
      longitude: 0,
    };

    expect(subjectName(unknown, "en")).toBe("Testland");
    expect(subjectNameInSentence(unknown, "en")).toBe("Testland");
    expect(
      explanationFor({ id: 0, direction: "vlag-naar-land", subject: unknown, choices: [] }, "en"),
    ).toBe("This is the flag of Testland. It is in Europe.");
    expect(
      explanationFor(
        {
          id: 0,
          direction: "vlag-naar-land",
          subject: { ...unknown, capital: "Testdorp" },
          choices: [],
        },
        "en",
      ),
    ).toBe("This is the flag of Testland. It is in Europe. The capital is Testdorp.");
  });

  it("vertaalt gebieden, niveaus en vragen", () => {
    for (const scope of FLAG_SCOPES) {
      expect(flagScopeLabel(scope, "en").length).toBeGreaterThan(2);
      expect(flagScopeHint(scope, "en")).toMatch(/countries|provinces/);
      for (const level of FLAG_LEVELS) {
        expect(levelHint(level, scope, "en")).toMatch(/choices|provinces/);
      }
    }
    expect(flagScopeLabel("wereld", "en")).toBe("Whole world");
    expect(flagScopeHint("wereld", "en")).toBe(`All ${COUNTRIES.length} countries`);
    expect(flagScopeHint("nederland", "en")).toBe("12 provinces");
    expect(flagLevelLabel("moeilijk", "en")).toBe("Hard");
    expect(levelHint("makkelijk", "europa", "en")).toBe("3 choices");
    expect(levelHint("gemiddeld", "europa", "en")).toBe("4 choices");
    expect(levelHint("moeilijk", "nederland", "en")).toBe("All 12 provinces");
    expect(levelHint("moeilijk", "wereld", "en")).toBe("12 choices from the whole world");
    expect(levelHint("moeilijk", "azie", "en")).toBe("12 choices from the same continent");
    expect(levelHint("moeilijk", "azie", "nl")).toBe("12 keuzes uit hetzelfde continent");
    expect(directionPrompt("vlag-naar-land", "europa", "en")).toBe(
      "Which country does this flag belong to?",
    );
    expect(directionPrompt("land-naar-vlag", "nederland", "en")).toBe(
      "Which flag belongs to this province?",
    );

    setLanguage("en");
    expect(flagScopeLabel("europa")).toBe("Europe");
    expect(flagScopeHint("europa")).toMatch(/^\d+ countries$/);
    expect(flagLevelLabel("makkelijk")).toBe("Easy");
    expect(levelHint("makkelijk", "europa")).toBe("3 choices");
    expect(directionPrompt("land-naar-vlag", "europa")).toBe("Which flag belongs to this country?");
  });

  it("laat de ronde zelf ongemoeid", () => {
    const round = createRound("europa", "makkelijk", 7);
    setLanguage("en");
    expect(createRound("europa", "makkelijk", 7)).toEqual(round);
  });
});
