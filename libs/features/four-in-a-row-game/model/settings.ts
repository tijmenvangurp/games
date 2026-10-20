import type { BoardSize, ComputerLevel, FourInARowMode } from "@entities/four-in-a-row";

export interface FourInARowSettings {
  size: BoardSize;
  mode: FourInARowMode;
  level: ComputerLevel;
}

export const DEFAULT_SETTINGS: FourInARowSettings = {
  size: "groot",
  mode: "friend",
  level: "makkelijk",
};
