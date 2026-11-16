export type GearSize = 1 | 2 | 3;

export interface Hole {
  id: string;
  col: number;
  row: number;
}

export interface Motor {
  holeId: string;
  size: GearSize;
  direction: 1 | -1;
}

export type OutputKind = "target" | "generator" | "lift";

export interface Output {
  id: string;
  kind: OutputKind;
  holeId: string;
  size: GearSize;
  direction?: 1 | -1;
  minSpeed?: number;
  maxSpeed?: number;
}

export type LinkKind = "open-belt" | "crossed-belt" | "chain";

export type TrayItem =
  | { id: string; kind: "gear"; size: GearSize }
  | { id: string; kind: "belt"; crossed?: boolean }
  | { id: string; kind: "chain" };

export type Placement =
  | { kind: "gear"; holeId: string; size: GearSize }
  | { kind: "loose-belt"; holeId: string; link: LinkKind }
  | { kind: LinkKind; fromHoleId: string; toHoleId: string };

export interface Level {
  id: string;
  name: string;
  chapter: 1 | 2 | 3 | 4 | 5;
  introduces: string;
  intro: string;
  cols: number;
  rows: number;
  holes: Hole[];
  blockedHoleIds: string[];
  motor: Motor;
  outputs: Output[];
  tray: TrayItem[];
  solution: Placement[];
}

export interface GearPose {
  key: string;
  holeId: string;
  center: { x: number; y: number };
  size: GearSize;
  direction: 1 | -1;
  /** Signed angular speed relative to the motor; the motor is 1. */
  speed: number;
  /** Radians. */
  phase: number;
  layer: "back" | "front";
  driven: boolean;
  jammed: boolean;
}

/** Eén rechte band tussen twee poelies, van velg naar velg. */
export interface BeltRun {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export interface ConnectionPose {
  key: string;
  kind: "open-belt" | "crossed-belt" | "chain";
  fromKey: string;
  toKey: string;
  /** Closed SVG path in board coordinates. Blijft de bron voor de ketting. */
  path: string;
  active: boolean;
  /** Signed oppervlaktesnelheid in board-eenheden per seconde. */
  surfaceSpeed: number;
  /** Twee rechte raaklijnen; de tekenlaag gebruikt `path`. */
  runs: readonly [BeltRun, BeltRun] | null;
  /** Lengte van het gesloten pad in board-eenheden. */
  length: number;
  /** Steek van de ketting op de kleinste sprocket. */
  chainPitch: number;
}

export interface OutputPose {
  id: string;
  kind: OutputKind;
  satisfied: boolean;
  speed: number;
  direction: 1 | -1;
  center: { x: number; y: number };
}

export interface DriveResult {
  gears: GearPose[];
  connections: ConnectionPose[];
  outputs: OutputPose[];
  jammed: boolean;
  solved: boolean;
}
