import { describe, expect, it } from "vitest";
import type { ChessMoveRecord, ChessPlayer } from "@entities/chess";
import {
  capturedBy,
  displayName,
  feedbackText,
  resultCopy,
  statusText,
  SIDE_LABEL,
} from "@features/chess-game";

const players: Record<"w" | "b", ChessPlayer> = {
  w: { name: "Sam", avatar: "🦊" },
  b: { name: "", avatar: "🐼" },
};

const history: readonly ChessMoveRecord[] = [
  { from: "e2", to: "e4", san: "e4", color: "w" },
  { from: "d7", to: "d5", san: "d5", color: "b" },
  { from: "e4", to: "d5", san: "exd5", color: "w", captured: "p" },
  { from: "d8", to: "d5", san: "Qxd5", color: "b", captured: "p" },
];

describe("chess presentation", () => {
  it("uses the local name or falls back to the side", () => {
    expect(displayName(players.w, "w")).toBe("Sam");
    expect(displayName(players.b, "b")).toBe("Zwart");
    expect(displayName({ name: "   ", avatar: "🦊" }, "w")).toBe("Wit");
    expect(SIDE_LABEL).toEqual({ w: "Wit", b: "Zwart" });
  });

  it("splits captured pieces by colour", () => {
    expect(capturedBy(history, "w")).toEqual(["p"]);
    expect(capturedBy(history, "b")).toEqual(["p"]);
    expect(capturedBy([], "w")).toEqual([]);
  });

  it("describes the turn, check and thinking state", () => {
    const base = { players, turn: "w" as const, thinking: false };

    expect(statusText({ ...base, result: { kind: "playing", check: false } })).toBe(
      "Sam is aan zet.",
    );
    expect(statusText({ ...base, result: { kind: "playing", check: true } })).toBe(
      "Schaak! Sam is aan zet.",
    );
    expect(statusText({ ...base, result: { kind: "playing", check: false }, thinking: true })).toBe(
      "De computer denkt na…",
    );
  });

  it("describes every result", () => {
    const base = { players, turn: "w" as const, thinking: false };

    expect(statusText({ ...base, result: { kind: "checkmate", winner: "w" } })).toContain(
      "wint met schaakmat",
    );
    expect(statusText({ ...base, result: { kind: "stalemate" } })).toBe(
      "Pat! Er is geen legale zet meer.",
    );
    expect(statusText({ ...base, result: { kind: "draw", reason: "repetition" } })).toBe(
      "Gelijkspel.",
    );
    expect(statusText({ ...base, result: { kind: "resigned", winner: "b" } })).toContain(
      "de ander gaf op",
    );
  });

  it("turns feedback into one short sentence", () => {
    expect(feedbackText("illegal")).toContain("Die zet mag niet");
    expect(feedbackText("not-your-turn")).toContain("niet aan de beurt");
    expect(feedbackText("engine-error")).toContain("geen zet vinden");
    expect(feedbackText("idle")).toBeNull();
  });

  it("writes result copy for win, loss, draw and a running game", () => {
    expect(resultCopy({ kind: "checkmate", winner: "w" }, players, "computer", "w")).toEqual({
      title: "Sam wint!",
      description: "Schaakmat! De koning kan nergens meer heen.",
      confetti: true,
    });
    expect(resultCopy({ kind: "checkmate", winner: "b" }, players, "computer", "w").confetti).toBe(
      false,
    );
    expect(resultCopy({ kind: "resigned", winner: "b" }, players, "friend", "w")).toEqual({
      title: "Zwart wint!",
      description: "De partij is gestopt omdat de ander opgaf.",
      confetti: true,
    });
    expect(resultCopy({ kind: "stalemate" }, players, "friend", "w")).toEqual({
      title: "Pat!",
      description: "Er is geen legale zet meer. Daarom is het gelijkspel.",
      confetti: false,
    });
    expect(resultCopy({ kind: "draw", reason: "fifty-moves" }, players, "friend", "w")).toEqual({
      title: "Gelijkspel",
      description: "Er zijn vijftig zetten gedaan zonder slag of pionzet.",
      confetti: false,
    });
    expect(resultCopy({ kind: "playing", check: false }, players, "friend", "w")).toEqual({
      title: "De partij loopt nog",
      description: "Er is nog geen winnaar.",
      confetti: false,
    });
  });

  it("explains each draw reason", () => {
    const descriptions = (
      ["fifty-moves", "repetition", "insufficient-material", "draw"] as const
    ).map((reason) => resultCopy({ kind: "draw", reason }, players, "friend", "w").description);

    expect(new Set(descriptions).size).toBe(4);
    expect(descriptions[1]).toContain("drie keer");
    expect(descriptions[2]).toContain("te weinig stukken");
  });
});
