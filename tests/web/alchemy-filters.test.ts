import { describe, expect, it } from "vitest";
import { ELEMENTS, ELEMENT_CATEGORIES } from "@entities/alchemy";
import { filterAndSortElements } from "@features/alchemy-lab";

describe("alchemy element filters", () => {
  it("filters by category", () => {
    const water = filterAndSortElements(ELEMENTS, "water", "new");

    expect(water.length).toBeGreaterThan(0);
    expect(water.every((element) => element.category === "water")).toBe(true);
  });

  it("sorts alphabetically within a category", () => {
    const names = filterAndSortElements(ELEMENTS, "fantasy", "name").map((element) => element.name);

    expect(names).toEqual([...names].sort((first, second) => first.localeCompare(second, "nl")));
  });

  it("sorts by category order and then by name", () => {
    const sorted = filterAndSortElements(ELEMENTS, "all", "category");
    const indices = sorted.map((element) => ELEMENT_CATEGORIES.indexOf(element.category));

    expect(indices).toEqual([...indices].sort((first, second) => first - second));
  });

  it("keeps the incoming order for the newest-first view", () => {
    const sample = ELEMENTS.slice(0, 6);

    expect(filterAndSortElements(sample, "all", "new")).toEqual(sample);
  });
});
