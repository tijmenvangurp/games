import { defineTexts, getTexts } from "@shared/i18n";

/** Namen van thema's, niveaus en symbolen. Nederlands is de bron. */
export const geheimeCodeTexts = defineTexts(
  {
    themes: { sinterklaas: "Sinterklaas", tuin: "Tuin", onderwater: "Onder water" },
    themeDescriptions: {
      sinterklaas: "Pakjes, pepernoten en de boot.",
      tuin: "Bloemen, dieren en de slak.",
      onderwater: "Vissen, koraal en de zee.",
    },
    levels: { 1: "Kijk & schrijf", 2: "Zoek & schrijf", 3: "Kraak de code" },
    levelDescriptions: {
      1: "Vier korte woorden. De code staat open.",
      2: "Zes woorden en meer letters.",
      3: "De volle code, zonder hulp.",
    },
    symbols: {
      star: "ster",
      heart: "hart",
      moon: "maan",
      key: "sleutel",
      crown: "kroon",
      fish: "vis",
      flower: "bloem",
      boat: "boot",
      gift: "cadeau",
      book: "boek",
      carrot: "wortel",
      bag: "tas",
      bell: "bel",
      anchor: "anker",
      tree: "boom",
      house: "huis",
      cat: "kat",
      rocket: "raket",
    },
    symbolFallback: "symbool",
  },
  {
    themes: { sinterklaas: "Sinterklaas", tuin: "Garden", onderwater: "Under the sea" },
    themeDescriptions: {
      sinterklaas: "Presents, ginger nuts and the boat.",
      tuin: "Flowers, animals and the snail.",
      onderwater: "Fish, coral and the sea.",
    },
    levels: { 1: "Look & write", 2: "Find & write", 3: "Crack the code" },
    levelDescriptions: {
      1: "Four short words. The code is open.",
      2: "Six words and more letters.",
      3: "The full code, without help.",
    },
    symbols: {
      star: "star",
      heart: "heart",
      moon: "moon",
      key: "key",
      crown: "crown",
      fish: "fish",
      flower: "flower",
      boat: "boat",
      gift: "present",
      book: "book",
      carrot: "carrot",
      bag: "bag",
      bell: "bell",
      anchor: "anchor",
      tree: "tree",
      house: "house",
      cat: "cat",
      rocket: "rocket",
    },
    symbolFallback: "symbol",
  },
);

/** De naam van een symbool in de actieve taal, ook voor de schermlezer. */
export function symbolName(symbolId: string): string {
  const t = getTexts(geheimeCodeTexts);
  const names: Readonly<Record<string, string>> = t.symbols;
  return names[symbolId] ?? t.symbolFallback;
}
