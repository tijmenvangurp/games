import { describe, expect, it } from "vitest";
import {
  PUZZLE_SPEECH_GROUPS,
  puzzlePromptSpeech,
  puzzleStatusSpeech,
  puzzleTitleSpeech,
} from "@features/chess-puzzles";

describe("schaakpuzzel-spraak", () => {
  it("geeft elke puzzelsoort een titel en beide kleuren een prompt", () => {
    expect(puzzleTitleSpeech("mate").text).toBe("Zet schaakmat!");
    expect(puzzleTitleSpeech("capture").text).toBe("Win een stuk!");
    expect(puzzleTitleSpeech("tactic").text).toBe("Vind de beste zet!");
    expect(puzzlePromptSpeech("mate", "w").text).toBe(
      "Je bent wit. Zet de zwarte koning schaakmat.",
    );
    expect(puzzlePromptSpeech("mate", "b").text).toBe(
      "Je bent zwart. Zet de witte koning schaakmat.",
    );
  });

  it("volgt de status van de puzzel", () => {
    expect(puzzleStatusSpeech("solved", "mate", "solved", "w", null).text).toBe(
      "Schaakmat! Knap gedaan.",
    );
    expect(puzzleStatusSpeech("solved", "capture", "solved", "w", null).text).toBe(
      "Gelukt! Je hebt een stuk gewonnen.",
    );
    expect(puzzleStatusSpeech("solved", "tactic", "solved", "w", null).text).toBe(
      "Gelukt! Je hebt de beste zet gevonden.",
    );
    expect(puzzleStatusSpeech("wrong", "mate", "playing", "w", null).text).toBe(
      "Die zet is niet de beste. Probeer nog eens.",
    );
    expect(puzzleStatusSpeech("correct", "mate", "playing", "w", null).text).toBe(
      "Goed zo! De tegenstander heeft geantwoord. Jij mag weer.",
    );
    expect(puzzleStatusSpeech("idle", "mate", "playing", "w", "b").text).toBe(
      "Kijk! Dit stuk is van de tegenstander. Sleep je eigen stuk om te zetten.",
    );
    expect(puzzleStatusSpeech("idle", "mate", "playing", "w", null).text).toBe(
      "Tik op een stuk om te kijken waar het heen kan. Sleep je stuk naar een groene stip.",
    );
  });

  it("levert één catalogus zonder dubbele id's", () => {
    const lines = PUZZLE_SPEECH_GROUPS.flatMap((group) => group.lines);
    expect(lines).toHaveLength(16);
    expect(new Set(lines.map((line) => line.id)).size).toBe(lines.length);
  });
});
