import type { Recipe } from "./types";

/**
 * The recipe list is deliberately small and hand-checked. Every result is
 * reachable from water, fire, earth and air; tests enforce that invariant.
 */
export const RECIPES: readonly Recipe[] = [
  { a: "water", b: "earth", result: "mud" },
  { a: "water", b: "fire", result: "steam" },
  { a: "earth", b: "fire", result: "lava" },
  { a: "air", b: "fire", result: "energy" },
  { a: "air", b: "water", result: "rain" },
  { a: "air", b: "earth", result: "dust" },
  { a: "earth", b: "rain", result: "plant" },
  { a: "lava", b: "air", result: "stone" },
  { a: "steam", b: "air", result: "cloud" },
  { a: "mud", b: "energy", result: "life" },
  { a: "stone", b: "fire", result: "metal" },
  { a: "plant", b: "earth", result: "tree" },
  { a: "tree", b: "metal", result: "wood" },
  { a: "wood", b: "stone", result: "house" },
  { a: "life", b: "water", result: "fish" },
  { a: "life", b: "air", result: "bird" },
  { a: "life", b: "earth", result: "human" },
  { a: "life", b: "fire", result: "dragon" },
];
