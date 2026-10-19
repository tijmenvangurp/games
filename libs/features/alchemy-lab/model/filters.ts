import {
  ELEMENT_CATEGORIES,
  ELEMENT_CATEGORY_LABELS,
  type AlchemyElement,
  type ElementCategory,
} from "@entities/alchemy";

export type CategoryFilter = ElementCategory | "all";
export type ElementSort = "new" | "category" | "name";

export const CATEGORY_FILTER_OPTIONS = [
  { value: "all", label: "Alles" },
  ...ELEMENT_CATEGORIES.map((category) => ({
    value: category,
    label: ELEMENT_CATEGORY_LABELS[category],
  })),
] as const satisfies readonly { value: CategoryFilter; label: string }[];

export const SORT_OPTIONS = [
  { value: "new", label: "Nieuw" },
  { value: "category", label: "Categorie" },
  { value: "name", label: "A–Z" },
] as const satisfies readonly { value: ElementSort; label: string }[];

export function filterAndSortElements(
  elements: readonly AlchemyElement[],
  category: CategoryFilter,
  sort: ElementSort,
): AlchemyElement[] {
  const filtered =
    category === "all" ? [...elements] : elements.filter((item) => item.category === category);

  if (sort === "name") {
    return filtered.sort((first, second) => first.name.localeCompare(second.name, "nl"));
  }

  if (sort === "category") {
    return filtered.sort((first, second) => {
      const difference =
        ELEMENT_CATEGORIES.indexOf(first.category) - ELEMENT_CATEGORIES.indexOf(second.category);
      return difference === 0 ? first.name.localeCompare(second.name, "nl") : difference;
    });
  }

  return filtered;
}
