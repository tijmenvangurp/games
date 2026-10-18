import { describe, expect, it } from "vitest";
import {
  LESSON_ANIMAUX,
  dueItemIds,
  emptyFrenchProgress,
  isDue,
  lessonStars,
  recordFrenchAnswer,
} from "@entities/french";
import { createFrenchQueue } from "@features/french-listening";

const NOW = Date.UTC(2026, 9, 18, 12, 0, 0);
const DAY_MS = 24 * 60 * 60 * 1000;

describe("Franse voortgang", () => {
  it("plant een goed antwoord één dag vooruit", () => {
    const progress = recordFrenchAnswer(emptyFrenchProgress(), "animaux-chat", true, NOW);
    const entry = progress.items["animaux-chat"];
    expect(entry).toEqual({
      box: 1,
      dueAt: NOW + DAY_MS,
      correct: 1,
      seen: 1,
    });
    expect(isDue(entry, NOW)).toBe(false);
    expect(isDue(entry, NOW + DAY_MS)).toBe(true);
  });

  it("zet een fout antwoord terug naar box 0 en nu opnieuw", () => {
    let progress = recordFrenchAnswer(emptyFrenchProgress(), "animaux-chat", true, NOW);
    progress = recordFrenchAnswer(progress, "animaux-chat", false, NOW);
    expect(progress.items["animaux-chat"]).toEqual({
      box: 0,
      dueAt: NOW,
      correct: 1,
      seen: 2,
    });
    expect(isDue(progress.items["animaux-chat"], NOW)).toBe(true);
  });

  it("kapt de box op 5", () => {
    let progress = emptyFrenchProgress();
    for (let index = 0; index < 8; index += 1) {
      progress = recordFrenchAnswer(progress, "animaux-chat", true, NOW);
    }
    expect(progress.items["animaux-chat"]?.box).toBe(5);
    expect(progress.items["animaux-chat"]?.dueAt).toBe(NOW + 30 * DAY_MS);
  });

  it("vindt alleen items die nu aan de beurt zijn", () => {
    let progress = recordFrenchAnswer(emptyFrenchProgress(), "animaux-chat", true, NOW);
    progress = recordFrenchAnswer(progress, "animaux-chien", true, NOW - 2 * DAY_MS);
    const due = dueItemIds(progress, LESSON_ANIMAUX.items, NOW);
    expect(due).toEqual(["animaux-chien"]);
  });

  it("zet due-items vooraan in de lesqueue", () => {
    const progress = recordFrenchAnswer(
      emptyFrenchProgress(),
      "animaux-lion",
      true,
      NOW - 2 * DAY_MS,
    );
    const queue = createFrenchQueue(LESSON_ANIMAUX, { progress, now: NOW, seed: 3 });
    expect(queue[0]?.id).toBe("animaux-lion");
    expect(queue).toHaveLength(LESSON_ANIMAUX.items.length);
  });

  it("berekent sterren uit de accuratesse", () => {
    const empty = emptyFrenchProgress();
    expect(lessonStars(empty, LESSON_ANIMAUX)).toBe(0);

    let allCorrect = empty;
    for (const item of LESSON_ANIMAUX.items) {
      allCorrect = recordFrenchAnswer(allCorrect, item.id, true, NOW);
    }
    expect(lessonStars(allCorrect, LESSON_ANIMAUX)).toBe(3);

    let eightyPercent = empty;
    LESSON_ANIMAUX.items.forEach((item, index) => {
      eightyPercent = recordFrenchAnswer(eightyPercent, item.id, index >= 2, NOW);
    });
    expect(lessonStars(eightyPercent, LESSON_ANIMAUX)).toBe(2);

    let half = empty;
    LESSON_ANIMAUX.items.forEach((item, index) => {
      half = recordFrenchAnswer(half, item.id, index % 2 === 0, NOW);
    });
    expect(lessonStars(half, LESSON_ANIMAUX)).toBe(1);
  });
});
