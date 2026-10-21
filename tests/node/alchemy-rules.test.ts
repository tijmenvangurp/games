import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BASE_ELEMENT_IDS,
  ELEMENTS,
  combine,
  createRecipeIndex,
  elementName,
  findRecipeFor,
  findRecipesFor,
  getHint,
  getElement,
  isElementId,
  pairKey,
  reachableElementIds,
  recipesUsing,
  RECIPES,
  tierOf,
  totalElements,
} from "@entities/alchemy";

describe("alchemy rules", () => {
  it("has unique elements with local icons and Dutch names", () => {
    const ids = ELEMENTS.map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(totalElements()).toBe(ELEMENTS.length);

    for (const element of ELEMENTS) {
      expect(element.name.length).toBeGreaterThan(0);
      expect(element.icon).toMatch(/^\/elements\/[a-z-]+\.svg$/);
      expect(element.fact.length).toBeGreaterThan(0);
      expect(getElement(element.id)).toBe(element);
      expect(isElementId(element.id)).toBe(true);
    }
  });

  it("has a local sprite for every element", () => {
    for (const element of ELEMENTS) {
      const file = join(process.cwd(), "apps/games/public", element.icon.replace(/^\//, ""));
      expect(existsSync(file), element.icon).toBe(true);
    }
  });

  it("keeps the four classical elements available", () => {
    expect(BASE_ELEMENT_IDS).toEqual(["water", "fire", "earth", "air"]);
    for (const id of BASE_ELEMENT_IDS) {
      expect(getElement(id)).toBeDefined();
    }
  });

  it("only uses known elements in recipes and has no conflicting pairs", () => {
    const pairs = new Set<string>();

    for (const recipe of RECIPES) {
      expect(isElementId(recipe.a)).toBe(true);
      expect(isElementId(recipe.b)).toBe(true);
      expect(isElementId(recipe.result)).toBe(true);
      const key = pairKey(recipe.a, recipe.b);
      expect(pairs.has(key)).toBe(false);
      pairs.add(key);
    }

    expect(createRecipeIndex().size).toBe(RECIPES.length);
  });

  it("makes every non-base element reachable", () => {
    const reachable = reachableElementIds();
    expect(reachable.size).toBe(ELEMENTS.length);

    for (const element of ELEMENTS) {
      expect(reachable.has(element.id)).toBe(true);
      expect(tierOf(element.id)).toBeLessThan(Number.POSITIVE_INFINITY);
    }
  });

  it("gives every result a recipe and combines in both directions", () => {
    for (const recipe of RECIPES) {
      expect(combine(recipe.a, recipe.b)).toBe(recipe.result);
      expect(combine(recipe.b, recipe.a)).toBe(recipe.result);
      expect(findRecipeFor(recipe.result)?.result).toBe(recipe.result);
      expect(elementName(recipe.result)).not.toBe(recipe.result);
    }
  });

  it("returns null for unknown combinations", () => {
    expect(combine("water", "crown")).toBeNull();
    expect(combine("onbekend", "water")).toBeNull();
  });

  it("suggests a useful next experiment", () => {
    const bases = new Set(BASE_ELEMENT_IDS);
    const hint = getHint(bases);
    expect(hint).not.toBeNull();

    if (hint) {
      expect(bases.has(hint.result)).toBe(false);
      expect(bases.has(hint.a) || bases.has(hint.b)).toBe(true);
      expect(combine(hint.a, hint.b)).toBe(hint.result);
    }

    const everything = new Set(ELEMENTS.map((element) => element.id));
    expect(getHint(everything)).toBeNull();
  });

  it("keeps the element tree at a readable size", () => {
    expect(ELEMENTS.length).toBeGreaterThanOrEqual(90);
    expect(ELEMENTS.length).toBeLessThanOrEqual(120);
    expect(RECIPES.length).toBeGreaterThanOrEqual(90);
  });

  it("supports combining two copies of the same element", () => {
    expect(combine("air", "air")).toBe("storm");
    expect(combine("water", "water")).toBe("sea");
    expect(combine("stone", "stone")).toBe("mountain");
    expect(combine("house", "house")).toBe("village");
    expect(combine("star", "star")).toBe("galaxy");
  });

  it("keeps wind reachable now that two airs make a storm", () => {
    expect(combine("air", "dust")).toBe("wind");
    expect(combine("wind", "rain")).toBe("storm");
  });

  it("builds glass from sand and gives the dragon useful recipes", () => {
    expect(combine("stone", "air")).toBe("sand");
    expect(combine("sand", "fire")).toBe("glass");
    expect(combine("sand", "glass")).toBe("hourglass");
    expect(findRecipesFor("glass").length).toBeGreaterThanOrEqual(2);
    expect(recipesUsing("dragon").length).toBeGreaterThanOrEqual(3);
    expect(combine("dragon", "castle")).toBe("fairytale");
    expect(combine("dragon", "knight")).toBe("fairytale");
  });

  it("adds playful combinations children can guess", () => {
    expect(combine("wheel", "wheel")).toBe("bicycle");
    expect(combine("metal", "wheel")).toBe("car");
    expect(combine("car", "fire")).toBe("firetruck");
    expect(combine("plant", "mud")).toBe("potato");
    expect(combine("potato", "fire")).toBe("fries");
    expect(combine("bread", "cow")).toBe("burger");
    expect(combine("human", "fish")).toBe("mermaid");
    expect(combine("human", "treasure")).toBe("pirate");
    expect(combine("cat", "sun")).toBe("lion");
    expect(combine("bird", "ice")).toBe("penguin");
  });

  it("offers alternate routes to the same element", () => {
    expect(findRecipesFor("steam").length).toBeGreaterThanOrEqual(2);
    expect(findRecipesFor("metal").length).toBeGreaterThanOrEqual(2);
    expect(findRecipesFor("magic").length).toBeGreaterThanOrEqual(2);
    expect(findRecipesFor("stone").length).toBeGreaterThanOrEqual(2);
    expect(combine("lava", "water")).toBe("stone");
    expect(recipesUsing("fire").length).toBeGreaterThan(0);
    expect(recipesUsing("onbekend")).toEqual([]);
  });

  it("handles unreachable ingredients in custom recipe sets", () => {
    const recipes = [{ a: "water", b: "onbekend", result: "x" }];

    expect(tierOf("x", recipes)).toBe(Number.POSITIVE_INFINITY);
    expect(reachableElementIds(recipes).has("x")).toBe(false);
  });

  it("falls back to the id for an unknown element name", () => {
    expect(elementName("onbekend")).toBe("onbekend");
  });
});
