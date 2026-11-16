import { describe, expect, it } from "vitest";
import {
  allLevels,
  beltTangentRuns,
  canPlace,
  connectionLength,
  drive,
  evaluate,
  gearRadius,
  gearTeeth,
  LEVEL_COUNT,
  levelAt,
  trayLabel,
  validateLevel,
  type ConnectionPose,
  type DriveResult,
  type GearPose,
  type GearSize,
  type Hole,
  type Level,
  type Motor,
  type Output,
  type OutputKind,
  type OutputPose,
  type Placement,
  type TrayItem,
} from "@entities/gear";

function makeHoles(cols: number, rows: number): Hole[] {
  const holes: Hole[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      holes.push({ id: `${col},${row}`, col, row });
    }
  }
  return holes;
}

function makeLevel(config: {
  cols: number;
  rows: number;
  motor: Motor;
  outputs: Output[];
  blockedHoleIds?: string[];
  tray?: TrayItem[];
  solution?: Placement[];
}): Level {
  return {
    id: "test",
    name: "Test",
    chapter: 1,
    introduces: "test",
    intro: "",
    cols: config.cols,
    rows: config.rows,
    holes: makeHoles(config.cols, config.rows),
    blockedHoleIds: config.blockedHoleIds ?? [],
    motor: config.motor,
    outputs: config.outputs,
    tray: config.tray ?? [],
    solution: config.solution ?? [],
  };
}

function gearAt(col: number, row: number, size: GearSize): Placement {
  return { kind: "gear", holeId: `${col},${row}`, size };
}

function linkAt(
  kind: "open-belt" | "crossed-belt" | "chain",
  from: readonly [number, number],
  to: readonly [number, number],
): Placement {
  return {
    kind,
    fromHoleId: `${from[0]},${from[1]}`,
    toHoleId: `${to[0]},${to[1]}`,
  };
}

function gearPose(result: DriveResult, key: string): GearPose {
  const pose = result.gears.find((gear) => gear.key === key);
  if (!pose) {
    throw new Error(`Missing gear pose: ${key}`);
  }
  return pose;
}

function motorAt(col: number, row: number, size: GearSize = 1): Motor {
  return { holeId: `${col},${row}`, size, direction: 1 };
}

function targetAt(col: number, row: number, overrides: Partial<Output> = {}): Output {
  const kind: OutputKind = overrides.kind ?? "target";
  return {
    id: "target-1",
    kind,
    holeId: `${col},${row}`,
    size: 1,
    direction: 1,
    ...overrides,
  };
}

/** A level with one belt or chain from the motor to the output. */
function beltLevel(output: Output): Level {
  return makeLevel({
    cols: 6,
    rows: 5,
    motor: motorAt(0, 2),
    outputs: [output],
    solution: [linkAt("open-belt", [0, 2], [5, 2])],
  });
}

const TAU = Math.PI * 2;
/** Oppervlaktesnelheid van een poelie van maat 1 op de motor (1x). */
const MOTOR_SURFACE_SPEED = (TAU / 6) * gearRadius(1);

interface BoardPoint {
  x: number;
  y: number;
}

function connectionAt(result: DriveResult, index = 0): ConnectionPose {
  const connection = result.connections[index];
  if (!connection) {
    throw new Error(`Missing connection ${index}`);
  }
  return connection;
}

function connectionFrom(result: DriveResult, key: string): ConnectionPose {
  const connection = result.connections.find((candidate) => candidate.fromKey === key);
  if (!connection) {
    throw new Error(`Missing connection from ${key}`);
  }
  return connection;
}

function levelById(id: string): Level {
  const level = allLevels().find((candidate) => candidate.id === id);
  if (!level) {
    throw new Error(`Missing Draaiwerk level: ${id}`);
  }
  return level;
}

function onRim(point: BoardPoint, center: BoardPoint, radius: number): boolean {
  return Math.abs(Math.hypot(point.x - center.x, point.y - center.y) - radius) < 1e-9;
}

/**
 * Meet de lengte van het pad dat `connectionPath` tekent, onafhankelijk van de
 * formule in `connectionLength`. De bogen worden aan hun poeliecentrum gemeten;
 * een boog met samenvallende eindpunten telt niet mee, net als in SVG.
 */
