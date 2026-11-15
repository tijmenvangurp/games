import { PLAYER_COLORS, type PlayerColor, type PlayerId } from "./types";

/** Zo lang mag een eigen spelersnaam zijn; langer past niet op de pionkaart. */
export const MAX_PLAYER_NAME_LENGTH = 12;

/** De vaste kleur per spelersplek, zodat een partij zonder keuze altijd klopt. */
export const DEFAULT_PLAYER_COLORS: Readonly<Record<PlayerId, PlayerColor>> = {
  one: "indigo",
  two: "red",
  three: "teal",
  four: "violet",
};

export function isPlayerColor(value: unknown): value is PlayerColor {
  return typeof value === "string" && (PLAYER_COLORS as readonly string[]).includes(value);
}

/**
 * Maakt een naam geschikt voor het bord: witruimte eraf, inkorten tot de
 * maximale lengte en een lege naam als "geen eigen naam" teruggeven.
 */
export function normalizePlayerName(value: string | undefined): string | undefined {
  const trimmed = value?.trim().slice(0, MAX_PLAYER_NAME_LENGTH) ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}
