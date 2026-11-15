import { describe, expect, it } from "vitest";
import { loadMurdokuLevel, nextMurdokuHint } from "@entities/murdoku";
import { MURDOKU_INTRO_LEVEL, MURDOKU_INTRO_SOLUTION } from "@features/murdoku-game";
import { MURDOKU_FIXTURE } from "./murdoku-fixtures";

const intro = loadMurdokuLevel(MURDOKU_INTRO_LEVEL);
const fixture = loadMurdokuLevel(MURDOKU_FIXTURE);

/** De automatische kruisjes van de rij en kolom van elke plaatsing. */
function autoCrosses(puzzle: ReturnType<typeof loadMurdokuLevel>, cells: number[]): Set<number> {
  const crosses = new Set<number>();
  for (const cell of cells) {
    const { row, col } = puzzle.board.rc(cell);
    for (const c of puzzle.board.cellsInRow(row)) crosses.add(c);
    for (const c of puzzle.board.cellsInCol(col)) crosses.add(c);
    crosses.delete(cell);
  }
  return crosses;
}

describe("nextMurdokuHint", () => {
  it("geeft op een leeg bord de eerste gedwongen plaatsing", () => {
    const hint = nextMurdokuHint(intro, { placements: new Map() });

    expect(hint).toMatchObject({ kind: "place", personId: "B", cells: [4], placeCell: 4 });
    expect(hint?.technique).toBe("nakedSingle");
  });

  it("gebruikt de plaatsingen en kruisjes van de speler", () => {
    const placements = new Map([
      ["B", 4],
      ["A", 1],
    ]);
    const hint = nextMurdokuHint(intro, {
      placements,
      crosses: autoCrosses(intro, [4, 1]),
    });

    // Rij 4 heeft nog één vrij vakje; de kolom daarvan is daarmee bezet.
    expect(hint).toMatchObject({ kind: "exclude", cells: [10], placeCell: null });
    expect(hint?.personId).toBeNull();
    // De engine noemt de rij waar de stap over gaat; de hint licht die op.
    expect(hint?.line).toEqual({ axis: "row", index: 3 });
  });

  it("geeft geen hint meer als alle verdachten staan", () => {
    expect(
      nextMurdokuHint(intro, {
        placements: new Map([...MURDOKU_INTRO_SOLUTION].filter(([id]) => id !== "victim")),
      }),
    ).toBeNull();
  });

  it("volgt de fixture-oplossing in gedwongen stappen", () => {
    const seen: string[] = [];
    const placements = new Map<string, number>();
    for (let step = 0; step < 4; step += 1) {
      const hint = nextMurdokuHint(fixture, {
        placements,
        crosses: autoCrosses(fixture, [...placements.values()]),
      });
      if (!hint) break;
      seen.push(`${hint.kind}:${hint.personId ?? "-"}@${hint.cells[0]}`);
      if (hint.kind === "place" && hint.personId && hint.placeCell !== null) {
        placements.set(hint.personId, hint.placeCell);
      }
    }

    expect(seen).toEqual(["place:B@6", "place:A@3", "place:C@8"]);
  });
});