function measurePath(path: string, centers: readonly BoardPoint[]): number {
  const tokens = path.trim().split(/\s+/);
  const firstCenter = centers[0];
  if (!firstCenter) {
    throw new Error("No arc centres to measure against");
  }

  let index = 0;
  let cursor: BoardPoint = { x: 0, y: 0 };
  let start: BoardPoint = { x: 0, y: 0 };
  let total = 0;

  const nextNumber = (): number => {
    const value = Number(tokens[index]);
    index += 1;
    return value;
  };

  while (index < tokens.length) {
    const command = tokens[index];
    index += 1;

    if (command === "M") {
      cursor = { x: nextNumber(), y: nextNumber() };
      start = cursor;
    } else if (command === "L") {
      const next = { x: nextNumber(), y: nextNumber() };
      total += Math.hypot(next.x - cursor.x, next.y - cursor.y);
      cursor = next;
    } else if (command === "A") {
      const radius = nextNumber();
      nextNumber(); // tweede straal, altijd gelijk
      nextNumber(); // rotatie
      nextNumber(); // large-arc
      const sweep = nextNumber();
      const next = { x: nextNumber(), y: nextNumber() };
      if (Math.hypot(next.x - cursor.x, next.y - cursor.y) > 1e-6) {
        let center = firstCenter;
        let closest = Number.POSITIVE_INFINITY;
        for (const candidate of centers) {
          const error = Math.abs(
            Math.hypot(cursor.x - candidate.x, cursor.y - candidate.y) - radius,
          );
          if (error < closest) {
            closest = error;
            center = candidate;
          }
        }
        const startAngle = Math.atan2(cursor.y - center.y, cursor.x - center.x);
        const endAngle = Math.atan2(next.y - center.y, next.x - center.x);
        const forward = (((endAngle - startAngle) % TAU) + TAU) % TAU;
        total += radius * (sweep === 1 ? forward : TAU - forward);
      }
      cursor = next;
    } else if (command === "Z") {
      total += Math.hypot(cursor.x - start.x, cursor.y - start.y);
    } else {
      throw new Error(`Unknown path command: ${command}`);
    }
  }

  return total;
}

describe("gear rules: meshes", () => {
  it("makes a single idler turn the target the motor's way", () => {
    const level = levelAt(0);
    const result = drive(level, level.solution);

    expect(gearPose(result, "motor")).toMatchObject({
      direction: 1,
      speed: 1,
      driven: true,
    });
    expect(gearPose(result, "gear:2,2")).toMatchObject({
      direction: -1,
      speed: -1,
      driven: true,
    });
    expect(gearPose(result, "output:target-1")).toMatchObject({
      direction: 1,
      speed: 1,
      driven: true,
    });
    const target: OutputPose | undefined = result.outputs[0];
    expect(target).toMatchObject({ satisfied: true, speed: 1, direction: 1 });
    expect(result.connections).toEqual([]);
    expect(result.jammed).toBe(false);
    expect(result.solved).toBe(true);
  });

  it("flips direction on every mesh, so two idlers reverse the target", () => {
    const level = levelAt(1);
    const result = drive(level, level.solution);

    expect(gearPose(result, "output:target-1")).toMatchObject({
      direction: -1,
      speed: -1,
    });
    expect(evaluate(level, level.solution)).toBe("solved");
  });

  it("locks tooth phase with the gearTrain formula", () => {
    const result = drive(levelAt(1), levelAt(1).solution);

    expect(gearPose(result, "gear:2,2").phase).toBeCloseTo(Math.PI - Math.PI / 14, 6);
    expect(gearPose(result, "gear:4,2").phase).toBeCloseTo(0, 6);
    expect(gearPose(result, "output:target-1").phase).toBeCloseTo(Math.PI - Math.PI / 14, 6);
  });

  it("scales speed with the tooth ratio between different sizes", () => {
    const level = makeLevel({
      cols: 6,
      rows: 5,
      motor: motorAt(0, 2, 1),
      outputs: [targetAt(5, 2, { size: 2 })],
      solution: [gearAt(2, 2, 1)],
    });
    const result = drive(level, level.solution);

    expect(gearPose(result, "output:target-1").speed).toBeCloseTo(0.5);
    expect(gearPose(result, "output:target-1").direction).toBe(1);
    expect(evaluate(level, level.solution)).toBe("solved");
  });

  it("reverses with the motor direction", () => {
    const level = makeLevel({
      cols: 5,
      rows: 5,
      motor: { holeId: "0,2", size: 1, direction: -1 },
      outputs: [targetAt(4, 2, { direction: -1 })],
      solution: [gearAt(2, 2, 1)],
    });

    expect(evaluate(level, level.solution)).toBe("solved");
    expect(gearPose(drive(level, level.solution), "output:target-1").speed).toBe(-1);
  });
});

