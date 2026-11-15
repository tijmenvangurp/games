import type { ComputerLevel, FourInARowMode } from "@entities/four-in-a-row";

/** De instellingen waarmee de lopende partij begon. */
export interface FourInARowMatch {
  readonly mode: FourInARowMode;
  readonly level: ComputerLevel;
}
