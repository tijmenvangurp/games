export const FLAG_CONTINENTS = [
  "europa",
  "azie",
  "afrika",
  "noord-amerika",
  "zuid-amerika",
  "oceanie",
] as const;

export type FlagContinent = (typeof FLAG_CONTINENTS)[number];

/** A continent, or the whole world. */
export const FLAG_SCOPES = ["wereld", ...FLAG_CONTINENTS] as const;

export type FlagScope = (typeof FLAG_SCOPES)[number];

export const FLAG_LEVELS = ["makkelijk", "gemiddeld", "moeilijk"] as const;

export type FlagLevel = (typeof FLAG_LEVELS)[number];

/**
 * Both directions are mixed inside one round: a flag to pick a country name
 * for, and a country name to pick a flag for.
 */
export const FLAG_DIRECTIONS = ["vlag-naar-land", "land-naar-vlag"] as const;

export type FlagDirection = (typeof FLAG_DIRECTIONS)[number];

export interface FlagCountry {
  /** Lowercase ISO 3166-1 alpha-2 code, matching the local `flags/<code>.svg`. */
  code: string;
  /** Dutch display name, for example "Nederland" or "Zuid-Afrika". */
  name: string;
  continent: FlagContinent;
}

export interface FlagQuestion {
  id: number;
  direction: FlagDirection;
  /** The country the question is about; also the correct choice. */
  country: FlagCountry;
  /** The country names or flags to choose from, including the correct one. */
  choices: readonly FlagCountry[];
}

export interface FlagRound {
  scope: FlagScope;
  level: FlagLevel;
  seed: number;
  questions: readonly FlagQuestion[];
}
