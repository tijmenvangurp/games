import { describe, expect, it } from "vitest";
import { VICTIM_ID, checkMurdokuLevel, countMurdokuSolutions } from "@entities/murdoku";
import { MURDOKU_FIXTURE, MURDOKU_GENERATED_FIXTURE } from "./murdoku-fixtures";

/**
 * De hintlaag van de engine: `checkMurdokuLevel` geeft naast het verdict een
 * deductiepad met techniek, vakjes en een explanation-key. De UI vertaalt die
 * keys met `MURDOKU_NL_TEXTS`; de engine levert dus nooit Nederlandse zinnen.
 */
describe("murdoku hints", () => {
  it("levert een uitlegbaar deductiepad met engine-keys", () => {
    const { deduction } = checkMurdokuLevel(MURDOKU_FIXTURE);

    expect(deduction.solved).toBe(true);
    expect(deduction.steps.length).toBeGreaterThan(0);
    for (const step of deduction.steps) {
      expect(step.explanation.key).toMatch(/^(step|clue|rule)\./);
    }

    // De eerste hint vernauwt de kandidaten van Anna tot twee vakjes.
    expect(deduction.steps[0]).toMatchObject({
      technique: "clueCandidates",
      personId: "A",
      candidates: [3, 7],
    });
  });

  it("eindigt met de slachtofferregel en de dader", () => {
    const { deduction } = checkMurdokuLevel(MURDOKU_FIXTURE);
    const [victimStep, murdererStep] = deduction.steps.slice(-2);

    expect(victimStep).toMatchObject({
      technique: "victim",
      personId: VICTIM_ID,
      placedCell: 13,
    });
    expect(murdererStep?.explanation.key).toBe("step.murderer");
    expect(deduction.techniqueCounts.murderer).toBe(1);
  });

  it("geeft de moeilijkheid en de zwaarste techniek terug", () => {
    const easy = checkMurdokuLevel(MURDOKU_FIXTURE).deduction;
    const medium = checkMurdokuLevel(MURDOKU_GENERATED_FIXTURE).deduction;

    expect(easy.difficulty).toBe("easy");
    expect(easy.maxRank).toBe(1);
    expect(medium.difficulty).toBe("medium");
    expect(medium.maxRank).toBeGreaterThan(easy.maxRank);
  });

  it("houdt dezelfde oplossing bij de strengere forwardOnly-toets van de generator", () => {
    for (const level of [MURDOKU_FIXTURE, MURDOKU_GENERATED_FIXTURE]) {
      const normal = checkMurdokuLevel(level);
      const forwardOnly = checkMurdokuLevel(level, { forwardOnly: true });

      expect(forwardOnly.solutions).toBe(normal.solutions);
      expect(forwardOnly.unique).toBe(true);
      expect(forwardOnly.solvable).toBe(true);
    }
  });

  it("telt niet meer oplossingen dan de opgegeven limiet", () => {
    expect(countMurdokuSolutions(MURDOKU_FIXTURE, 1)).toBe(1);
    expect(countMurdokuSolutions(MURDOKU_FIXTURE)).toBe(1);
  });
});
