import { describe, expect, it } from "vitest";
import { COUNTRIES, PROVINCES, worldMap, type Country } from "@entities/geography";

const WIDTH = 320;
const HEIGHT = 180;

function country(code: string): Country {
  const found = COUNTRIES.find((candidate) => candidate.code === code);
  if (!found) {
    throw new Error(`Onbekend land in de test: ${code}`);
  }
  return found;
}

function expectValidPath(path: string): void {
  expect(path.length).toBeGreaterThan(0);
  expect(path.startsWith("M")).toBe(true);
  expect(path).not.toContain("NaN");
  expect(path).not.toContain("Infinity");
}

describe("world map", () => {
  it("renders land, a highlighted country and a marker", async () => {
    const map = await worldMap(country("nl"), WIDTH, HEIGHT);

    expectValidPath(map.land);
    expectValidPath(map.highlight);
    expect(map.highlight).not.toBe(map.land);
    expect(map.marker.x).toBeGreaterThan(0);
    expect(map.marker.x).toBeLessThan(WIDTH);
    expect(map.marker.y).toBeGreaterThan(0);
    expect(map.marker.y).toBeLessThan(HEIGHT);
  });

  it("is deterministic", async () => {
    const first = await worldMap(country("br"), WIDTH, HEIGHT);
    const again = await worldMap(country("br"), WIDTH, HEIGHT);

    expect(again).toEqual(first);
  });

  it("falls back to a marker when Natural Earth has no outline", async () => {
    const kosovo = country("xk");
    expect(kosovo.numeric).toBe("");

    const map = await worldMap(kosovo, WIDTH, HEIGHT);

    expectValidPath(map.land);
    expect(map.highlight).toBe("");
    expect(Number.isFinite(map.marker.x)).toBe(true);
    expect(Number.isFinite(map.marker.y)).toBe(true);
  });

  it("keeps countries on the antimeridian usable", async () => {
    const map = await worldMap(country("fj"), WIDTH, HEIGHT);

    expectValidPath(map.highlight);
    expect(Number.isFinite(map.marker.x)).toBe(true);
    expect(Number.isFinite(map.marker.y)).toBe(true);
  });

  it("gives every country a marker on the map", async () => {
    for (const entry of COUNTRIES) {
      const map = await worldMap(entry, WIDTH, HEIGHT);
      expect(Number.isFinite(map.marker.x)).toBe(true);
      expect(Number.isFinite(map.marker.y)).toBe(true);
    }
  });

  it("puts a province on the map as a marker", async () => {
    const drenthe = PROVINCES.find((province) => province.code === "nl-dr");
    if (!drenthe) {
      throw new Error("Drenthe ontbreekt");
    }

    const map = await worldMap(drenthe, WIDTH, HEIGHT);

    expectValidPath(map.land);
    // Provinces have no outline in the world atlas (yet): the marker carries
    // them and the outline is simply empty.
    expect(map.highlight).toBe("");
    expect(Number.isFinite(map.marker.x)).toBe(true);
    expect(map.marker.x).toBeGreaterThan(0);
    expect(map.marker.x).toBeLessThan(WIDTH);
  });
});