describe("gear rules: belts and chains", () => {
  it("drives an open belt and a chain in the same direction at 1x", () => {
    for (const index of [2, 3]) {
      const level = levelAt(index);
      const result = drive(level, level.solution);

      expect(gearPose(result, "output:target-1")).toMatchObject({
        direction: 1,
        speed: 1,
        driven: true,
      });
      expect(result.outputs[0]?.satisfied).toBe(true);
      expect(result.connections).toHaveLength(1);
      const connection: ConnectionPose | undefined = result.connections[0];
      expect(connection).toMatchObject({
        fromKey: "motor",
        toKey: "output:target-1",
        active: true,
      });
      expect(connection?.path.startsWith("M ")).toBe(true);
      expect(connection?.path.endsWith(" Z")).toBe(true);
      expect(connection?.path).toContain(" A ");
      expect(evaluate(level, level.solution)).toBe("solved");
    }
  });

  it("reverses a crossed belt and keeps the pulley ratio", () => {
    const level = beltLevel(targetAt(5, 2, { size: 2, direction: -1 }));
    const crossed = {
      ...level,
      solution: [linkAt("crossed-belt", [0, 2], [5, 2])],
    };
    const result = drive(crossed, crossed.solution);

    expect(gearPose(result, "output:target-1")).toMatchObject({
      direction: -1,
      speed: -0.5,
    });
    expect(result.outputs[0]?.satisfied).toBe(true);
    expect(result.connections[0]?.kind).toBe("crossed-belt");
    expect(result.connections[0]?.path).toContain(" A ");
    expect(evaluate(crossed, crossed.solution)).toBe("solved");
  });

  it("applies the pulley ratio to an open belt", () => {
    const level = beltLevel(targetAt(5, 2, { size: 2 }));
    const result = drive(level, level.solution);

    expect(gearPose(result, "output:target-1").speed).toBeCloseTo(0.5);
    expect(gearPose(result, "output:target-1").direction).toBe(1);
  });
});

