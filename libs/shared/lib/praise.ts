/**
 * Korte bemoedigingen voor spellen zonder eigen spraak. De reeks schuift per
 * ronde en per vraag op, zodat dezelfde beurt altijd dezelfde regel houdt.
 */
const SIMPLE_PRAISE = [
  "Goedzo!",
  "Knap gedaan!",
  "Top gedaan!",
  "Helemaal goed!",
  "Slim gedaan!",
  "Super!",
] as const;

export function praiseFor(seed: number, index = 0): string {
  const variant = Math.abs(Math.trunc(seed) + index) % SIMPLE_PRAISE.length;
  return SIMPLE_PRAISE[variant];
}
