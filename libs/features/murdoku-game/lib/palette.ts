/**
 * Canvaskleuren voor het bord. Canvas kan geen CSS-variabelen lezen, dus staan
 * de waarden hier als vaste hex die de tokens uit
 * `apps/games/src/app/styles/index.css` volgen: ivoor papier, inkt voor muren
 * en contouren, primair indigo voor selectie, en de feedbackkleuren voor
 * goed/hint/fout. Geen gradients en geen externe fonts.
 *
 * Alleen de bordrenderer gebruikt dit bestand; de UI leest de CSS-tokens.
 */

import { murdokuRoomTint } from "@entities/murdoku";

/** App-tokens als hex, zodat bord en UI dezelfde kleuren delen. */
const APP_TOKENS = {
  background: "#f7f1e5", // --background (ivoor papier)
  card: "#fdfaf4", // --card
  muted: "#efe8db", // --muted
  border: "#d8cebc", // --border
  foreground: "#2f3a33", // --foreground (inkt)
  primary: "#4f5d9e", // --primary
  success: "#3f7f5f", // --success
  warning: "#b07a36", // --warning
  danger: "#bf4a3a", // --danger
} as const;

/** De rustige kamertint voor een kamerindex (onze eigen levels). */
export function roomTint(index: number): string {
  return murdokuRoomTint(index);
}

export const BOARD = {
  mortar: APP_TOKENS.foreground, // voegen en het vlak achter de tegels
  wall: APP_TOKENS.foreground, // dikke kamermuren
  grid: "rgba(47, 58, 51, 0.18)", // dunne tegelijnen binnen een kamer
  outer: APP_TOKENS.foreground,
  label: "rgba(47, 58, 51, 0.30)", // tekst van het kamernaamplaatje
  cross: "rgba(47, 58, 51, 0.92)", // weggekruist vakje
  crossOutline: APP_TOKENS.card, // lichte rand om het kruis
  markOutline: APP_TOKENS.foreground, // contour achter potloodletters
  markHalo: APP_TOKENS.card, // hairline om die contour
  highlight: "rgba(176, 122, 54, 0.34)", // hintwash
  highlightRing: APP_TOKENS.warning,
  window: "#7fb6cc", // gedempt raamblauw
  press: APP_TOKENS.warning,
  pressScrim: "rgba(176, 122, 54, 0.20)",
  victim: APP_TOKENS.danger,
  grass: "#a9c08a", // grasoever rond een waterkamer
} as const;

/** Herkenbare spelerskleuren; de eerste vier zijn de app-spelerskleuren. */
const SUSPECT_COLORS = [
  "#4f5d9e", // indigo (--player-one)
  "#c05a4a", // rood (--player-two)
  "#2f8b95", // teal (--player-three)
  "#9a6bb5", // paars (--player-four)
  "#b07a36", // amber
  "#3f7f5f", // salie
  "#b8607f", // rose
  "#5b7f9e", // staalblauw
  "#8a6b4f", // koffie
  "#7f8f4f", // olijfgroen
  "#a05a8f", // mauve
  "#6b6b8f", // leisteen
] as const;

export function suspectColor(index: number): string {
  return SUSPECT_COLORS[index % SUSPECT_COLORS.length];
}

/** Kandidaatvakjes bij een gekozen persoon (primair indigo). */
export const CANDIDATE_BLUE = {
  wash: "rgba(79, 93, 158, 0.26)",
  ring: APP_TOKENS.primary,
};
/** Hintwash: amber, de kleur die de app voor hulp reserveert. */
export const MURDOKU_HINT_COLOR = {
  wash: "rgba(176, 122, 54, 0.30)",
  ring: APP_TOKENS.warning,
};
/** Referentiemarkeringen van ontkende aanwijzingen ("hier niet") — foutrood. */
export const REF_RED = { wash: "rgba(191, 74, 58, 0.26)", ring: APP_TOKENS.danger };
/** Kameromtrek binnen de muren van de kamer onder de cursor. */
export const ROOM_HL = APP_TOKENS.primary;
/** Alpha waarnaar een kandidaatmarkering vervaagt als hij niet meer telt. */
export const HIGHLIGHT_DIM = 0.7;
