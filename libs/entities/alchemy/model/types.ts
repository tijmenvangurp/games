export type ElementId = string;

export type ElementCategory = "water" | "fire" | "earth" | "air" | "life" | "tech" | "fantasy";

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
