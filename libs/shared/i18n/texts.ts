import { currentLanguage, useLanguage, type Language } from "./i18n";
import type { Widen } from "./widen";

/** Teksten van één slice in elke taal. Maak ze met `defineTexts`. */
export type Texts<T> = Readonly<Record<Language, T>>;

/**
 * Teksten voor één spel of scherm, naast de code die ze gebruikt. Nederlands is de
 * bron: de Engelse kant moet precies dezelfde sleutels en functies hebben.
 *
 * ```ts
 * const texts = defineTexts(
 *   { start: "Spelen", stars: (count: number) => `${count} sterren` },
 *   { start: "Play", stars: (count: number) => `${count} stars` },
 * );
 * const t = useTexts(texts); // in een component
 * const t = getTexts(texts); // in een store of generator
 * ```
 */
export function defineTexts<const T>(nl: T, en: Widen<T>): Texts<Widen<T>> {
  return { nl: nl as Widen<T>, en };
}

/** De teksten in de gekozen taal; rendert opnieuw als de taal wisselt. */
export function useTexts<T>(texts: Texts<T>): T {
  return texts[useLanguage()];
}

/** De teksten in de actieve taal, buiten React. */
export function getTexts<T>(texts: Texts<T>): T {
  return texts[currentLanguage()];
}
