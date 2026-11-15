import { describe, expect, it } from "vitest";
import {
  WORD_SEARCH_LINES,
  WORD_SEARCH_SPEECH_GROUPS,
  wordFoundSpeech,
  wordSearchFeedbackSpeech,
  wordSpeech,
} from "@features/word-search";

describe("woordzoeker-spraak", () => {
  it("heeft clips voor de Nederlandse thema's en niet voor Pokémon", () => {
    expect(wordSpeech("bloem")?.text).toBe("bloem");
    expect(wordSpeech("koraal")?.text).toBe("koraal");
    expect(wordSpeech("Pikachu")).toBeNull();
  });

  it("bouwt een gevonden-bericht met het woord en 'gevonden'", () => {
    expect(wordFoundSpeech("bloem").map((line) => line.id)).toEqual(["word-bloem", "word-found"]);
    expect(wordFoundSpeech("Pikachu").map((line) => line.id)).toEqual(["word-found"]);
  });

  it("kiest één status met de juiste prioriteit", () => {
    const base = {
      puzzleId: "puzzel",
      complete: false,
      wrong: false,
      selectedCount: 0,
      lastFound: null,
    } as const;

    expect(wordSearchFeedbackSpeech({ ...base, complete: true }).text).toBe(
      WORD_SEARCH_LINES.complete.text,
    );
    expect(
      wordSearchFeedbackSpeech({ ...base, lastFound: "bloem", wrong: true, selectedCount: 1 }).text,
    ).toBe("bloem gevonden");
    expect(wordSearchFeedbackSpeech({ ...base, wrong: true }).text).toBe(
      WORD_SEARCH_LINES.wrong.text,
    );
    expect(wordSearchFeedbackSpeech({ ...base, selectedCount: 1 }).text).toBe(
      WORD_SEARCH_LINES.lastLetter.text,
    );
    expect(wordSearchFeedbackSpeech(base).text).toBe(WORD_SEARCH_LINES.instruction.text);
  });

  it("levert één catalogus zonder dubbele id's", () => {
    const lines = WORD_SEARCH_SPEECH_GROUPS.flatMap((group) => group.lines);
    expect(lines.length).toBeGreaterThanOrEqual(30);
    expect(new Set(lines.map((line) => line.id)).size).toBe(lines.length);
  });
});
