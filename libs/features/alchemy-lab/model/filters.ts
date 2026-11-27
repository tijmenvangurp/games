import {
  ELEMENT_CATEGORIES,
  elementName,
  type AlchemyElement,
  type ElementCategory,
} from "@entities/alchemy";
import { currentLanguage, type Language } from "@shared/i18n";

export type CategoryFilter = ElementCategory | "all";
export type ElementSort = "new" | "category" | "name";

export const CATEGORY_FILTERS = [
  "all",
  ...ELEMENT_CATEGORIES,
] as const satisfies readonly CategoryFilter[];

export const ELEMENT_SORTS = ["new", "category", "name"] as const satisfies readonly ElementSort[];

/** Sorteert en filtert op de naam in de gekozen taal, zodat A–Z ook in het Engels klopt. */
export function filterAndSortElements(
  elements: readonly AlchemyElement[],
  category: CategoryFilter,
  sort: ElementSort,
  language: Language = currentLanguage(),
): AlchemyElement[] {
  const filtered =
    category === "all" ? [...elements] : elements.filter((item) => item.category === category);
  const byName = (first: AlchemyElement, second: AlchemyElement) =>
    elementName(first.id, language).localeCompare(elementName(second.id, language), language);

  if (sort === "name") {
    return filtered.sort(byName);
  }

  if (sort === "category") {
    return filtered.sort((first, second) => {
      const difference =
        ELEMENT_CATEGORIES.indexOf(first.category) - ELEMENT_CATEGORIES.indexOf(second.category);
      return difference === 0 ? byName(first, second) : difference;
    });
  }

  return filtered;
}
