import { describe, expect, it } from "vitest";
import { initialAdaptiveState, type AdaptiveState } from "@entities/adaptive";
import { MURDOKU_DEFAULT_CASE_ID, MURDOKU_LEVELS, murdokuClueCount } from "@entities/murdoku";
import { MURDOKU_ADAPTIVE_CONFIG, evaluateMurdokuRound } from "@features/murdoku-game";

function state(levelIndex: number): AdaptiveState {
  return initialAdaptiveState({ ...MURDOKU_ADAPTIVE_CONFIG, startIndex: levelIndex });
}

function solved(levelIndex: number, hints: number) {
  return evaluateMurdokuRound(state(levelIndex), {
    caseId: "de-verdwenen-taart",
    solved: true,
    abandoned: false,
    hints,
    durationMs: 120_000,
    at: 1_700_000_000_000,
  });
}

function abandoned(levelIndex: number, hints = 0) {
  return evaluateMurdokuRound(state(levelIndex), {
    caseId: "de-verdwenen-taart",
    solved: false,
    abandoned: true,
    hints,
    durationMs: 60_000,
    at: 1_700_000_000_000,
  });
}

describe("de niveaus van Wie was het?", () => {
  it("ordent de zaken op bordgrootte en daarna op aanwijzingsdichtheid", () => {
    expect(MURDOKU_LEVELS).toHaveLength(12);

    for (let index = 1; index < MURDOKU_LEVELS.length; index++) {
      const previous = MURDOKU_LEVELS[index - 1];
      const current = MURDOKU_LEVELS[index];
      const previousSize = previous.level.size.width * previous.level.size.height;
      const currentSize = current.level.size.width * current.level.size.height;

      expect(currentSize).toBeGreaterThanOrEqual(previousSize);
      if (currentSize === previousSize) {
        expect(murdokuClueCount(current) / currentSize).toBeGreaterThanOrEqual(
          murdokuClueCount(previous) / previousSize,
        );
      }
    }
  });

  it("begint bij een 4×4-zaak en heeft twaalf niveaus", () => {
    expect(MURDOKU_ADAPTIVE_CONFIG.levelCount).toBe(MURDOKU_LEVELS.length);
    expect(MURDOKU_ADAPTIVE_CONFIG.startIndex).toBe(0);
    expect(MURDOKU_LEVELS[0].level.size.width).toBe(4);
    expect(MURDOKU_LEVELS[0].id).toBe(MURDOKU_DEFAULT_CASE_ID);
  });
});

describe("het adaptieve niveau per zaak", () => {
  it("gaat één stap omhoog na een oplossing met hooguit één hint", () => {
    for (const hints of [0, 1]) {
      const result = solved(2, hints);
      expect(result.summary.delta).toBe(1);
      expect(result.summary.state.levelIndex).toBe(3);
      expect(result.summary.stuck).toBe(false);
    }
  });

  it("blijft staan na een oplossing met twee hints", () => {
    const result = solved(2, 2);
    expect(result.summary.delta).toBe(0);
    expect(result.summary.state.levelIndex).toBe(2);
  });

  it("gaat één stap omlaag na een oplossing met drie of meer hints", () => {
    for (const hints of [3, 7]) {
      const result = solved(2, hints);
      expect(result.summary.delta).toBe(-1);
      expect(result.summary.state.levelIndex).toBe(1);
      expect(result.summary.stuck).toBe(true);
    }
  });

  it("gaat één stap omlaag als het kind halverwege stopt", () => {
    const result = abandoned(2, 1);
    expect(result.summary.delta).toBe(-1);
    expect(result.summary.state.levelIndex).toBe(1);
    expect(result.summary.stuck).toBe(true);
  });

  it("blijft binnen de boven- en ondergrens", () => {
    const top = solved(MURDOKU_LEVELS.length - 1, 0);
    expect(top.summary.delta).toBe(0);
    expect(top.summary.state.levelIndex).toBe(MURDOKU_LEVELS.length - 1);

    const bottom = abandoned(0);
    expect(bottom.summary.delta).toBe(0);
    expect(bottom.summary.state.levelIndex).toBe(0);
    expect(bottom.summary.stuck).toBe(true);
  });

  it("logt de poging met zaak, goed/fout, tijd, hints en tijdstip", () => {
    expect(solved(0, 1).attempt).toEqual({
      itemId: "de-verdwenen-taart",
      ok: true,
      at: 1_700_000_000_000,
      durationMs: 120_000,
      hints: 1,
    });
    expect(abandoned(0, 4).attempt).toEqual({
      itemId: "de-verdwenen-taart",
      ok: false,
      at: 1_700_000_000_000,
      durationMs: 60_000,
      hints: 4,
    });
  });
});
