import { beforeEach, describe, expect, it } from "vitest";
import { loadMurdokuLevel } from "@entities/murdoku";
import {
  MURDOKU_INTRO_LEVEL,
  createMurdokuText,
  crossedCells,
  useMurdokuStore,
  type MurdokuHintState,
} from "@features/murdoku-game";
import {
  MURDOKU_AQUARIUM_HINT_FIXTURE,
  MURDOKU_FIXTURE,
  MURDOKU_GENERATED_FIXTURE,
} from "../node/murdoku-fixtures";

const puzzle = loadMurdokuLevel(MURDOKU_INTRO_LEVEL);
const generated = loadMurdokuLevel(MURDOKU_GENERATED_FIXTURE);
const fixture = loadMurdokuLevel(MURDOKU_FIXTURE);
const aquarium = loadMurdokuLevel(MURDOKU_AQUARIUM_HINT_FIXTURE);

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
  it("begint met een clue-nudge en past na twee tikken één stap toe", () => {
    store().start(puzzle);
    store().showHint();

    expect(store().hint?.stage).toBe("clue");
    expect(store().hint?.cells.length).toBeGreaterThan(0);
    expect(store().hint?.explanation).toMatchObject({ key: "hint.clueNudgeObject" });
    // Een clue-nudge verandert het bord niet en noemt de doelkamer niet.
    expect(store().play?.placements.size).toBe(0);
    expect(store().hintsUsed).toBe(1);

    store().showHint();
    expect(store().hint?.stage).toBe("focus");
    expect(store().hint?.cells).toEqual([4]);
    expect(store().play?.placements.size).toBe(0);

    store().showHint();

    expect(store().hint?.stage).toBe("place");
    expect(store().play?.placements.get("B")).toBe(4);
    expect(store().play?.wrongCheck).toBe(false);
    // De tweede en derde tik horen bij dezelfde hintstap; ze tellen niet opnieuw.
    expect(store().hintsUsed).toBe(1);
  });

  it("streept één onmogelijk vakje weg in plaats van meteen te plaatsen", () => {
    store().start(generated);

    store().showHint();
    expect(store().hint?.stage).toBe("clue");

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

    for (let press = 0; press < 18; press += 1) store().showHint();

    expect(store().play?.placements.has("C")).toBe(false);
    expect(store().play?.placements.size).toBe(2);
  });

  it("gebruikt de eigen aanwijzing als reden, of zegt dat de rest niet kan", () => {
    store().start(puzzle);

    store().showHint();
    store().showHint();
    expect(store().hint?.stage).toBe("focus");
    expect(store().hint?.explanation.children?.[0]).toMatchObject({ key: "clue.onObject" });

    store().showHint();
    expect(store().hint?.stage).toBe("place");
    expect(store().hint?.explanation).toMatchObject({ key: "hint.placeClue" });

    // De volgende trap plaatst Anna; haar aanwijzing laat vier vakjes open.
    store().showHint();
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
    store().showHint();

    expect(store().hint?.stage).toBe("cross");
    expect(store().hint?.explanation).toMatchObject({ key: "hint.crossPlain" });
    expect(store().play?.wrongCheck).toBe(false);
  });

  it("laat de laatste persoon altijd aan het kind", () => {
    store().start(fixture);
    for (let press = 0; press < 24; press += 1) store().showHint();

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
    store().showHint();

    // De eerste drie tikken zijn één stap; de vierde begint de volgende.
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
    store().showHint();
    expect(store().play?.placements.get("B")).toBe(4);

    store().undo();

    expect(store().play?.placements.has("B")).toBe(false);
    expect(store().hintsUsed).toBe(1);
  });

  it("geeft een rustige melding als er geen stap meer is", () => {
    store().start(puzzle);
    placeBramAndAnna();
    for (let press = 0; press < 18; press += 1) store().showHint();

    expect(store().hint?.stage).toBe("none");
    expect(store().hint?.cells).toEqual([]);
  });

  it("noemt in de eerste aquariumhint geen kamer en wijst daarna de exacte cel aan", () => {
    store().start(aquarium);

    let clueHint: MurdokuHintState | null = null;
    let cellHint: MurdokuHintState | null = null;
    for (let press = 0; press < 180; press += 1) {
      store().showHint();
      const hint = store().hint;
      if (hint?.stage !== "clue" || hint.personId !== "A") continue;

      clueHint = hint;
      store().showHint();
      const focus = store().hint;
      if (focus?.stage === "focus" && focus.cells.length === 1) {
        cellHint = focus;
        break;
      }
    }

    const text = createMurdokuText(aquarium);
    expect(clueHint?.stage).toBe("clue");
    expect(clueHint?.personId).toBe("A");
    expect(clueHint?.explanation).toMatchObject({ key: "hint.clueNudgeObject" });
    expect(text.explanation(clueHint!.explanation)).toBe(
      "Kijk eens naar de aanwijzing van Daan. Waar is nog een tapijt?",
    );
    expect(text.explanation(clueHint!.explanation)).not.toContain("zolder");

    expect(cellHint?.stage).toBe("focus");
    expect(cellHint?.cells).toHaveLength(1);
    expect(cellHint?.explanation.children?.[0]).toMatchObject({ key: "clue.roomExistsOn" });
    const cellText = text.explanation(cellHint!.explanation);
    expect(cellText).toContain("op een tapijt");
    expect(cellText).toContain("Alleen de zolder blijft over");
    expect(cellText).toContain("enige vrije vakje");

    const cell = cellHint!.cells[0]!;
    store().showHint();
    expect(store().hint?.stage).toBe("place");
    expect(store().play?.placements.get("A")).toBe(cell);
    // De hint plaatst nooit de laatste persoon.
    expect(store().play?.placements.size).toBeLessThan(aquarium.suspects.length);
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
