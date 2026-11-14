import { describe, expect, it } from "vitest";
import {
  allLevels,
  canPlace,
  drive,
  evaluate,
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

function asAt(
  from: readonly [number, number],
  to: readonly [number, number],
  sizeA: GearSize,
  sizeB: GearSize,
): Placement {
  return {
    kind: "lying-as",
    holeA: `${from[0]},${from[1]}`,
    holeB: `${to[0]},${to[1]}`,
    sizeA,
    sizeB,
  };
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

describe("gear rules: lying axle", () => {
  const slow = makeLevel({
    cols: 10,
    rows: 5,
    motor: motorAt(0, 2),
    outputs: [targetAt(9, 2)],
    solution: [asAt([3, 2], [7, 2], 2, 1)],
  });

  const fast = makeLevel({
    cols: 10,
    rows: 5,
    motor: motorAt(0, 2),
    outputs: [targetAt(9, 2)],
    solution: [asAt([2, 2], [6, 2], 1, 2)],
  });

  it("keeps both ends on the same speed and direction", () => {
    const result = drive(slow, slow.solution);

    expect(gearPose(result, "as:3,2")).toMatchObject({
      direction: -1,
      speed: -0.5,
      driven: true,
    });
    expect(gearPose(result, "as:7,2")).toMatchObject({
      direction: -1,
      speed: -0.5,
      driven: true,
    });
    expect(gearPose(result, "output:target-1").speed).toBeCloseTo(0.5);
    expect(gearPose(result, "output:target-1").direction).toBe(1);
    expect(evaluate(slow, slow.solution)).toBe("solved");
  });

  it("turns a big output twice as fast", () => {
    const result = drive(fast, fast.solution);

    expect(gearPose(result, "output:target-1").speed).toBeCloseTo(2);
    expect(gearPose(result, "output:target-1").direction).toBe(1);
    expect(evaluate(fast, fast.solution)).toBe("solved");
  });

  it("requires a visible gap between the two wheels", () => {
    expect(canPlace(slow, [], asAt([3, 2], [4, 2], 2, 1))).toBe(false);
    expect(canPlace(slow, [], asAt([3, 2], [6, 2], 2, 1))).toBe(false);
    expect(canPlace(slow, [], asAt([3, 2], [7, 2], 2, 1))).toBe(true);
  });

  it("occupies both holes and does not mesh with its own other end", () => {
    const result = drive(slow, slow.solution);
    expect(result.gears.filter((gear) => gear.key.startsWith("as:"))).toHaveLength(2);
    expect(canPlace(slow, slow.solution, gearAt(3, 2, 1))).toBe(false);
    expect(canPlace(slow, slow.solution, asAt([3, 2], [9, 2], 2, 1))).toBe(false);
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

  it("jams when a lying axle disagrees with a mesh path", () => {
    const level = makeLevel({
      cols: 11,
      rows: 1,
      motor: motorAt(0, 0),
      outputs: [targetAt(10, 0)],
      solution: [asAt([2, 0], [7, 0], 1, 2), gearAt(4, 0, 1)],
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
    const slow = beltLevel(targetAt(5, 2, { id: "generator-1", kind: "generator", minSpeed: 1.5 }));
    const fast = makeLevel({
      cols: 10,
      rows: 5,
      motor: motorAt(0, 2),
      outputs: [targetAt(9, 2, { id: "generator-1", kind: "generator", minSpeed: 1.5 })],
      solution: [asAt([2, 2], [6, 2], 1, 2)],
    });

    expect(drive(slow, slow.solution).outputs[0]?.satisfied).toBe(false);
    expect(drive(fast, fast.solution).outputs[0]?.satisfied).toBe(true);
    expect(evaluate(fast, fast.solution)).toBe("solved");
  });

  it("moves a lift only under its maximum speed", () => {
    const quick = beltLevel(targetAt(5, 2, { id: "lift-1", kind: "lift", maxSpeed: 0.75 }));
    const calm = makeLevel({
      cols: 10,
      rows: 5,
      motor: motorAt(0, 2),
      outputs: [targetAt(9, 2, { id: "lift-1", kind: "lift", maxSpeed: 0.75 })],
      solution: [asAt([3, 2], [7, 2], 2, 1)],
    });

    expect(drive(quick, quick.solution).outputs[0]?.satisfied).toBe(false);
    expect(drive(calm, calm.solution).outputs[0]?.satisfied).toBe(true);
    expect(evaluate(calm, calm.solution)).toBe("solved");
  });

  it("keeps a target inside a speed band", () => {
    const belt = beltLevel(targetAt(5, 2, { minSpeed: 0.9, maxSpeed: 1.1 }));
    const axle = makeLevel({
      cols: 10,
      rows: 5,
      motor: motorAt(0, 2),
      outputs: [targetAt(9, 2, { minSpeed: 0.9, maxSpeed: 1.1 })],
      solution: [asAt([3, 2], [7, 2], 2, 1)],
    });

    expect(evaluate(belt, belt.solution)).toBe("solved");
    expect(evaluate(axle, axle.solution)).toBe("playing");
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
    expect(trayLabel(levelAt(2).tray[0] as TrayItem)).toBe("Open riem");
    expect(trayLabel(levelAt(3).tray[0] as TrayItem)).toBe("Ketting");
    expect(trayLabel({ id: "as", kind: "lying-as", sizeA: 2, sizeB: 1 })).toBe(
      "Liggende as: middelgroot + klein",
    );
    expect(trayLabel({ id: "belt", kind: "belt", crossed: true })).toBe("Gekruiste riem");
    expect(trayLabel({ id: "gear", kind: "gear", size: 3 })).toBe("Groot tandwiel");
  });
});

describe("gear rules: level validation", () => {
  const blank = levelAt(0);

  function expectError(level: Level, fragment: string): void {
    const errors = validateLevel(level);
    expect(errors.some((error) => error.includes(fragment))).toBe(true);
  }

  function axleLevel(trayA: GearSize, trayB: GearSize): Level {
    return makeLevel({
      cols: 10,
      rows: 5,
      motor: motorAt(0, 2),
      outputs: [targetAt(9, 2)],
      tray: [{ id: "as", kind: "lying-as", sizeA: trayA, sizeB: trayB }],
      solution: [asAt([3, 2], [7, 2], 2, 1)],
    });
  }

  it("accepts a solved lying-axle level in either tray orientation", () => {
    expect(validateLevel(axleLevel(2, 1))).toEqual([]);
    expect(validateLevel(axleLevel(1, 2))).toEqual([]);
  });

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

  it("reports a lying axle that touches itself", () => {
    const level = makeLevel({
      cols: 10,
      rows: 5,
      motor: motorAt(0, 2),
      outputs: [targetAt(9, 2)],
      tray: [{ id: "as", kind: "lying-as", sizeA: 2, sizeB: 1 }],
      solution: [asAt([3, 2], [4, 2], 2, 1)],
    });
    expectError(level, "touches itself");
    expectError(level, "cannot be placed");
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
  it("checks lying-axle holes, neighbours, and the board", () => {
    const level = makeLevel({
      cols: 10,
      rows: 5,
      motor: motorAt(0, 2),
      outputs: [targetAt(9, 2)],
    });

    expect(canPlace(level, [], asAt([3, 2], [3, 2], 2, 1))).toBe(false);
    expect(canPlace(level, [], asAt([0, 2], [6, 2], 2, 1))).toBe(false);
    expect(canPlace(level, [gearAt(4, 2, 1)], asAt([3, 2], [7, 2], 2, 1))).toBe(false);
    expect(canPlace(level, [], asAt([9, 9], [7, 2], 2, 1))).toBe(false);
    expect(canPlace(level, [], gearAt(9, 9, 1))).toBe(false);

    const blocked = makeLevel({
      cols: 10,
      rows: 5,
      motor: motorAt(0, 2),
      outputs: [targetAt(9, 2)],
      blockedHoleIds: ["3,2"],
    });
    expect(canPlace(blocked, [], asAt([3, 2], [7, 2], 2, 1))).toBe(false);
  });

  it("ignores unrelated placements when looking for an existing connection", () => {
    expect(canPlace(levelAt(2), [gearAt(2, 2, 1)], linkAt("open-belt", [0, 2], [5, 2]))).toBe(true);
  });
});