describe("gear rules: belt runs and surface speed", () => {
  it("reports the surface speed of the pulley that drives the band", () => {
    const open = drive(levelAt(2), levelAt(2).solution);
    expect(connectionAt(open)).toMatchObject({ kind: "open-belt", active: true });
    expect(connectionAt(open).surfaceSpeed).toBeCloseTo(MOTOR_SURFACE_SPEED, 9);

    const chain = drive(levelAt(3), levelAt(3).solution);
    expect(connectionAt(chain).kind).toBe("chain");
    expect(connectionAt(chain).surfaceSpeed).toBeCloseTo(MOTOR_SURFACE_SPEED, 9);
  });

  it("follows a pulley that runs at double speed", () => {
    const level = makeLevel({
      cols: 9,
      rows: 5,
      motor: motorAt(0, 2, 2),
      outputs: [targetAt(8, 2, { size: 2 })],
      solution: [
        gearAt(4, 2, 1),
        linkAt("open-belt", [0, 2], [4, 2]),
        linkAt("chain", [4, 2], [8, 2]),
      ],
    });
    const result = drive(level, level.solution);

    expect(gearPose(result, "gear:4,2").speed).toBeCloseTo(2);
    const connection = connectionFrom(result, "gear:4,2");
    expect(connection.kind).toBe("chain");
    expect(connection.surfaceSpeed).toBeCloseTo(2 * MOTOR_SURFACE_SPEED, 9);
  });

  it("turns the surface speed negative with the motor", () => {
    const motor: Motor = { holeId: "0,2", size: 1, direction: -1 };
    const level: Level = { ...beltLevel(targetAt(5, 2, { direction: -1 })), motor };
    const result = drive(level, level.solution);

    expect(connectionAt(result).surfaceSpeed).toBeCloseTo(-MOTOR_SURFACE_SPEED, 9);
    expect(connectionAt(result).active).toBe(true);
    expect(result.outputs[0]?.satisfied).toBe(true);
  });

  it("gives an open belt two runs on the rims and a chain none", () => {
    const result = drive(levelAt(2), levelAt(2).solution);
    const connection = connectionAt(result);
    const from = gearPose(result, connection.fromKey);
    const to = gearPose(result, connection.toKey);
    const runs = connection.runs;
    if (!runs) {
      throw new Error("An open belt needs two runs");
    }

    expect(runs).toHaveLength(2);
    for (const run of runs) {
      expect(onRim(run.from, from.center, gearRadius(from.size))).toBe(true);
      expect(onRim(run.to, to.center, gearRadius(to.size))).toBe(true);
    }
    expect(runs[0]).not.toEqual(runs[1]);
    expect(runs).toEqual(
      beltTangentRuns(from.center, gearRadius(from.size), to.center, gearRadius(to.size)),
    );

    const chain = drive(levelAt(3), levelAt(3).solution);
    expect(connectionAt(chain).runs).toBeNull();
  });

  it("crosses the two runs of a crossed belt", () => {
    const level = levelById("gekruist");
    const result = drive(level, level.solution);
    const connection = connectionAt(result);
    const from = gearPose(result, connection.fromKey);
    const to = gearPose(result, connection.toKey);
    const runs = connection.runs;
    if (!runs) {
      throw new Error("A crossed belt needs two runs");
    }

    expect(connection.kind).toBe("crossed-belt");
    for (const run of runs) {
      expect(onRim(run.from, from.center, gearRadius(from.size))).toBe(true);
      expect(onRim(run.to, to.center, gearRadius(to.size))).toBe(true);
    }
    expect(runs[0]).not.toEqual(runs[1]);
    expect(runs).toEqual(
      beltTangentRuns(from.center, gearRadius(from.size), to.center, gearRadius(to.size), 1),
    );
  });

  it("reports the length and chain pitch as derived pose data", () => {
    for (const id of ["de-riem", "gekruist", "de-ketting"]) {
      const level = levelById(id);
      const result = drive(level, level.solution);

      for (const connection of result.connections) {
        const from = gearPose(result, connection.fromKey);
        const to = gearPose(result, connection.toKey);
        const expected = connectionLength(
          connection.kind,
          from.center,
          gearRadius(from.size),
          to.center,
          gearRadius(to.size),
        );

        expect(connection.length).toBeGreaterThan(0);
        expect(connection.length).toBeCloseTo(expected, 9);

        const smallest = from.size <= to.size ? from.size : to.size;
        const pitch = 2 * gearRadius(smallest) * Math.sin(Math.PI / gearTeeth(smallest));
        expect(connection.chainPitch).toBeCloseTo(pitch, 9);
        expect(connection.chainPitch).toBeCloseTo(12.46, 1);
        expect(connection.chainPitch).toBeGreaterThan(0);
      }
    }

    // De kleinste sprocket bepaalt de steek, ook als de motor groter is.
    const mixed = makeLevel({
      cols: 5,
      rows: 5,
      motor: motorAt(0, 2, 2),
      outputs: [targetAt(4, 2)],
      solution: [linkAt("chain", [0, 2], [4, 2])],
    });
    const mixedResult = drive(mixed, mixed.solution);
    expect(connectionAt(mixedResult).chainPitch).toBeCloseTo(2 * 28 * Math.sin(Math.PI / 14), 9);
  });

  it("gives the same length as the drawn connection path", () => {
    for (const id of ["de-riem", "gekruist", "de-ketting"]) {
      const level = levelById(id);
      const result = drive(level, level.solution);
      expect(result.connections.length).toBeGreaterThan(0);

      for (const connection of result.connections) {
        const from = gearPose(result, connection.fromKey);
        const to = gearPose(result, connection.toKey);
        const precise = connectionLength(
          connection.kind,
          from.center,
          gearRadius(from.size),
          to.center,
          gearRadius(to.size),
        );
        const drawn = measurePath(connection.path, [from.center, to.center]);

        expect(drawn).toBeGreaterThan(0);
        expect(Math.abs(precise - drawn) / drawn).toBeLessThan(0.01);
      }
    }
  });
});

