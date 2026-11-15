import type { GenDifficulty } from "../engine/generator/Generator";

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
  /** Aantal verdachten; het slachtoffer komt daar nog bij. */
  suspects: number;
  /** Vaste seed: dezelfde seed geeft altijd dezelfde zaak. */
  seed: number;
  themeId: string;
  difficulty: GenDifficulty;
  /** Naam van het slachtoffer, passend bij het geslacht dat de generator koos. */
  victimName: { female: string; male: string };
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
      "Op de verjaardag is de taart ineens weg. Zoek uit wie er als enige bij het slachtoffer was.",
    width: 4,
    height: 4,
    suspects: 3,
    seed: 4101,
    themeId: "apartment",
    difficulty: "easy",
    victimName: { female: "Vera", male: "Viktor" },
  },
  {
    id: "de-zoekgeraakte-sleutel",
    title: "De zoekgeraakte sleutel",
    intro: "De huissleutel is van de tafel verdwenen. Lees de aanwijzingen en vind de dief.",
    width: 4,
    height: 4,
    suspects: 3,
    seed: 4102,
    themeId: "apartment",
    difficulty: "easy",
    victimName: { female: "Nina", male: "Vince" },
  },
  {
    id: "de-lege-koektrommel",
    title: "De lege koektrommel",
    intro:
      "Iemand heeft alle koekjes uit de trommel gegeten. Wie was er als enige bij het slachtoffer?",
    width: 4,
    height: 4,
    suspects: 3,
    seed: 4201,
    themeId: "mansion",
    difficulty: "medium",
    victimName: { female: "Sofie", male: "Sam" },
  },
  {
    id: "de-gestolen-medaille",
    title: "De gestolen medaille",
    intro: "De medaille van de wedstrijd is zoek. Plaats iedereen en wijs de dader aan.",
    width: 4,
    height: 4,
    suspects: 3,
    seed: 4202,
    themeId: "mansion",
    difficulty: "medium",
    victimName: { female: "Lina", male: "Robin" },
  },
  {
    id: "het-verdwenen-schilderij",
    title: "Het verdwenen schilderij",
    intro:
      "Uit de galerij is een schilderij verdwenen. Alleen één persoon was bij het slachtoffer.",
    width: 5,
    height: 5,
    suspects: 4,
    seed: 5101,
    themeId: "mansion",
    difficulty: "easy",
    victimName: { female: "Roos", male: "Victor" },
  },
  {
    id: "de-vermiste-rugzak",
    title: "De vermiste rugzak",
    intro:
      "De rugzak van de wandelaar is weg. Zoek de persoon die als enige bij het slachtoffer stond.",
    width: 5,
    height: 5,
    suspects: 4,
    seed: 5201,
    themeId: "apartment",
    difficulty: "medium",
    victimName: { female: "Eva", male: "Otto" },
  },
  {
    id: "de-opengebroken-kluis",
    title: "De opengebroken kluis",
    intro: "De kluis is open en het geld is weg. Lees de aanwijzingen en vind de dader.",
    width: 5,
    height: 5,
    suspects: 4,
    seed: 5202,
    themeId: "mansion",
    difficulty: "medium",
    victimName: { female: "Mila", male: "Vito" },
  },
  {
    id: "de-gestolen-fiets",
    title: "De gestolen fiets",
    intro: "Buiten is de fiets gestolen. Wie stond er als enige bij het slachtoffer?",
    width: 5,
    height: 5,
    suspects: 4,
    seed: 5301,
    themeId: "apartment",
    difficulty: "hard",
    victimName: { female: "Tess", male: "Viggo" },
  },
  {
    id: "het-zoekgeraakte-dagboek",
    title: "Het zoekgeraakte dagboek",
    intro: "Het dagboek is nergens meer te vinden. Plaats alle verdachten en zoek de dief.",
    width: 6,
    height: 6,
    suspects: 5,
    seed: 6201,
    themeId: "mansion",
    difficulty: "medium",
    victimName: { female: "Noor", male: "Valentijn" },
  },
  {
    id: "de-verdwenen-honkbal",
    title: "De verdwenen honkbal",
    intro: "De honkbal van het team is verdwenen. Wie was er als enige bij het slachtoffer?",
    width: 6,
    height: 6,
    suspects: 5,
    seed: 6202,
    themeId: "apartment",
    difficulty: "medium",
    victimName: { female: "Yara", male: "Vince" },
  },
  {
    id: "de-gestolen-telescoop",
    title: "De gestolen telescoop",
    intro: "De telescoop is uit het observatorium weg. Zoek uit wie hem heeft meegenomen.",
    width: 6,
    height: 6,
    suspects: 5,
    seed: 6301,
    themeId: "mansion",
    difficulty: "hard",
    victimName: { female: "Vera", male: "Viktor" },
  },
  {
    id: "het-lege-aquarium",
    title: "Het lege aquarium",
    intro: "Het aquarium staat leeg: de vis is weg. Lees de aanwijzingen en vind de dader.",
    width: 6,
    height: 6,
    suspects: 5,
    seed: 6302,
    themeId: "apartment",
    difficulty: "hard",
    victimName: { female: "Sofie", male: "Victor" },
  },
];

/** De zaak waarmee de speelpagina opent als er nog niets gekozen is. */
export const MURDOKU_DEFAULT_CASE_ID = MURDOKU_CASE_SPECS[0].id;
