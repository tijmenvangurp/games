import type { Texts } from "@shared/i18n";
import { MURDOKU_CASE_SPECS } from "./specs";

/** De woorden van één zaak in één taal: titel, intro en de naam van de buit. */
interface MurdokuCaseText {
  title: string;
  intro: string;
  /** De naam van de buit met lidwoord, bijvoorbeeld "de taart" of "the cake". */
  loot: string;
}

/**
 * De Engelse titels, intro's en buitnamen van de twaalf zaken, op zaak-id.
 *
 * `levels.json` is gegenereerd en `specs.ts` voedt de generator; daarom staat
 * het Engels hier apart. Een test bewaakt dat elke zaak een Engelse tekst heeft.
 */
const MURDOKU_CASE_TEXTS_EN: Readonly<Record<string, MurdokuCaseText>> = {
  "de-verdwenen-taart": {
    title: "The Missing Cake",
    intro:
      "At the birthday party, the cake is suddenly gone. Read the clues and find the thief who was the only one with the loot.",
    loot: "the cake",
  },
  "de-zoekgeraakte-sleutel": {
    title: "The Lost Key",
    intro: "The house key is gone. Read the clues and find the thief.",
    loot: "the house key",
  },
  "de-lege-koektrommel": {
    title: "The Stolen Cookies",
    intro: "The cookies are gone. Read the clues and find the thief.",
    loot: "the cookies",
  },
  "de-gestolen-medaille": {
    title: "The Stolen Medal",
    intro: "The medal from the contest is missing. Place everyone and point out the thief.",
    loot: "the medal",
  },
  "het-verdwenen-schilderij": {
    title: "The Missing Painting",
    intro: "A painting has disappeared. Only one person was with the loot.",
    loot: "the painting",
  },
  "de-vermiste-rugzak": {
    title: "The Missing Backpack",
    intro: "The hiker's backpack is gone. Find the person who was the only one with the loot.",
    loot: "the backpack",
  },
  "de-opengebroken-kluis": {
    title: "The Stolen Money",
    intro: "The money is gone. Read the clues and find the thief.",
    loot: "the money",
  },
  "de-gestolen-fiets": {
    title: "The Stolen Bike",
    intro: "The bike was stolen from outside. Who was the only one with the loot?",
    loot: "the bike",
  },
  "het-zoekgeraakte-dagboek": {
    title: "The Lost Diary",
    intro: "The diary is nowhere to be found. Place all the suspects and find the thief.",
    loot: "the diary",
  },
  "de-verdwenen-honkbal": {
    title: "The Missing Baseball",
    intro: "The team's baseball has disappeared. Who was the only one with the loot?",
    loot: "the baseball",
  },
  "de-gestolen-telescoop": {
    title: "The Stolen Telescope",
    intro: "The telescope is gone. Find out who took it.",
    loot: "the telescope",
  },
  "het-lege-aquarium": {
    title: "The Missing Fish",
    intro: "The fish has vanished from its bowl. Read the clues and find the thief.",
    loot: "the fish",
  },
};

/** De Nederlandse kant komt rechtstreeks uit de specs: één bron voor de generator en de UI. */
const MURDOKU_CASE_TEXTS_NL: Readonly<Record<string, MurdokuCaseText>> = Object.fromEntries(
  MURDOKU_CASE_SPECS.map((spec) => [
    spec.id,
    { title: spec.title, intro: spec.intro, loot: spec.loot.name },
  ]),
);

/** Titel, intro en buitnaam van elke zaak per taal, op zaak-id. */
export const MURDOKU_CASE_TEXTS: Texts<Readonly<Record<string, MurdokuCaseText>>> = {
  nl: MURDOKU_CASE_TEXTS_NL,
  en: MURDOKU_CASE_TEXTS_EN,
};
