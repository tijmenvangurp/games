import { describe, expect, it } from "vitest";
import {
  addDays,
  createEmptyProgress,
  createEmptyProgressMap,
  dueLetters,
  intervalForCorrect,
  isKnownStage,
  knownLetters,
  recordLetterAnswer,
  stageForCorrect,
} from "@entities/letter";

describe("letter progress", () => {
  it("maakt een lege voortgang voor elke letter", () => {
    const progress = createEmptyProgressMap();
    expect(Object.keys(progress)).toHaveLength(10);
    for (const item of Object.values(progress)) {
      expect(item).toEqual(createEmptyProgress());
    }
  });

  it("kent de stages en intervallen", () => {
    expect(stageForCorrect(0)).toBe("nieuw");
    expect(stageForCorrect(1)).toBe("oefenen");
    expect(stageForCorrect(2)).toBe("oefenen");
    expect(stageForCorrect(3)).toBe("bijna");
    expect(stageForCorrect(4)).toBe("bijna");
    expect(stageForCorrect(5)).toBe("vast");

    expect(intervalForCorrect(1)).toBe(1);
    expect(intervalForCorrect(2)).toBe(3);
    expect(intervalForCorrect(3)).toBe(7);
    expect(intervalForCorrect(4)).toBe(14);
    expect(intervalForCorrect(9)).toBe(14);
  });

  it("werkt een goed antwoord bij", () => {
    const progress = recordLetterAnswer(createEmptyProgressMap(), "m", true, "2026-10-18");
    expect(progress.m).toMatchObject({
      attempts: 1,
      correct: 1,
      lastSeen: "2026-10-18",
      nextReview: "2026-10-19",
      stage: "oefenen",
    });
  });

  it("laat een fout antwoord de mastery niet verhogen", () => {
    const first = recordLetterAnswer(createEmptyProgressMap(), "m", true, "2026-10-18");
    const second = recordLetterAnswer(first, "m", false, "2026-10-19");
    expect(second.m.correct).toBe(1);
    expect(second.m.attempts).toBe(2);
    expect(second.m.nextReview).toBe("2026-10-20");
    expect(second.m.stage).toBe("oefenen");
  });

  it("herkent due en bekende letters", () => {
    const progress = createEmptyProgressMap();
    expect(dueLetters(progress, "2026-10-18")).toHaveLength(10);
    expect(knownLetters(progress)).toHaveLength(0);

    progress.m = {
      attempts: 5,
      correct: 5,
      lastSeen: "2026-10-01",
      nextReview: "2026-10-15",
      stage: "vast",
    };
    expect(knownLetters(progress)).toContain("m");
    expect(dueLetters(progress, "2026-10-18")).toContain("m");
    expect(dueLetters(progress, "2026-10-14")).not.toContain("m");
    expect(isKnownStage("bijna")).toBe(true);
    expect(isKnownStage("oefenen")).toBe(false);
  });

  it("rekent datums over maand- en jaargrenzen", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});
