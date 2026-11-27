import { currentLanguage, type Language } from "@shared/i18n";
import { ELEMENTS } from "./elements";
import {
  ENGLISH_CATEGORY_LABELS,
  ENGLISH_ELEMENTS,
  ENGLISH_MISSION_TITLES,
  type ElementText,
} from "./elements-en";
import { MISSIONS, type Mission } from "./missions";
import { ELEMENT_CATEGORY_LABELS, type ElementCategory, type ElementId } from "./types";

const ELEMENT_TEXTS: Readonly<Record<Language, ReadonlyMap<ElementId, ElementText>>> = {
  nl: new Map(ELEMENTS.map((element) => [element.id, element])),
  en: new Map(Object.entries(ENGLISH_ELEMENTS)),
};

const CATEGORY_LABELS: Readonly<Record<Language, Readonly<Record<ElementCategory, string>>>> = {
  nl: ELEMENT_CATEGORY_LABELS,
  en: ENGLISH_CATEGORY_LABELS,
};

const MISSION_TITLES: Readonly<Record<Language, ReadonlyMap<string, string>>> = {
  nl: new Map(MISSIONS.map((mission) => [mission.id, mission.title])),
  en: new Map(Object.entries(ENGLISH_MISSION_TITLES)),
};

/** De naam van een element in de gekozen taal; een onbekend id blijft zichtbaar als id. */
export function elementName(id: ElementId, language: Language = currentLanguage()): string {
  return ELEMENT_TEXTS[language].get(id)?.name ?? id;
}

/** Het weetje bij een element in de gekozen taal; leeg voor een onbekend id. */
export function elementFact(id: ElementId, language: Language = currentLanguage()): string {
  return ELEMENT_TEXTS[language].get(id)?.fact ?? "";
}

export function categoryLabel(
  category: ElementCategory,
  language: Language = currentLanguage(),
): string {
  return CATEGORY_LABELS[language][category];
}

export function missionTitle(mission: Mission, language: Language = currentLanguage()): string {
  return MISSION_TITLES[language].get(mission.id) ?? mission.title;
}
