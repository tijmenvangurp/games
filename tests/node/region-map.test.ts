import { describe, expect, it } from "vitest";
import { COUNTRIES, PROVINCES, regionMap, type Country } from "@entities/geography";

const WIDTH = 320;
const HEIGHT = 220;

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

describe("region map", () => {
  it("shows the whole continent with the country highlighted", async () => {
    const map = await regionMap(country("nl"), WIDTH, HEIGHT);

    expectValidPath(map.land);
    expectValidPath(map.highlight);
    // More than one country: this is the continent, not a close-up.
    expect(map.land.match(/M/g)?.length ?? 0).toBeGreaterThan(10);
    expect(map.highlight).not.toBe(map.land);
    expect(map.marker.x).toBeGreaterThan(0);
    expect(map.marker.x).toBeLessThan(WIDTH);
    expect(map.marker.y).toBeGreaterThan(0);
    expect(map.marker.y).toBeLessThan(HEIGHT);
    expect(map.width).toBe(WIDTH);
    expect(map.height).toBe(HEIGHT);
  });

  it("falls back to a marker for a country without an outline", async () => {
    const kosovo = country("xk");
    expect(kosovo.numeric).toBe("");

    const map = await regionMap(kosovo, WIDTH, HEIGHT);

    expectValidPath(map.land);
    expect(map.highlight).toBe("");
    expect(Number.isFinite(map.marker.x)).toBe(true);
    expect(map.marker.y).toBeGreaterThan(0);
    expect(map.marker.y).toBeLessThan(HEIGHT);
  });

  it("gives every country a marker on its continent", async () => {
    for (const entry of COUNTRIES) {
      const map = await regionMap(entry, WIDTH, HEIGHT);
      expect(Number.isFinite(map.marker.x)).toBe(true);
      expect(Number.isFinite(map.marker.y)).toBe(true);
      expect(map.marker.x).toBeGreaterThanOrEqual(0);
      expect(map.marker.x).toBeLessThanOrEqual(WIDTH);
      expect(map.marker.y).toBeGreaterThanOrEqual(0);
      expect(map.marker.y).toBeLessThanOrEqual(HEIGHT);
    }
  });

  it("uses the province map for a province", async () => {
    const drenthe = PROVINCES.find((province) => province.code === "nl-dr");
    if (!drenthe) {
      throw new Error("Drenthe ontbreekt");
    }

    const map = await regionMap(drenthe, 240, 260);

    expectValidPath(map.land);
    expectValidPath(map.highlight);
    expect(map.width).toBe(240);
    expect(map.height).toBe(260);
  });
});
