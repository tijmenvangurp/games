import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_MURDOKU_SETTINGS,
  MURDOKU_INTRO_LEVEL,
  createMurdokuPlay,
  loadMurdokuState,
  restoreMurdokuState,
  saveMurdokuState,
  type MurdokuHintState,
  type MurdokuPlayState,
} from "@features/murdoku-game";

const STORAGE_KEY = "games.mysterie.v1";

const hint: MurdokuHintState = {
  stage: "cross",
  explanation: {
    key: "hint.crossPlain",
    params: { cell: 0 },
    children: [{ key: "board.wordOn", params: { word: "de keuken" } }],
  },
  line: null,
  roomId: null,
  cells: [0],
  personId: null,
};

function runningPlay(): MurdokuPlayState {
  return {
    ...createMurdokuPlay(MURDOKU_INTRO_LEVEL.id),
    placements: new Map([
      ["A", 1],
      ["B", 4],
    ]),
    manualCrosses: new Set([0, 5]),
    selected: "A",
    mode: "cross",
  };
}

const settings = { autoCross: false, crossOnBlocked: true };

beforeEach(() => {
  localStorage.clear();
});

describe("murdoku opslag", () => {
  it("bewaart en leest de lopende zaak, de hint en de instellingen terug", () => {
    saveMurdokuState({
      play: runningPlay(),
      hint,
      hintsUsed: 2,
      solvedCaseIds: new Set(["de-verdwenen-taart"]),
      settings,
    });

    expect(loadMurdokuState()).toEqual({
      version: 1,
      current: {
        levelId: MURDOKU_INTRO_LEVEL.id,
        placements: { A: 1, B: 4 },
        crosses: [0, 5],
        selected: "A",
        mode: "cross",
        phase: "playing",
        resolution: null,
        hintsUsed: 2,
        hint,
      },
      solved: ["de-verdwenen-taart"],
      settings,
    });
  });

  it("begint leeg zonder opgeslagen staat", () => {
    expect(loadMurdokuState()).toEqual({
      version: 1,
      current: null,
      solved: [],
      settings: DEFAULT_MURDOKU_SETTINGS,
    });
  });

  it("migreert de versieloze vorm uit de onderzoeksnotitie", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        solved: ["de-verdwenen-taart", "de-verdwenen-taart"],
        current: {
          levelId: MURDOKU_INTRO_LEVEL.id,
          placements: { A: 1 },
          marks: [0, 5],
        },
        settings: { autoCross: false },
      }),
    );

    expect(loadMurdokuState()).toEqual({
      version: 1,
      current: {
        levelId: MURDOKU_INTRO_LEVEL.id,
        placements: { A: 1 },
        crosses: [0, 5],
        selected: null,
        mode: "place",
        phase: "playing",
        resolution: null,
        hintsUsed: 0,
        hint: null,
      },
      solved: ["de-verdwenen-taart"],
      settings: { autoCross: false, crossOnBlocked: false },
    });
  });

  it("migreert versie 0 met dezelfde vorm", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 0,
        current: { levelId: MURDOKU_INTRO_LEVEL.id, marks: [4] },
      }),
    );

    const state = loadMurdokuState();
    expect(state.version).toBe(1);
    expect(state.current?.crosses).toEqual([4]);
    expect(state.settings).toEqual(DEFAULT_MURDOKU_SETTINGS);
  });

  it("gooit een onbekende versie of kapotte JSON veilig weg", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 99, current: { levelId: MURDOKU_INTRO_LEVEL.id } }),
    );
    expect(loadMurdokuState().current).toBeNull();

    localStorage.setItem(STORAGE_KEY, "{geen json");
    expect(loadMurdokuState().current).toBeNull();
    expect(loadMurdokuState().solved).toEqual([]);
  });

  it("laat een zaak met een onbekende levelId vallen", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        current: { levelId: "bestaat-niet", placements: { A: 1 } },
        solved: ["de-verdwenen-taart"],
      }),
    );

    const state = loadMurdokuState();
    expect(state.current).toBeNull();
    expect(state.solved).toEqual(["de-verdwenen-taart"]);
  });

  it("houdt alleen geldige plaatsingen, kruisjes en hintvakjes over", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        current: {
          levelId: MURDOKU_INTRO_LEVEL.id,
          placements: { A: 1, B: 1, C: 99, ZZZ: 2, victim: 14 },
          crosses: [0, 0, 2, 99, -1],
          hint: {
            stage: "onzin",
            explanation: { key: 42 },
            line: { axis: "row", index: 99 },
            cells: [0, 0, 99],
            personId: "ZZZ",
          },
        },
      }),
    );

    const state = loadMurdokuState();
    expect(state.current?.placements).toEqual({ A: 1 });
    expect(state.current?.crosses).toEqual([0, 2]);
    expect(state.current?.hint).toBeNull();
  });

  it("begrenst de opgeloste lijst tot de eigen zaken", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        solved: ["de-verdwenen-taart", "bestaat-niet", "de-verdwenen-taart"],
      }),
    );

    expect(loadMurdokuState().solved).toEqual(["de-verdwenen-taart"]);
  });

  it("weigert een opgeslagen blok dat veel te groot is", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        solved: Array.from({ length: 10_000 }, () => "de-verdwenen-taart"),
      }),
    );

    expect(loadMurdokuState()).toEqual({
      version: 1,
      current: null,
      solved: [],
      settings: DEFAULT_MURDOKU_SETTINGS,
    });
  });

  it("herstelt de opgeslagen staat als bord en hint", () => {
    saveMurdokuState({
      play: runningPlay(),
      hint,
      hintsUsed: 2,
      solvedCaseIds: new Set(["de-verdwenen-taart"]),
      settings,
    });

    const restored = restoreMurdokuState();

    expect(restored.puzzle?.id).toBe(MURDOKU_INTRO_LEVEL.id);
    expect(restored.play?.levelId).toBe(MURDOKU_INTRO_LEVEL.id);
    expect(restored.play?.placements).toEqual(
      new Map([
        ["A", 1],
        ["B", 4],
      ]),
    );
    expect(restored.play?.manualCrosses).toEqual(new Set([0, 5]));
    expect(restored.play?.selected).toBe("A");
    expect(restored.play?.mode).toBe("cross");
    expect(restored.play?.wrongCheck).toBe(false);
    expect(restored.hint).toEqual(hint);
    expect(restored.hintsUsed).toBe(2);
    expect(restored.solvedCaseIds.has("de-verdwenen-taart")).toBe(true);
    expect(restored.settings).toEqual(settings);
  });

  it("herstelt een opgeloste zaak met de dader en het slachtoffer", () => {
    const play: MurdokuPlayState = {
      ...runningPlay(),
      selected: null,
      placements: new Map([
        ["A", 1],
        ["B", 4],
        ["C", 11],
        ["victim", 14],
      ]),
      phase: "solved",
      resolution: { murdererId: "C", victimCell: 14, roomId: "4" },
    };
    saveMurdokuState({
      play,
      hint: null,
      hintsUsed: 1,
      solvedCaseIds: new Set(["de-verdwenen-taart"]),
      settings: DEFAULT_MURDOKU_SETTINGS,
    });

    const restored = restoreMurdokuState();
    expect(restored.play?.phase).toBe("solved");
    expect(restored.play?.resolution).toEqual({
      murdererId: "C",
      victimCell: 14,
      roomId: "4",
    });
    expect(restored.play?.placements.get("victim")).toBe(14);
  });

  it("zet een opgeslagen oplossing zonder geldige dader terug naar spelen", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        current: {
          levelId: MURDOKU_INTRO_LEVEL.id,
          placements: { A: 1, victim: 14 },
          phase: "solved",
          resolution: { murdererId: "ZZZ", victimCell: 14, roomId: "4" },
        },
      }),
    );

    const restored = restoreMurdokuState();
    expect(restored.play?.phase).toBe("playing");
    expect(restored.play?.resolution).toBeNull();
    expect(restored.play?.placements.has("victim")).toBe(false);
  });
});
