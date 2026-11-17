import type { GenDifficulty } from "../engine/generator/Generator";
import type { MurdokuLoot } from "./types";

/**
 * De vaste beschrijving van één eigen zaak. Het build-script
 * (`scripts/generate-murdoku-levels.ts`) maakt hiermee het bord en de
 * oplossing; titel en intro zijn met de hand geschreven en horen bij de zaak.
 *
 * De kamers, namen en objecten zijn Nederlands. De generator levert alleen de
 * vorm van het bord en de aanwijzingen als keys en parameters.
 */
export interface MurdokuCaseSpec {
  /** Leesbare id; komt ook in de level-JSON en in de URL van de zaakkeuze. */
  id: string;
  title: string;
  intro: string;
  width: number;
  height: number;
  /** Aantal verdachten; de buit komt daar nog bij. */
  suspects: number;
  /** Vaste seed: dezelfde seed geeft altijd dezelfde zaak. */
  seed: number;
  themeId: string;
  difficulty: GenDifficulty;
  /** De gestolen buit; de generatornaam van de interne victim wordt overschreven. */
  loot: MurdokuLoot;
}

/**
 * Twaalf zaken, van 4×4 naar 6×6. De seeds zijn met de hand gekozen op een
 * leesbaar bord (minstens drie kamers) en zijn nooit de boekzaken van Murdoku.
 */
export const MURDOKU_CASE_SPECS: readonly MurdokuCaseSpec[] = [
  {
    id: "de-verdwenen-taart",
    title: "De verdwenen taart",
    intro:
      "Op de verjaardag is de taart ineens weg. Lees de aanwijzingen en vind de dief die als enige bij de buit was.",
    width: 4,
    height: 4,
    suspects: 3,
    seed: 4103,
    themeId: "apartment",
    difficulty: "easy",
    loot: { name: "de taart", icon: "cake" },
  },
  {
    id: "de-zoekgeraakte-sleutel",
    title: "De zoekgeraakte sleutel",
    intro: "De huissleutel is weg. Lees de aanwijzingen en vind de dief.",
    width: 4,
    height: 4,
    suspects: 3,
    seed: 4103,
    themeId: "apartment",
    difficulty: "easy",
    loot: { name: "de huissleutel", icon: "key" },
  },
  {
    id: "de-lege-koektrommel",
    title: "De gestolen koekjes",
    intro: "De koekjes zijn weg. Lees de aanwijzingen en vind de dief.",
    width: 4,
    height: 4,
    suspects: 3,
    seed: 4202,
    themeId: "mansion",
    difficulty: "medium",
    loot: { name: "de koekjes", icon: "cookie" },
  },
  {
    id: "de-gestolen-medaille",
    title: "De gestolen medaille",
    intro: "De medaille van de wedstrijd is zoek. Plaats iedereen en wijs de dief aan.",
    width: 4,
    height: 4,
    suspects: 3,
    seed: 4202,
    themeId: "mansion",
    difficulty: "medium",
    loot: { name: "de medaille", icon: "star" },
  },
  {
    id: "het-verdwenen-schilderij",
    title: "Het verdwenen schilderij",
    intro: "Er is een schilderij verdwenen. Alleen één persoon was bij de buit.",
    width: 5,
    height: 5,
    suspects: 4,
    seed: 5101,
    themeId: "mansion",
    difficulty: "easy",
    loot: { name: "het schilderij", icon: "painting" },
  },
  {
    id: "de-vermiste-rugzak",
    title: "De vermiste rugzak",
    intro: "De rugzak van de wandelaar is weg. Zoek de persoon die als enige bij de buit stond.",
    width: 5,
    height: 5,
    suspects: 4,
    seed: 5211,
    themeId: "apartment",
    difficulty: "medium",
    loot: { name: "de rugzak", icon: "school" },
  },
  {
    id: "de-opengebroken-kluis",
    title: "Het gestolen geld",
    intro: "Het geld is weg. Lees de aanwijzingen en vind de dief.",
    width: 5,
    height: 5,
    suspects: 4,
    seed: 5204,
    themeId: "mansion",
    difficulty: "medium",
    loot: { name: "het geld", icon: "gold" },
  },
  {
    id: "de-gestolen-fiets",
    title: "De gestolen fiets",
    intro: "Buiten is de fiets gestolen. Wie stond er als enige bij de buit?",
    width: 5,
    height: 5,
    suspects: 4,
    seed: 6704,
    themeId: "apartment",
    difficulty: "hard",
    loot: { name: "de fiets", icon: "bicycle" },
  },
  {
    id: "het-zoekgeraakte-dagboek",
    title: "Het zoekgeraakte dagboek",
    intro: "Het dagboek is nergens meer te vinden. Plaats alle verdachten en zoek de dief.",
    width: 6,
    height: 6,
    suspects: 5,
    seed: 6218,
    themeId: "mansion",
    difficulty: "medium",
    loot: { name: "het dagboek", icon: "book" },
  },
  {
    id: "de-verdwenen-honkbal",
    title: "De verdwenen honkbal",
    intro: "De honkbal van het team is verdwenen. Wie was er als enige bij de buit?",
    width: 6,
    height: 6,
    suspects: 5,
    seed: 6280,
    themeId: "apartment",
    difficulty: "medium",
    loot: { name: "de honkbal", icon: "star" },
  },
  {
    id: "de-gestolen-telescoop",
    title: "De gestolen telescoop",
    intro: "De telescoop is weg. Zoek uit wie hem heeft meegenomen.",
    width: 6,
    height: 6,
    suspects: 5,
    seed: 6418,
    themeId: "mansion",
    difficulty: "medium",
    loot: { name: "de telescoop", icon: "telescope" },
  },
  {
    id: "het-lege-aquarium",
    title: "De verdwenen vis",
    intro: "De vis is uit zijn kom verdwenen. Lees de aanwijzingen en vind de dief.",
    width: 6,
    height: 6,
    suspects: 5,
    seed: 6793,
    themeId: "apartment",
    difficulty: "hard",
    loot: { name: "de vis", icon: "fish" },
  },
];

/** De zaak waarmee de speelpagina opent als er nog niets gekozen is. */
export const MURDOKU_DEFAULT_CASE_ID = MURDOKU_CASE_SPECS[0].id;
