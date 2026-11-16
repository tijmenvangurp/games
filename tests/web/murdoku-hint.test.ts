import { beforeEach, describe, expect, it } from "vitest";
import { loadMurdokuLevel } from "@entities/murdoku";
import { MURDOKU_INTRO_LEVEL, crossedCells, useMurdokuStore } from "@features/murdoku-game";
import { MURDOKU_GENERATED_FIXTURE, MURDOKU_FIXTURE } from "../node/murdoku-fixtures";

const puzzle = loadMurdokuLevel(MURDOKU_INTRO_LEVEL);
const generated = loadMurdokuLevel(MURDOKU_GENERATED_FIXTURE);
const fixture = loadMurdokuLevel(MURDOKU_FIXTURE);

function resetStore(): void {
  useMurdokuStore.setState({
    puzzle: null,
    play: null,
    history: [],
    hint: null,
    hintsUsed: 0,
    clueFocus: null,
  });
}

function store() {
  return useMurdokuStore.getState();
}

/** Zet Bram op de stoel en Anna in de keuken, zoals een kind ze zelf plaatst. */
function placeBramAndAnna(): void {
  store().selectPerson("B");
  store().tapCell(4);
  store().selectPerson("A");
  store().tapCell(1);
}

beforeEach(() => {
  localStorage.clear();
  resetStore();
});

describe("hinttrap", () => {
  it("begint met een lichte cue en past daarna één stap toe", () => {
    store().start(puzzle);
    store().showHint();

    expect(store().hint?.stage).toBe("focus");
    expect(store().hint?.cells.length).toBeGreaterThan(0);
    // Een lichte cue verandert het bord niet.
    expect(store().play?.placements.size).toBe(0);
    expect(store().hintsUsed).toBe(1);

    store().showHint();

    expect(store().hint?.stage).toBe("place");
    expect(store().play?.placements.get("B")).toBe(4);
    expect(store().play?.wrongCheck).toBe(false);
    // De tweede tik past dezelfde hintstap toe; hij telt niet als nieuwe hint.
    expect(store().hintsUsed).toBe(1);
  });

  it("streept één onmogelijk vakje weg in plaats van meteen te plaatsen", () => {
    store().start(generated);

    store().showHint();
    expect(store().hint?.stage).toBe("focus");

    store().showHint();

    expect(store().hint?.stage).toBe("cross");
    expect(store().play?.manualCrosses.has(6)).toBe(true);
    expect(crossedCells(generated, store().play!)).toContain(6);
    // Een kruisje is geen fout en verandert geen plaatsing.
    expect(store().play?.placements.size).toBe(0);
    expect(store().play?.wrongCheck).toBe(false);
  });

  it("plaatst nooit de laatste persoon, want dan zou de hint het antwoord geven", () => {
    store().start(puzzle);
    placeBramAndAnna();

    for (let press = 0; press < 6; press += 1) store().showHint();

    expect(store().play?.placements.has("C")).toBe(false);
    expect(store().play?.placements.size).toBe(2);
  });

  it("gebruikt de eigen aanwijzing als reden, of zegt dat de rest niet kan", () => {
    store().start(puzzle);

    store().showHint();
    store().showHint();
    expect(store().hint?.stage).toBe("place");
    expect(store().hint?.explanation).toMatchObject({ key: "hint.placeClue" });

    // De volgende trap plaatst Anna; haar aanwijzing laat vier vakjes open.
    store().showHint();
    store().showHint();

    expect(store().hint?.stage).toBe("place");
    expect(store().hint?.explanation).toMatchObject({ key: "hint.place" });
    expect(store().play?.placements.get("A")).toBe(1);
  });

  it("wijst vriendelijk naar een verkeerde plaatsing zonder iets weg te halen", () => {
    store().start(puzzle);
    store().selectPerson("C");
    store().tapCell(0);

    store().showHint();
    store().showHint();

    expect(store().hint?.stage).toBe("check");
    expect(store().hint?.explanation).toMatchObject({ key: "hint.checkPlacement" });
    expect(store().play?.placements.get("C")).toBe(0);
    expect(store().play?.wrongCheck).toBe(false);
  });

  it("zegt het eerlijk als er geen rij als reden is", () => {
    store().start(generated);

    store().showHint();
    store().showHint();

    expect(store().hint?.stage).toBe("cross");
    expect(store().hint?.explanation).toMatchObject({ key: "hint.crossPlain" });
    expect(store().play?.wrongCheck).toBe(false);
  });

  it("laat de laatste persoon altijd aan het kind", () => {
    store().start(fixture);
    for (let press = 0; press < 8; press += 1) store().showHint();

    // Bram en Anna staan; Cato is de laatste en komt er niet via de hint op.
    expect(store().play?.placements.get("B")).toBe(6);
    expect(store().play?.placements.get("A")).toBe(3);
    expect(store().play?.placements.has("C")).toBe(false);
    expect(store().hint?.stage).toBe("none");
  });

  it("telt één hint per hintstap en levert nooit een straf op", () => {
    store().start(puzzle);

    store().showHint();
    store().showHint();
    store().showHint();

    // Tik één zet de hint op, tik twee past hem toe, tik drie begint een nieuwe stap.
    expect(store().hintsUsed).toBe(2);
    expect(store().play?.wrongCheck).toBe(false);
    expect(store().play?.phase).toBe("playing");
  });

  it("wist de hint zodra het kind zelf iets doet", () => {
    store().start(puzzle);
    store().showHint();
    expect(store().hint).not.toBeNull();

    store().selectPerson("C");
    store().tapCell(8);

    expect(store().hint).toBeNull();
  });

  it("maakt een hintplaatsing ongedaan met de gewone undo", () => {
    store().start(puzzle);
    store().showHint();
    store().showHint();
    expect(store().play?.placements.get("B")).toBe(4);

    store().undo();

    expect(store().play?.placements.has("B")).toBe(false);
    expect(store().hintsUsed).toBe(1);
  });

  it("geeft een rustige melding als er geen stap meer is", () => {
    store().start(puzzle);
    placeBramAndAnna();
    for (let press = 0; press < 6; press += 1) store().showHint();

    expect(store().hint?.stage).toBe("none");
    expect(store().hint?.cells).toEqual([]);
  });
});

describe("woorden in de aanwijzing", () => {
  it("onthoudt welk woord op het bord oplicht", () => {
    store().start(puzzle);

    store().focusClue({ kind: "room", roomId: "1" }, "De keuken");

    expect(store().clueFocus).toEqual({ kind: "room", roomId: "1" });
    expect(store().clueFocusLabel).toBe("De keuken");
  });

  it("heft de markering op bij een tweede tik op hetzelfde woord", () => {
    store().start(puzzle);
    store().focusClue({ kind: "room", roomId: "1" }, "De keuken");

    store().focusClue({ kind: "room", roomId: "1" }, "De keuken");

    expect(store().clueFocus).toBeNull();
    expect(store().clueFocusLabel).toBeNull();
  });
});
