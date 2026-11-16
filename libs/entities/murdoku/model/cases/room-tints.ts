/**
 * De vaste, gedempte kamertinten van Wie was het?. Zowel de build-time
 * generator als de bordpalette gebruikt deze ene bron, zodat de kleur in de
 * zaken-JSON en op het canvas nooit uit elkaar loopt.
 */
export const MURDOKU_ROOM_TINTS = [
  "#e9dcc2", // zand
  "#cfe0d4", // mint
  "#ecd3d3", // pink
  "#dcd7e8", // lavendel
  "#cfdbe6", // blauwgrijs
  "#d9e2cb", // salie
  "#f0dcc4", // abrikoos
  "#e3d5e6", // lila
] as const;

/** De rustige kamertint voor een kamerindex. */
export function murdokuRoomTint(index: number): string {
  return MURDOKU_ROOM_TINTS[index % MURDOKU_ROOM_TINTS.length];
}
