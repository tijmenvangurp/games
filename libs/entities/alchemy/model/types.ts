export type ElementId = string;

export type ElementCategory =
  | "water"
  | "fire"
  | "earth"
  | "air"
  | "life"
  | "food"
  | "tech"
  | "fantasy";

export const ELEMENT_CATEGORIES = [
  "water",
  "fire",
  "earth",
  "air",
  "life",
  "food",
  "tech",
  "fantasy",
] as const satisfies readonly ElementCategory[];

export const ELEMENT_CATEGORY_LABELS: Record<ElementCategory, string> = {
  water: "Water",
  fire: "Vuur",
  earth: "Aarde",
  air: "Lucht",
  life: "Leven",
  food: "Eten",
  tech: "Techniek",
  fantasy: "Fantasie",
};

export interface AlchemyElement {
  id: ElementId;
  name: string;
  icon: string;
  category: ElementCategory;
  fact: string;
}

export interface Recipe {
  a: ElementId;
  b: ElementId;
  result: ElementId;
}

export interface Hint {
  a: ElementId;
  b: ElementId;
  result: ElementId;
}
