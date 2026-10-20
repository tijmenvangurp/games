import type { BoardSize } from "@entities/four-in-a-row";

export interface FourInARowSettings {
  size: BoardSize;
}

export const DEFAULT_SETTINGS: FourInARowSettings = { size: "groot" };
