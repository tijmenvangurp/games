import { beforeEach, describe, expect, it } from "vitest";
import {
  CELL_POINTS,
  clearCellPoints,
  loadCellPoints,
  saveCellPoints,
} from "../../libs/features/ganzenbord/model/board-points";

const KEY = "games.ganzenbord.board-points.v1";

describe("ganzenbord: bordposities", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("gebruikt zonder aanpassing de vaste punten", () => {
    const points = loadCellPoints();
    expect(points[1]).toEqual(CELL_POINTS[1]);
    expect(points[63]).toEqual(CELL_POINTS[63]);
  });

  it("bewaart alleen de vakjes die echt verschillen", () => {
    saveCellPoints({ ...CELL_POINTS, 5: { x: 12.5, y: 34.5 } });

    expect(JSON.parse(localStorage.getItem(KEY) ?? "{}")).toEqual({
      5: { x: 12.5, y: 34.5 },
    });
    expect(loadCellPoints()[5]).toEqual({ x: 12.5, y: 34.5 });
    expect(loadCellPoints()[6]).toEqual(CELL_POINTS[6]);
  });

  it("negeert ongeldige waarden in de opslag", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        2: { x: 10, y: 20 },
        3: { x: -1, y: 20 },
        4: { x: 10, y: "20" },
        64: { x: 10, y: 20 },
        hallo: { x: 10, y: 20 },
      }),
    );

    const points = loadCellPoints();
    expect(points[2]).toEqual({ x: 10, y: 20 });
    expect(points[3]).toEqual(CELL_POINTS[3]);
    expect(points[4]).toEqual(CELL_POINTS[4]);
    expect(points[64]).toBeUndefined();
  });

  it("valt terug op de vaste punten bij kapotte opslag", () => {
    localStorage.setItem(KEY, "{geen json");

    expect(loadCellPoints()).toEqual(CELL_POINTS);
  });

  it("wist de aanpassingen", () => {
    saveCellPoints({ ...CELL_POINTS, 7: { x: 1, y: 2 } });
    clearCellPoints();

    expect(localStorage.getItem(KEY)).toBeNull();
    expect(loadCellPoints()[7]).toEqual(CELL_POINTS[7]);
  });
});