describe("gear rules: jams", () => {
  it("jams when a crossed belt disagrees with the mesh chain", () => {
    const level = makeLevel({
      cols: 7,
      rows: 1,
      motor: motorAt(0, 0),
      outputs: [targetAt(6, 0, { direction: -1 })],
      solution: [gearAt(2, 0, 1), gearAt(4, 0, 1), linkAt("crossed-belt", [0, 0], [4, 0])],
    });
    const result = drive(level, level.solution);

    expect(result.jammed).toBe(true);
    expect(gearPose(result, "gear:2,0").jammed).toBe(true);
    expect(gearPose(result, "gear:4,0").jammed).toBe(true);
    expect(result.connections[0]?.active).toBe(false);
    expect(result.solved).toBe(false);
    expect(evaluate(level, level.solution)).toBe("jammed");
  });

  it("jams when two chains disagree", () => {
    const level = makeLevel({
      cols: 6,
      rows: 5,
      motor: motorAt(0, 2),
      outputs: [targetAt(5, 2)],
      solution: [linkAt("open-belt", [0, 2], [5, 2]), linkAt("crossed-belt", [0, 2], [5, 2])],
    });
    const result = drive(level, level.solution);

    expect(result.jammed).toBe(true);
    expect(evaluate(level, level.solution)).toBe("jammed");
  });
});

describe("gear rules: outputs", () => {
  it("leaves a target unsatisfied when it turns the wrong way", () => {
    const level = { ...levelAt(0), outputs: [targetAt(4, 2, { direction: -1 })] };
    const result = drive(level, level.solution);

    expect(result.outputs[0]?.satisfied).toBe(false);
    expect(result.jammed).toBe(false);
    expect(evaluate(level, level.solution)).toBe("playing");
  });

  it("lights a generator only above its minimum speed", () => {
    const belt = beltLevel(targetAt(5, 2, { id: "generator-1", kind: "generator", minSpeed: 1.5 }));
    const halfChain = makeLevel({
      cols: 10,
      rows: 5,
      motor: motorAt(0, 2),
      outputs: [
        targetAt(8, 2, {
          id: "generator-1",
          kind: "generator",
          size: 2,
          minSpeed: 0.4,
        }),
      ],
      solution: [linkAt("open-belt", [0, 2], [8, 2])],
    });
    const thirdChain = makeLevel({
      cols: 10,
      rows: 5,
      motor: motorAt(0, 2),
      outputs: [
        targetAt(8, 2, {
          id: "generator-1",
          kind: "generator",
          size: 3,
          minSpeed: 0.4,
        }),
      ],
      solution: [linkAt("chain", [0, 2], [8, 2])],
    });

    expect(drive(belt, belt.solution).outputs[0]?.satisfied).toBe(false);
    expect(drive(halfChain, halfChain.solution).outputs[0]?.satisfied).toBe(true);
    expect(drive(thirdChain, thirdChain.solution).outputs[0]?.satisfied).toBe(false);
    expect(evaluate(halfChain, halfChain.solution)).toBe("solved");
  });

  it("moves a lift only under its maximum speed", () => {
    const quick = beltLevel(targetAt(5, 2, { id: "lift-1", kind: "lift", maxSpeed: 0.75 }));
    const calm = makeLevel({
      cols: 10,
      rows: 5,
      motor: motorAt(0, 2),
      outputs: [
        targetAt(8, 2, {
          id: "lift-1",
          kind: "lift",
          size: 2,
          maxSpeed: 0.75,
        }),
      ],
      solution: [linkAt("open-belt", [0, 2], [8, 2])],
    });

    expect(drive(quick, quick.solution).outputs[0]?.satisfied).toBe(false);
    expect(drive(calm, calm.solution).outputs[0]?.satisfied).toBe(true);
    expect(evaluate(calm, calm.solution)).toBe("solved");
  });

  it("keeps a target inside a speed band", () => {
    const belt = beltLevel(targetAt(5, 2, { minSpeed: 0.9, maxSpeed: 1.1 }));
    const chain = makeLevel({
      cols: 10,
      rows: 5,
      motor: motorAt(0, 2),
      outputs: [targetAt(8, 2, { size: 2, minSpeed: 0.9, maxSpeed: 1.1 })],
      solution: [linkAt("open-belt", [0, 2], [8, 2])],
    });

    expect(evaluate(belt, belt.solution)).toBe("solved");
    expect(evaluate(chain, chain.solution)).toBe("playing");
  });
});

