import type { TurnEvent, TurnEventKind } from "@entities/ganzenbord";

/**
 * De prenten bij de bijzondere vakjes komen uit het bord zelf. Ze worden
 * dev-time uit `board.webp` gesneden door
 * `scripts/build-ganzenbord-event-art.ts`; zo houden de popup en het bord
 * dezelfde Oud-Hollandse tekenstijl.
 */
const WELL_ART = "/ganzenbord/events/well.webp";
const PRISON_ART = "/ganzenbord/events/prison.webp";

const ART: Partial<Record<TurnEventKind, string>> = {
  goose: "/ganzenbord/events/goose.webp",
  "first-throw": "/ganzenbord/events/goose.webp",
  bridge: "/ganzenbord/events/bridge.webp",
  inn: "/ganzenbord/events/inn.webp",
  well: WELL_ART,
  prison: PRISON_ART,
  maze: "/ganzenbord/events/maze.webp",
  death: "/ganzenbord/events/death.webp",
  win: "/ganzenbord/events/treasure.webp",
};

/** De prent voor deze gebeurtenis, of null als er geen passende prent is. */
export function eventArt(event: TurnEvent): string | null {
  if (event.kind === "free") {
    return event.value === 52 ? PRISON_ART : WELL_ART;
  }
  return ART[event.kind] ?? null;
}
