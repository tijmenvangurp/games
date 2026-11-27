import { defineTexts, plural } from "@shared/i18n";

/** Gebieden, niveaus, vragen en uitleg van Vlaggenreis in elke taal. */
export const geographyTexts = defineTexts(
  {
    scopes: {
      wereld: "Hele wereld",
      europa: "Europa",
      azie: "Azië",
      afrika: "Afrika",
      "noord-amerika": "Noord-Amerika",
      "zuid-amerika": "Zuid-Amerika",
      oceanie: "Oceanië",
      nederland: "Nederland",
    },
    /** Het gebied midden in een zin: "… ligt in Nederland". */
    regionsInSentence: {
      europa: "Europa",
      azie: "Azië",
      afrika: "Afrika",
      "noord-amerika": "Noord-Amerika",
      "zuid-amerika": "Zuid-Amerika",
      oceanie: "Oceanië",
      nederland: "Nederland",
    },
    allCountries: (count: number) => `Alle ${count} landen`,
    countries: (count: number) =>
      plural(count, { one: `${count} land`, other: `${count} landen` }, "nl"),
    provinces: (count: number) =>
      plural(count, { one: `${count} provincie`, other: `${count} provincies` }, "nl"),
    allProvinces: (count: number) => `Alle ${count} provincies`,
    levels: { makkelijk: "Makkelijk", gemiddeld: "Gemiddeld", moeilijk: "Moeilijk" },
    easyHint: "3 keuzes",
    mediumHint: "4 keuzes",
    worldChoices: (count: number) => `${count} keuzes uit de hele wereld`,
    continentChoices: (count: number) => `${count} keuzes uit hetzelfde continent`,
    prompts: {
      "vlag-naar-land": {
        countries: "Welk land hoort bij deze vlag?",
        provinces: "Welke provincie hoort bij deze vlag?",
      },
      "land-naar-vlag": {
        countries: "Welke vlag hoort bij dit land?",
        provinces: "Welke vlag hoort bij deze provincie?",
      },
    },
    flagOf: (name: string, region: string) =>
      `Dit is de vlag van ${name}. ${name} ligt in ${region}.`,
    rightFlag: (name: string, region: string) =>
      `De vlag van ${name} is de juiste. ${name} ligt in ${region}.`,
    capital: (capital: string) => ` De hoofdstad is ${capital}.`,
    capitals: (capitals: string) => ` De hoofdsteden zijn ${capitals}.`,
  },
  {
    scopes: {
      wereld: "Whole world",
      europa: "Europe",
      azie: "Asia",
      afrika: "Africa",
      "noord-amerika": "North America",
      "zuid-amerika": "South America",
      oceanie: "Oceania",
      nederland: "Netherlands",
    },
    regionsInSentence: {
      europa: "Europe",
      azie: "Asia",
      afrika: "Africa",
      "noord-amerika": "North America",
      "zuid-amerika": "South America",
      oceanie: "Oceania",
      nederland: "the Netherlands",
    },
    allCountries: (count: number) => `All ${count} countries`,
    countries: (count: number) =>
      plural(count, { one: `${count} country`, other: `${count} countries` }, "en"),
    provinces: (count: number) =>
      plural(count, { one: `${count} province`, other: `${count} provinces` }, "en"),
    allProvinces: (count: number) => `All ${count} provinces`,
    levels: { makkelijk: "Easy", gemiddeld: "Medium", moeilijk: "Hard" },
    easyHint: "3 choices",
    mediumHint: "4 choices",
    worldChoices: (count: number) => `${count} choices from the whole world`,
    continentChoices: (count: number) => `${count} choices from the same continent`,
    prompts: {
      "vlag-naar-land": {
        countries: "Which country does this flag belong to?",
        provinces: "Which province does this flag belong to?",
      },
      "land-naar-vlag": {
        countries: "Which flag belongs to this country?",
        provinces: "Which flag belongs to this province?",
      },
    },
    // Het Engels begint de tweede zin met "It", zodat er nooit "the" vooraan hoeft.
    flagOf: (name: string, region: string) => `This is the flag of ${name}. It is in ${region}.`,
    rightFlag: (name: string, region: string) =>
      `The flag of ${name} is the right one. It is in ${region}.`,
    capital: (capital: string) => ` The capital is ${capital}.`,
    capitals: (capitals: string) => ` The capitals are ${capitals}.`,
  },
);
