import type { FrenchItem } from "./types";

/**
 * Audio lives next to the app, so playback never leaves the origin and the
 * strict CSP keeps working. The generator writes exactly this path.
 */
export function frenchAudioSrc(item: Pick<FrenchItem, "id">): string {
  return `/audio/fr/${item.id}.mp3`;
}
