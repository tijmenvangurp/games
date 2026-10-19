import { describe, expect, it } from "vitest";
import {
  CHESS_LEVEL_LINES,
  CHESS_SPEECH_GROUPS,
  coachSpeechFor,
  levelFor,
} from "@features/chess-tutorial";
import type { TutorialLevelId, TutorialPreview } from "@features/chess-tutorial";

const PREVIEW: TutorialPreview = { square: "h1", targets: ["e5"] };

describe("schaak-spraak", () => {
  it("geeft elk level een instructie, uitleg en hint", () => {
    for (const levelId of Object.keys(CHESS_LEVEL_LINES) as TutorialLevelId[]) {
      const speech = CHESS_LEVEL_LINES[levelId];
      expect(speech.instruction.text.length).toBeGreaterThan(0);
      expect(speech.preview.text.length).toBeGreaterThan(0);
      expect(speech.explanation.text.length).toBeGreaterThan(0);
      expect(speech.hint.text.length).toBeGreaterThan(0);
    }
  });

  it("volgt de coachbubbel in elke toestand", () => {
    const level = levelFor("rook-train");

    expect(coachSpeechFor(level, "idle", null, null, null, "playing", 0).text).toBe(
      "Rijd met de toren naar de ster.",
    );
    expect(coachSpeechFor(level, "moved", null, null, null, "playing", 1).text).toBe(
      "Goed! Nog één zet naar de ster.",
    );
    expect(coachSpeechFor(level, "illegal", null, null, null, "playing", 1).text).toBe(
      "Die mag niet. Sleep naar een groene stip.",
    );
    expect(coachSpeechFor(level, "hint", null, null, null, "playing", 0).text).toBe(
      "Kijk! Sleep naar de groene stip.",
    );
    expect(coachSpeechFor(level, "idle", null, "w", "h2", "playing", 0).text).toBe(
      "Sleep naar een groene stip.",
    );
    expect(coachSpeechFor(level, "idle", null, "b", "h2", "playing", 0).text).toBe(
      "Kijk! Dit is een zwart stuk. Sleep je eigen stuk om te zetten.",
    );
    expect(coachSpeechFor(level, "idle", PREVIEW, null, null, "playing", 0).text).toBe(
      "Kijk! Zo rijdt de toren. Tik op het stuk om te kijken.",
    );
    expect(coachSpeechFor(level, "idle", null, null, null, "completed", 2).text).toBe(
      "Ster! De toren rijdt recht.",
    );
    expect(coachSpeechFor(level, "idle", null, null, null, "stuck", 1).text).toBe(
      "Oei! De rokade kan niet meer. Druk op Opnieuw.",
    );
  });

  it("geeft de preview twee clips en de instructie één", () => {
    const level = levelFor("rook-train");
    const preview = coachSpeechFor(level, "idle", PREVIEW, null, null, "playing", 0);
    expect(preview.lines.map((line) => line.id)).toEqual([
      "rook-train-preview",
      "coach-preview-tap",
    ]);

    const instruction = coachSpeechFor(level, "idle", null, null, null, "playing", 0);
    expect(instruction.lines.map((line) => line.id)).toEqual(["rook-train-instruction"]);
  });

  it("spreekt schaakcoördinaten uit als letters en getallen", () => {
    expect(CHESS_LEVEL_LINES.castling.hint.audioText).toBe("Sleep de koning van e één naar g één.");
  });

  it("geeft een nieuwe sleutel bij een nieuwe zet", () => {
    const level = levelFor("rook-train");
    expect(coachSpeechFor(level, "idle", null, null, null, "playing", 0).key).not.toBe(
      coachSpeechFor(level, "idle", null, null, null, "playing", 1).key,
    );
  });

  it("levert één catalogus zonder dubbele id's", () => {
    const lines = CHESS_SPEECH_GROUPS.flatMap((group) => group.lines);
    expect(lines.length).toBeGreaterThan(50);
    expect(new Set(lines.map((line) => line.id)).size).toBe(lines.length);
  });
});