describe("gear rules: placement", () => {
  it("rejects blocked and occupied holes", () => {
    const level = makeLevel({
      cols: 5,
      rows: 5,
      motor: motorAt(0, 2),
      outputs: [targetAt(4, 2)],
      blockedHoleIds: ["2,2"],
    });

    expect(canPlace(level, [], gearAt(2, 2, 1))).toBe(false);
    expect(canPlace(level, [], gearAt(0, 2, 1))).toBe(false);
    expect(canPlace(level, [], gearAt(4, 2, 1))).toBe(false);
    expect(canPlace(level, [], gearAt(1, 2, 1))).toBe(false);
    expect(canPlace(level, [], gearAt(2, 3, 1))).toBe(true);
  });

  it("rejects an overlapping gear", () => {
    expect(canPlace(levelAt(0), [], gearAt(2, 2, 1))).toBe(true);
    expect(canPlace(levelAt(0), [], gearAt(2, 2, 3))).toBe(false);
    expect(canPlace(levelAt(0), [gearAt(2, 2, 1)], gearAt(2, 3, 1))).toBe(false);
  });

  it("rejects belts without gears, on one hole, or already connected", () => {
    const level = levelAt(2);
    expect(canPlace(level, [], linkAt("open-belt", [1, 2], [2, 2]))).toBe(false);
    expect(canPlace(level, [], linkAt("open-belt", [0, 2], [0, 2]))).toBe(false);
    expect(canPlace(level, [], linkAt("open-belt", [0, 2], [5, 2]))).toBe(true);

    const placed = [linkAt("open-belt", [0, 2], [5, 2])];
    expect(canPlace(level, placed, linkAt("chain", [5, 2], [0, 2]))).toBe(false);
  });

  it("rejects a belt when one wheel contains the other", () => {
    const level = makeLevel({
      cols: 3,
      rows: 5,
      motor: motorAt(0, 2, 2),
      outputs: [targetAt(1, 2, { size: 1 })],
    });
    expect(canPlace(level, [], linkAt("open-belt", [0, 2], [1, 2]))).toBe(false);
  });
});

describe("gear rules: levels", () => {
  it("validates chapter 1 and solves every level", () => {
    expect(LEVEL_COUNT).toBe(allLevels().length);
    expect(LEVEL_COUNT).toBeGreaterThanOrEqual(4);

    for (let index = 0; index < 4; index += 1) {
      const level = levelAt(index);
      expect(validateLevel(level)).toEqual([]);
      expect(evaluate(level, level.solution)).toBe("solved");
    }
  });

  it("throws for an unknown level index", () => {
    expect(() => levelAt(LEVEL_COUNT)).toThrow("Unknown Draaiwerk level");
  });

  it("labels the tray in Dutch", () => {
    expect(trayLabel(levelAt(0).tray[0] as TrayItem)).toBe("Klein tandwiel");
    expect(trayLabel(levelAt(2).tray[0] as TrayItem)).toBe("Ketting");
    expect(trayLabel(levelAt(3).tray[0] as TrayItem)).toBe("Ketting");
    expect(trayLabel({ id: "belt", kind: "belt", crossed: true })).toBe("Gekruiste ketting");
    expect(trayLabel({ id: "gear", kind: "gear", size: 3 })).toBe("Groot tandwiel");
  });
});

