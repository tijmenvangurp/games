import { describe, expect, it } from "vitest";
import {
  accuracyOf,
  applyResult,
  createRound,
  currentTarget,
  emptyProgress,
  fingerForKey,
  HINT_AFTER_MISTAKES,
  isUnlocked,
  LESSONS,
  MAX_LOG_ENTRIES,
  needsHint,
  nextLessonId,
  pressKey,
  resultOf,
  ROUND_LENGTH,
  startRound,
  verdictFor,
  WORDS,
} from "@entities/typepret";
import { mulberry32 } from "@shared/lib";

function roundFor(index: number, seed = 1) {
  return createRound(LESSONS[index], mulberry32(seed));
}

function typeAll(state: ReturnType<typeof startRound>) {
  let current = state;
  while (!current.finished) {
    current = pressKey(current, currentTarget(current) ?? "");
  }
  return current;
}

describe("typepret lessen", () => {
  it("heeft acht lessen in een vaste volgorde", () => {
    expect(LESSONS.map((lesson) => lesson.id)).toEqual([
      "f-j",
      "d-k",
      "s-l",
      "a-puntkomma",
      "g-h",
      "basisrij",
      "woorden-1",
      "woorden-2",
    ]);
  });

  it("introduceert in elke oefenles twee nieuwe toetsen en houdt eerdere toetsen erin", () => {
    const seen = new Set<string>();
    for (const lesson of LESSONS.slice(0, 5)) {
      expect(lesson.newKeys).toHaveLength(2);
      for (const key of lesson.newKeys) {
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
      expect([...seen].every((key) => lesson.keys.includes(key))).toBe(true);
    }
  });
});

describe("typepret rondes", () => {
  it.each(LESSONS.map((lesson, index) => [lesson.id, index] as const))(
    "maakt voor %s een ronde van precies 20 doeltekens met alleen geleerde toetsen",
    (_id, index) => {
      for (let seed = 1; seed <= 25; seed += 1) {
        const round = roundFor(index, seed);
        expect(round.targets).toHaveLength(ROUND_LENGTH);
        expect(round.groups.join("")).toBe(round.targets.join(""));
        expect(round.targets.every((key) => LESSONS[index].keys.includes(key))).toBe(true);
      }
    },
  );

  it("gebruikt in oefenlessen elke nieuwe toets minstens één keer", () => {
    for (const lesson of LESSONS.slice(0, 5)) {
      const round = createRound(lesson, mulberry32(7));
      for (const key of lesson.newKeys) {
        expect(round.targets).toContain(key);
      }
    }
  });

  it("neemt in woordlessen alleen woorden van de juiste lengte zonder puntkomma", () => {
    for (const index of [6, 7]) {
      const { min, max } = LESSONS[index].wordLength ?? { min: 0, max: 0 };
      for (let seed = 1; seed <= 25; seed += 1) {
        for (const word of roundFor(index, seed).groups) {
          expect(word.length).toBeGreaterThanOrEqual(min);
          expect(word.length).toBeLessThanOrEqual(max);
          expect(WORDS).toContain(word);
          expect(word).not.toContain(";");
        }
      }
    }
  });

  it("heeft woorden die alleen uit basisrij-letters bestaan", () => {
    for (const word of WORDS) {
      expect(word).toMatch(/^[asdfghjkl]+$/);
    }
  });

  it("is deterministisch per seed", () => {
    expect(roundFor(5, 42)).toEqual(roundFor(5, 42));
  });
});

describe("typepret toetsaanslagen", () => {
  it("gaat naar het volgende teken bij een goede toets, ook als hoofdletter", () => {
    const state = startRound(roundFor(0));
    const target = currentTarget(state) ?? "";
    const next = pressKey(state, target.toUpperCase());
    expect(next.index).toBe(1);
    expect(next.correct).toBe(1);
    expect(next.errors).toBe(0);
  });

  it("blijft bij dezelfde letter na een fout en telt herhaalde fouten één keer", () => {
    let state = startRound(roundFor(0));
    const target = currentTarget(state) ?? "";
    const wrong = target === "f" ? "j" : "f";
    state = pressKey(state, wrong);
    state = pressKey(state, wrong);
    state = pressKey(state, wrong);
    expect(state.index).toBe(0);
    expect(state.errors).toBe(1);
    expect(state.mistakesOnTarget).toBe(3);
    expect(state.missed).toEqual([target]);
  });

  it("toont de hulp pas na drie fouten op hetzelfde doelteken en wist die bij een goede toets", () => {
    let state = startRound(roundFor(0));
    const target = currentTarget(state) ?? "";
    const wrong = target === "f" ? "j" : "f";
    for (let count = 1; count < HINT_AFTER_MISTAKES; count += 1) {
      state = pressKey(state, wrong);
      expect(needsHint(state)).toBe(false);
    }
    state = pressKey(state, wrong);
    expect(needsHint(state)).toBe(true);
    state = pressKey(state, target);
    expect(needsHint(state)).toBe(false);
  });

  it("negeert functietoetsen, spatie en Backspace", () => {
    const state = startRound(roundFor(0));
    for (const key of ["Shift", "Backspace", "Tab", "Enter", " ", "ArrowLeft", ""]) {
      expect(pressKey(state, key)).toBe(state);
    }
  });

  it("rondt af na het laatste teken en negeert daarna toetsen", () => {
    const done = typeAll(startRound(roundFor(0)));
    expect(done.finished).toBe(true);
    expect(done.correct).toBe(ROUND_LENGTH);
    expect(pressKey(done, "f")).toBe(done);
  });

  it("telt een fout op het laatste teken mee en rondt dan pas af", () => {
    let state = startRound(roundFor(0));
    while (state.index < ROUND_LENGTH - 1) {
      state = pressKey(state, currentTarget(state) ?? "");
    }
    const last = currentTarget(state) ?? "";
    state = pressKey(state, last === "f" ? "j" : "f");
    expect(state.finished).toBe(false);
    state = pressKey(state, last);
    expect(state.finished).toBe(true);
    expect(state.errors).toBe(1);
    expect(accuracyOf(state)).toBeCloseTo(20 / 21);
  });
});

describe("typepret nauwkeurigheid en ontgrendelen", () => {
  it("geeft de juiste uitkomst rond de drempels", () => {
    expect(verdictFor(1)).toBe("ontgrendeld");
    expect(verdictFor(0.8)).toBe("ontgrendeld");
    expect(verdictFor(0.79)).toBe("bijna");
    expect(verdictFor(0.7)).toBe("bijna");
    expect(verdictFor(0.69)).toBe("nogmaals");
  });

  it("ontgrendelt de volgende les alleen bij een voldoende ronde", () => {
    const first = LESSONS[0].id;
    const second = LESSONS[1].id;
    let progress = emptyProgress();
    expect(isUnlocked(first, progress)).toBe(true);
    expect(isUnlocked(second, progress)).toBe(false);
    expect(nextLessonId(progress)).toBe(first);

    const low = {
      lessonId: first,
      accuracy: 0.6,
      verdict: "nogmaals" as const,
      correct: 12,
      errors: 8,
      missed: [],
    };
    progress = applyResult(progress, low, 1);
    expect(isUnlocked(second, progress)).toBe(false);
    expect(progress.best[first]).toBe(0.6);

    const good = typeAll(startRound(roundFor(0)));
    progress = applyResult(progress, resultOf(good), 2);
    expect(isUnlocked(second, progress)).toBe(true);
    expect(progress.best[first]).toBe(1);
    expect(nextLessonId(progress)).toBe(second);
  });

  it("begrenst het log", () => {
    const result = resultOf(typeAll(startRound(roundFor(0))));
    let progress = emptyProgress();
    for (let index = 0; index < MAX_LOG_ENTRIES + 5; index += 1) {
      progress = applyResult(progress, result, index);
    }
    expect(progress.log).toHaveLength(MAX_LOG_ENTRIES);
    expect(progress.log[progress.log.length - 1].at).toBe(MAX_LOG_ENTRIES + 4);
  });

  it("kent bij elke basisrijtoets een vinger", () => {
    for (const key of ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"]) {
      expect(fingerForKey(key)?.label).toBeTruthy();
    }
    expect(fingerForKey("f")?.id).toBe("linker-wijsvinger");
    expect(fingerForKey("j")?.id).toBe("rechter-wijsvinger");
    expect(fingerForKey("q")).toBeUndefined();
  });
});
