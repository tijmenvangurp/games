import type { Province } from "./types";

/**
 * De twaalf provincies van Nederland met hun hoofdstad en coördinaten. De code
 * is de ISO 3166-2-code in kleine letters en is tegelijk de bestandsnaam van de
 * vlag in `apps/games/public/flags`.
 *
 * Gegenereerd door `scripts/generate-geography.ts`; niet met de hand aanpassen.
 * Bronnen: Wikidata (CC0) voor de namen, hoofdsteden, codes en coördinaten,
 * Wikimedia Commons (publiek domein) voor de vlaggen. Zie
 * docs/adr/0015-vlaggenspel.md.
 */
export const PROVINCES: readonly Province[] = [
  {
    code: "nl-dr",
    name: "Drenthe",
    region: "nederland",
    capital: "Assen",
    latitude: 52.92,
    longitude: 6.58,
  },
  {
    code: "nl-fl",
    name: "Flevoland",
    region: "nederland",
    capital: "Lelystad",
    latitude: 52.53,
    longitude: 5.67,
  },
  {
    code: "nl-fr",
    name: "Friesland",
    region: "nederland",
    capital: "Leeuwarden",
    latitude: 53.2,
    longitude: 5.8,
  },
  {
    code: "nl-ge",
    name: "Gelderland",
    region: "nederland",
    capital: "Arnhem",
    latitude: 52.08,
    longitude: 5.92,
  },
  {
    code: "nl-gr",
    name: "Groningen",
    region: "nederland",
    capital: "Groningen",
    latitude: 53.26,
    longitude: 6.74,
  },
  {
    code: "nl-li",
    name: "Limburg",
    region: "nederland",
    capital: "Maastricht",
    latitude: 51.22,
    longitude: 5.93,
  },
  {
    code: "nl-nb",
    name: "Noord-Brabant",
    region: "nederland",
    capital: "'s-Hertogenbosch",
    latitude: 51.63,
    longitude: 5.1,
  },
  {
    code: "nl-nh",
    name: "Noord-Holland",
    region: "nederland",
    capital: "Haarlem",
    latitude: 52.67,
    longitude: 4.83,
  },
  {
    code: "nl-ov",
    name: "Overijssel",
    region: "nederland",
    capital: "Zwolle",
    latitude: 52.5,
    longitude: 6.5,
  },
  {
    code: "nl-ut",
    name: "Utrecht",
    region: "nederland",
    capital: "Utrecht",
    latitude: 52.1,
    longitude: 5.18,
  },
  {
    code: "nl-ze",
    name: "Zeeland",
    region: "nederland",
    capital: "Middelburg",
    latitude: 51.57,
    longitude: 3.75,
  },
  {
    code: "nl-zh",
    name: "Zuid-Holland",
    region: "nederland",
    capital: "Den Haag",
    latitude: 52,
    longitude: 4.67,
  },
];