describe("gear rules: level validation", () => {
  const blank = levelAt(0);

  function expectError(level: Level, fragment: string): void {
    const errors = validateLevel(level);
    expect(errors.some((error) => error.includes(fragment))).toBe(true);
  }

  it("accepts a solved crossed-belt level", () => {
    const level = makeLevel({
      cols: 6,
      rows: 5,
      motor: motorAt(0, 2),
      outputs: [targetAt(5, 2, { direction: -1 })],
      tray: [{ id: "belt", kind: "belt", crossed: true }],
      solution: [linkAt("crossed-belt", [0, 2], [5, 2])],
    });
    expect(validateLevel(level)).toEqual([]);
  });

  it("reports malformed holes", () => {
    expectError(
      { ...blank, holes: [...blank.holes, { id: "0,0", col: 0, row: 0 }] },
      "Duplicate hole id",
    );
    expectError(
      { ...blank, holes: [...blank.holes, { id: "9,9", col: 9, row: 9 }] },
      "outside the board",
    );
    expectError(
      { ...blank, holes: [...blank.holes, { id: "half", col: 1.5, row: 0 }] },
      "not on the grid",
    );
  });

  it("reports duplicate outputs and outputs outside the holes", () => {
    expectError({ ...blank, outputs: [...blank.outputs, targetAt(4, 2)] }, "Duplicate output id");
    expectError({ ...blank, outputs: [targetAt(9, 9)] }, "not on a hole");
  });

  it("reports duplicate tray ids and missing tray parts", () => {
    expectError(
      {
        ...blank,
        tray: [...blank.tray, { id: "tandwiel-1", kind: "gear", size: 1 }],
      },
      "Duplicate tray id",
    );
    expectError({ ...blank, tray: [] }, "Tray does not contain");
    expectError(
      { ...levelAt(1), tray: [{ id: "one", kind: "gear", size: 1 }] },
      "Tray does not contain",
    );
  });

  it("reports blocked holes that collide with fixed parts", () => {
    expectError({ ...blank, blockedHoleIds: ["0,2"] }, "Motor stands on a blocked hole");
    expectError({ ...blank, blockedHoleIds: ["4,2"] }, "stands on a blocked hole");
    expectError({ ...blank, blockedHoleIds: ["9,9"] }, "Blocked hole does not exist");
    expectError({ ...blank, blockedHoleIds: ["2,2", "2,2"] }, "Duplicate blocked hole");
  });

  it("reports a motor outside the holes", () => {
    expectError(
      { ...blank, motor: { holeId: "9,9", size: 1, direction: 1 } },
      "Motor is not on a hole",
    );
  });

  it("reports overlapping and unplaceable solution parts", () => {
    expectError({ ...blank, solution: [gearAt(1, 2, 1)] }, "Gears overlap");
    expectError({ ...blank, solution: [gearAt(1, 2, 1)] }, "cannot be placed");
  });

  it("reports a connection without gears", () => {
    const level = makeLevel({
      cols: 6,
      rows: 5,
      motor: motorAt(0, 2),
      outputs: [targetAt(5, 2)],
      solution: [linkAt("open-belt", [1, 2], [2, 2])],
    });
    expectError(level, "has no gear on both ends");
    expectError(level, "cannot be placed");
  });

  it("reports a connection with no room between the wheels", () => {
    const level = makeLevel({
      cols: 3,
      rows: 5,
      motor: motorAt(0, 2, 2),
      outputs: [targetAt(1, 2, { size: 1 })],
      solution: [linkAt("chain", [0, 2], [1, 2])],
    });
    expectError(level, "no room between the wheels");
  });

  it("reports a solution that does not satisfy the outputs", () => {
    expectError({ ...blank, outputs: [targetAt(4, 2, { direction: -1 })] }, "does not solve");
  });

  it("treats an unconnected output as unsatisfied", () => {
    const result = drive(blank, []);
    expect(result.outputs[0]?.satisfied).toBe(false);
    expect(result.solved).toBe(false);
  });
});

describe("gear rules: placement edge cases", () => {
  it("rejects a gear outside the holes", () => {
    expect(canPlace(levelAt(0), [], gearAt(9, 9, 1))).toBe(false);
  });

  it("ignores unrelated placements when looking for an existing connection", () => {
    expect(canPlace(levelAt(2), [gearAt(2, 2, 1)], linkAt("open-belt", [0, 2], [5, 2]))).toBe(true);
  });
});
