import { currentLanguage, type Language } from "./i18n";

export interface PluralForms {
  readonly one: string;
  readonly other: string;
}

const RULES = new Map<Language, Intl.PluralRules>();

function rulesFor(language: Language): Intl.PluralRules {
  const existing = RULES.get(language);
  if (existing) {
    return existing;
  }
  const rules = new Intl.PluralRules(language);
  RULES.set(language, rules);
  return rules;
}

/**
 * Kiest de enkelvoud- of meervoudsvorm met de regels van de taal. Nederlands en
 * Engels kennen alleen `one` en `other`; andere talen vallen terug op `other`.
 */
export function plural(
  count: number,
  forms: PluralForms,
  language: Language = currentLanguage(),
): string {
  return rulesFor(language).select(count) === "one" ? forms.one : forms.other;
}
