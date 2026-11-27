import { i18n } from "@shared/i18n";

/**
 * Korte bemoedigingen voor spellen zonder eigen spraak. De reeks schuift per
 * ronde en per vraag op, zodat dezelfde beurt altijd dezelfde regel houdt.
 * De teksten komen uit de actieve taal (`praise` in de locales).
 */
export function praiseFor(seed: number, index = 0): string {
  const lines = i18n.t("praise", { returnObjects: true });
  const variant = Math.abs(Math.trunc(seed) + index) % lines.length;
  return lines[variant] ?? "";
}
