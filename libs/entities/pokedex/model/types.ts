export interface Pokemon {
  /** National Pokédex number, 1 through 151. */
  id: number;
  /** Display name, for example "Pikachu" or "Mr. Mime". */
  name: string;
  /** Lowercase name used for local cry and animation files. */
  slug: string;
}
