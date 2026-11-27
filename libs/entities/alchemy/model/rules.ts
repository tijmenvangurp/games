import { BASE_ELEMENT_IDS, ELEMENTS } from "./elements";
import { RECIPES } from "./recipes";
import type { ElementId, Hint, Recipe } from "./types";

export function pairKey(a: ElementId, b: ElementId): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function createRecipeIndex(
  recipes: readonly Recipe[] = RECIPES,
): ReadonlyMap<string, ElementId> {
  const index = new Map<string, ElementId>();
  for (const recipe of recipes) {
    index.set(pairKey(recipe.a, recipe.b), recipe.result);
  }
  return index;
}

const RECIPE_INDEX = createRecipeIndex();

export function combine(a: ElementId, b: ElementId): ElementId | null {
  return RECIPE_INDEX.get(pairKey(a, b)) ?? null;
}

export function reachableElementIds(
  recipes: readonly Recipe[] = RECIPES,
  bases: readonly ElementId[] = BASE_ELEMENT_IDS,
): ReadonlySet<ElementId> {
  const reachable = new Set<ElementId>(bases);
  let changed = true;

  while (changed) {
    changed = false;
    for (const recipe of recipes) {
      if (reachable.has(recipe.a) && reachable.has(recipe.b) && !reachable.has(recipe.result)) {
        reachable.add(recipe.result);
        changed = true;
      }
    }
  }

  return reachable;
}

export function tierOf(id: ElementId, recipes: readonly Recipe[] = RECIPES): number {
  const tiers = new Map<ElementId, number>(BASE_ELEMENT_IDS.map((base) => [base, 0] as const));
  let changed = true;

  while (changed) {
    changed = false;
    for (const recipe of recipes) {
      const first = tiers.get(recipe.a);
      const second = tiers.get(recipe.b);
      if (first === undefined || second === undefined) {
        continue;
      }

      const next = Math.max(first, second) + 1;
      const current = tiers.get(recipe.result);
      if (current === undefined || next < current) {
        tiers.set(recipe.result, next);
        changed = true;
      }
    }
  }

  return tiers.get(id) ?? Number.POSITIVE_INFINITY;
}

export function findRecipesFor(result: ElementId, recipes: readonly Recipe[] = RECIPES): Recipe[] {
  return recipes.filter((recipe) => recipe.result === result);
}

export function findRecipeFor(result: ElementId): Recipe | undefined {
  return findRecipesFor(result)[0];
}

export function recipesUsing(elementId: ElementId, recipes: readonly Recipe[] = RECIPES): Recipe[] {
  return recipes.filter((recipe) => recipe.a === elementId || recipe.b === elementId);
}

/**
 * The ingredient a hint names: the one the child already has. For a recipe
 * with two identical ingredients that is the ingredient itself.
 */
export function hintIngredient(hint: Hint, discovered: ReadonlySet<ElementId>): ElementId {
  if (discovered.has(hint.a)) {
    return hint.a;
  }
  if (discovered.has(hint.b)) {
    return hint.b;
  }
  return hint.a;
}

/**
 * Lists the recipes that can still yield something new. Recipes whose
 * ingredients are both known come first, because they are the easiest next
 * step; recipes with one known ingredient follow. A discovered result is
 * never a hint.
 */
export function hintCandidates(
  discovered: ReadonlySet<ElementId>,
  recipes: readonly Recipe[] = RECIPES,
): Hint[] {
  const bothKnown: Hint[] = [];
  const oneKnown: Hint[] = [];

  for (const recipe of recipes) {
    if (discovered.has(recipe.result)) {
      continue;
    }

    const firstKnown = discovered.has(recipe.a);
    const secondKnown = discovered.has(recipe.b);
    if (firstKnown && secondKnown) {
      bothKnown.push(recipe);
    } else if (firstKnown || secondKnown) {
      oneKnown.push(recipe);
    }
  }

  return [...bothKnown, ...oneKnown];
}

/**
 * Gives the most useful next experiment. Prefers a recipe whose ingredients
 * are both known, then one with a single known ingredient. Never reveals an
 * element that is already discovered.
 */
export function getHint(
  discovered: ReadonlySet<ElementId>,
  recipes: readonly Recipe[] = RECIPES,
): Hint | null {
  return hintCandidates(discovered, recipes)[0] ?? null;
}

export function totalElements(): number {
  return ELEMENTS.length;
}
