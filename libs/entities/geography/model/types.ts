export const CONTINENTS = [
  "europa",
  "azie",
  "afrika",
  "noord-amerika",
  "zuid-amerika",
  "oceanie",
] as const;

export type Continent = (typeof CONTINENTS)[number];

/**
 * The areas the flag quiz can draw from: the whole world, a continent, or the
 * provinces of the Netherlands.
 */
export const FLAG_SCOPES = ["wereld", ...CONTINENTS, "nederland"] as const;

export type FlagScope = (typeof FLAG_SCOPES)[number];

export const FLAG_LEVELS = ["makkelijk", "gemiddeld", "moeilijk"] as const;

export type FlagLevel = (typeof FLAG_LEVELS)[number];

/**
 * Both directions are mixed inside one round: a flag to pick a name for, and a
 * name to pick a flag for.
 */
export const FLAG_DIRECTIONS = ["vlag-naar-land", "land-naar-vlag"] as const;

export type FlagDirection = (typeof FLAG_DIRECTIONS)[number];

/** Where a subject lies: a continent, or the country whose provinces it is. */
export type Region = Continent | "nederland";

/**
 * Anything the flag quiz can ask about: a sovereign state or a Dutch province.
 * Countries and provinces share the same shape so the quiz rules stay one
 * implementation; only the country-specific fields live on `Country`.
 */
export interface FlagSubject {
  /** Stable code, also the file name of the local flag asset. */
  code: string;
  /** Dutch display name, for example "Nederland", "Zuid-Afrika" or "Drenthe". */
  name: string;
  region: Region;
  /** Dutch capital name(s); South Africa has three. */
  capital: string;
  latitude: number;
  longitude: number;
}

export interface Country extends FlagSubject {
  region: Continent;
  /** ISO 3166-1 numeric code, zero padded to three digits; "" when unknown. */
  numeric: string;
}

export interface Province extends FlagSubject {
  region: "nederland";
}

export interface FlagQuestion {
  id: number;
  direction: FlagDirection;
  /** The subject the question is about; also the correct choice. */
  subject: FlagSubject;
  /** The names or flags to choose from, including the correct one. */
  choices: readonly FlagSubject[];
}

export interface FlagRound {
  scope: FlagScope;
  level: FlagLevel;
  seed: number;
  questions: readonly FlagQuestion[];
}
