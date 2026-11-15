import { beforeEach, describe, expect, it, vi } from "vitest";
import { BASE_ELEMENT_IDS } from "@entities/alchemy";
import {
  FALLBACK_ALCHEMY_STATE,
  MAX_BOARD_ELEMENTS,
  loadAlchemyState,
  normalizeDiscovered,
  saveAlchemyState,
} from "@features/alchemy-lab";

const STORAGE_KEY = "games.mengelmoes.v1";

beforeEach(() => {
  localStorage.clear();
});

describe("alchemy storage", () => {
  it("falls back to the four base elements", () => {
    expect(loadAlchemyState()).toEqual(FALLBACK_ALCHEMY_STATE);
  });

  it("round-trips discovered elements and board positions", () => {
    const state = {
      discovered: [...BASE_ELEMENT_IDS, "mud", "steam"],
      board: [
        { elementId: "water", x: 0.25, y: 0.3 },
        { elementId: "steam", x: 0.7, y: 0.6 },
      ],
    };

    saveAlchemyState(state);

    expect(loadAlchemyState()).toEqual(state);
  });

  it("repairs a save that lost the base elements", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ discovered: ["mud"], board: [{ elementId: "mud", x: 0.5, y: 0.5 }] }),
    );

    const state = loadAlchemyState();
    for (const base of BASE_ELEMENT_IDS) {
      expect(state.discovered).toContain(base);
    }
    expect(state.discovered).toContain("mud");
    expect(state.board).toEqual([{ elementId: "mud", x: 0.5, y: 0.5 }]);
  });

  it("drops unknown elements, bad coordinates and duplicates", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        discovered: ["water", "water", "onbekend", "mud"],
        board: [
          { elementId: "mud", x: 0.5, y: 0.5 },
          { elementId: "onbekend", x: 0.5, y: 0.5 },
          { elementId: "water", x: -1, y: 0.5 },
          { elementId: "water", x: 0.5, y: 2 },
        ],
      }),
    );

    expect(loadAlchemyState()).toEqual({
      discovered: expect.arrayContaining([...BASE_ELEMENT_IDS, "mud"]),
      board: [{ elementId: "mud", x: 0.5, y: 0.5 }],
    });
  });

  it("truncates a board that grew beyond the limit", () => {
    const board = Array.from({ length: MAX_BOARD_ELEMENTS + 4 }, (_, index) => ({
      elementId: "water",
      x: (index % 4) / 4,
      y: 0.25,
    }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ discovered: ["water"], board }));

    expect(loadAlchemyState().board).toHaveLength(MAX_BOARD_ELEMENTS);
  });

  it("falls back for corrupt JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");

    expect(loadAlchemyState()).toEqual(FALLBACK_ALCHEMY_STATE);
  });

  it("falls back for valid JSON that is not an object", () => {
    localStorage.setItem(STORAGE_KEY, "null");

    expect(loadAlchemyState()).toEqual(FALLBACK_ALCHEMY_STATE);
  });

  it("normalizes a missing or malformed discovered list", () => {
    expect(normalizeDiscovered(undefined)).toEqual(expect.arrayContaining([...BASE_ELEMENT_IDS]));
    expect(normalizeDiscovered("water")).toEqual(expect.arrayContaining([...BASE_ELEMENT_IDS]));
    expect(normalizeDiscovered(["water", 42, "onbekend"])).toEqual(
      expect.arrayContaining([...BASE_ELEMENT_IDS, "water"]),
    );
  });

  it("ignores a malformed board field", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ discovered: ["water"], board: "nope" }));

    expect(loadAlchemyState().board).toEqual([]);
  });

  it("does not crash when localStorage is unavailable", () => {
    vi.stubGlobal("localStorage", undefined);
    try {
      expect(loadAlchemyState()).toEqual(FALLBACK_ALCHEMY_STATE);
      expect(() =>
        saveAlchemyState({ discovered: [...BASE_ELEMENT_IDS], board: [] }),
      ).not.toThrow();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("does not crash when storage refuses a write", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });

    expect(() => saveAlchemyState({ discovered: [...BASE_ELEMENT_IDS], board: [] })).not.toThrow();

    spy.mockRestore();
  });
});
