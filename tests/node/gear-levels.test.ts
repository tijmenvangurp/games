import { describe, expect, it } from "vitest";
import {
  allLevels,
  canPlace,
  drive,
  evaluate,
  LEVEL_COUNT,
  levelAt,
  trayItemMatches,
  validateLevel,
  type GearSize,
  type Level,
  type OutputPose,
  type Placement,
} from "@entities/gear";

function hole(col: number, row: number): string {
  return `${col},${row}`;
}

function gear(col: number, row: number, size: GearSize): Placement {
  return { kind: "gear", holeId: hole(col, row), size };
}

function link(
  kind: "open-belt" | "crossed-belt" | "chain",
  from: readonly [number, number],
  to: readonly [number, number],
): Placement {
  return {
    kind,
    fromHoleId: hole(from[0], from[1]),
    toHoleId: hole(to[0], to[1]),
  };
}

function axle(from: readonly [number, number], to: readonly [number, number]): Placement {
  return { kind: "axle", fromHoleId: hole(from[0], from[1]), toHoleId: hole(to[0], to[1]) };
}

type GearPlacement = Extract<Placement, { kind: "gear" }>;
type LinkPlacement = Extract<Placement, { kind: "open-belt" | "crossed-belt" | "chain" }>;
type AxlePlacement = Extract<Placement, { kind: "axle" }>;
type ConnectionPlacement = LinkPlacement | AxlePlacement;

function outputAt(level: Level, index = 0): OutputPose {
  const output = drive(level, level.solution).outputs[index];
  if (!output) {
    throw new Error(`Level ${level.id} has no output at index ${index}`);
  }
  return output;
}

function coversTray(level: Level, placements: readonly Placement[]): boolean {
  const remaining = [...level.tray];
  for (const placement of placements) {
    const index = remaining.findIndex((item) => trayItemMatches(item, placement));
    if (index < 0) {
      return false;
    }
    remaining.splice(index, 1);
  }
  return true;
}

function linkKinds(level: Level): LinkPlacement["kind"][] {
  const kinds = new Set<LinkPlacement["kind"]>();
  for (const item of level.tray) {
    if (item.kind === "chain") {
      kinds.add("chain");
    } else if (item.kind === "belt") {
      kinds.add(item.crossed === true ? "crossed-belt" : "open-belt");
    }
  }
  return [...kinds];
}

function gearCandidates(level: Level): GearPlacement[] {
  const sizes = new Set<GearSize>();
  for (const item of level.tray) {
    if (item.kind === "gear") {
      sizes.add(item.size);
    }
  }
  const candidates: GearPlacement[] = [];
  for (const size of sizes) {
    for (const hole of level.holes) {
      candidates.push({ kind: "gear", holeId: hole.id, size });
    }
  }
  return candidates;
}

function solvedBy(level: Level, placements: Placement[]): boolean {
  return coversTray(level, placements) && evaluate(level, placements) === "solved";
}

function linkBetween(kind: LinkPlacement["kind"], from: string, to: string): LinkPlacement {
  return { kind, fromHoleId: from, toHoleId: to };
}

function hasAxle(level: Level): boolean {
  return level.tray.some((item) => item.kind === "axle");
}

function connectionKinds(level: Level): ConnectionPlacement["kind"][] {
  return hasAxle(level) ? [...linkKinds(level), "axle"] : linkKinds(level);
}

function connectionBetween(
  kind: ConnectionPlacement["kind"],
  from: string,
  to: string,
): ConnectionPlacement {
  return kind === "axle"
    ? { kind: "axle", fromHoleId: from, toHoleId: to }
    : linkBetween(kind, from, to);
}

function fixedHoles(level: Level): string[] {
  return [level.motor.holeId, ...level.outputs.map((output) => output.holeId)];
}

function singlePlacementSolves(
  level: Level,
  gears: readonly GearPlacement[],
  kinds: readonly ConnectionPlacement["kind"][],
): boolean {
  for (const gear of gears) {
    if (canPlace(level, [], gear) && solvedBy(level, [gear])) {
      return true;
    }
  }
  const holes = fixedHoles(level);
  for (const kind of kinds) {
    for (let first = 0; first < holes.length; first += 1) {
      for (let second = first + 1; second < holes.length; second += 1) {
        const connection = connectionBetween(kind, holes[first] as string, holes[second] as string);
        if (canPlace(level, [], connection) && solvedBy(level, [connection])) {
          return true;
        }
      }
    }
  }
  return false;
}

function twoGearsSolve(level: Level, gears: readonly GearPlacement[]): boolean {
  for (let first = 0; first < gears.length; first += 1) {
    const a = gears[first] as GearPlacement;
    for (let second = first + 1; second < gears.length; second += 1) {
      const b = gears[second] as GearPlacement;
      if (coversTray(level, [a, b]) && canPlace(level, [a], b) && solvedBy(level, [a, b])) {
        return true;
      }
    }
  }
  return false;
}

function gearPlusConnectionSolves(
  level: Level,
  gears: readonly GearPlacement[],
  kinds: readonly ConnectionPlacement["kind"][],
): boolean {
  for (const gear of gears) {
    if (!canPlace(level, [], gear)) {
      continue;
    }
    const ends: [string, string][] = [
      [level.motor.holeId, gear.holeId],
      ...level.outputs.map((output): [string, string] => [gear.holeId, output.holeId]),
    ];
    for (const kind of kinds) {
      for (const [from, to] of ends) {
        const connection = connectionBetween(kind, from, to);
        if (
          coversTray(level, [gear, connection]) &&
          canPlace(level, [gear], connection) &&
          solvedBy(level, [gear, connection])
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

function twoConnectionsSolve(level: Level, kinds: readonly ConnectionPlacement["kind"][]): boolean {
  const holes = fixedHoles(level);
  const connections: ConnectionPlacement[] = [];
  for (const kind of kinds) {
    for (let first = 0; first < holes.length; first += 1) {
      for (let second = first + 1; second < holes.length; second += 1) {
        connections.push(connectionBetween(kind, holes[first] as string, holes[second] as string));
      }
    }
  }
  for (let first = 0; first < connections.length; first += 1) {
    const a = connections[first] as ConnectionPlacement;
    for (let second = first + 1; second < connections.length; second += 1) {
      const b = connections[second] as ConnectionPlacement;
      if (coversTray(level, [a, b]) && canPlace(level, [a], b) && solvedBy(level, [a, b])) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Proves that a level cannot be solved with one or two placements: every
 * topology with at most two parts is tried, from the tray that the level
 * offers. Three outputs already need three edges, and a gear plus one link can
 * only attach to the motor, an output or the gear itself.
 */
function hasSolutionWithin(level: Level, limit: 1 | 2): boolean {
  if (evaluate(level, []) === "solved") {
    return true;
  }

  const gears = gearCandidates(level);
  const kinds = connectionKinds(level);
  if (singlePlacementSolves(level, gears, kinds)) {
    return true;
  }
  if (limit === 1) {
    return false;
  }
  return (
    twoGearsSolve(level, gears) ||
    gearPlusConnectionSolves(level, gears, kinds) ||
    twoConnectionsSolve(level, kinds)
  );
}

const LEVEL_IDS = [
  "eerste-tand",
  "twee-tussenwielen",
  "de-riem",
  "de-ketting",
  "gekruist",
  "de-omweg",
  "precies-genoeg",
  "andersom",
  "groot-en-klein",
  "de-meter",
  "de-riemvertraging",
  "twee-maten",
  "lamp-aan",
  "de-lift",
  "twee-kanten-op",
  "snel-en-langzaam",
  "twee-kettingen",
  "ketting-naar-tandwiel",
  "de-hijskraan",
  "de-verdeelbox",
  "tegenrichting",
  "de-keerkoppeling",
  "de-wenteltrap",
  "de-drievoudige",
  "de-productielijn",
  "de-lange-trap",
  "de-boog",
  "drie-machines",
  "de-dubbele-trap",
  "de-eerste-as",
  "de-versnelling",
  "de-verdeelas",
  "de-sluis",
] as const;

const INTRODUCES = [
  "first-mesh",
  "parity",
  "open-belt",
  "chain",
  "crossed-belt",
  "detour",
  "limited-tray",
  "reverse-motor",
  "size",
  "speed-gauge",
  "belt-ratio",
  "two-ratios",
  "generator",
  "lift",
  "split",
  "two-speeds",
  "double-chain",
  "chain-mesh",
  "factory",
  "mixed-split",
  "opposite-directions",
  "mesh-and-chain",
  "diagonal-train",
  "three-outputs",
  "finale",
  "three-gear-train",
  "gear-arch",
  "chain-and-gear-split",
  "four-gear-split",
  "rigid-axle",
  "axle-overdrive",
  "axle-split",
  "output-through",
] as const;

const BELT_TO_FAR_TARGET = link("open-belt", [0, 2], [9, 2]);

describe("gear levels: catalogue", () => {
  it("holds thirty-three levels in the brief's order", () => {
    const levels = allLevels();

    expect(LEVEL_COUNT).toBe(33);
    expect(levels).toHaveLength(33);
    expect(levels.map((level) => level.id)).toEqual([...LEVEL_IDS]);
    expect(levels.map((level) => level.introduces)).toEqual([...INTRODUCES]);
    expect(levels.map((level) => level.chapter)).toEqual([
      1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8,
      8, 8,
    ]);
    levels.forEach((level, index) => {
      expect(levelAt(index)).toBe(level);
    });
  });

  it("gives every level a unique id and a unique new ingredient", () => {
    const levels = allLevels();
    const ids = levels.map((level) => level.id);
    const introduces = levels.map((level) => level.introduces);

    expect(new Set(ids).size).toBe(levels.length);
    expect(new Set(introduces).size).toBe(levels.length);
    for (const level of levels) {
      expect(level.id.length).toBeGreaterThan(0);
      expect(level.introduces.length).toBeGreaterThan(0);
      expect(level.intro.length).toBeGreaterThan(0);
    }
  });

  it("validates and solves every level", () => {
    for (const level of allLevels()) {
      const errors = validateLevel(level);
      expect(errors, level.id).toEqual([]);
      expect(evaluate(level, level.solution), level.id).toBe("solved");
    }
  });

  it("throws past the last level", () => {
    expect(() => levelAt(LEVEL_COUNT)).toThrow("Unknown Draaiwerk level");
    expect(() => levelAt(-1)).toThrow("Unknown Draaiwerk level");
  });
});

describe("gear levels: direction and speed", () => {
  it("turns the level 1 target with the motor", () => {
    expect(outputAt(levelAt(0))).toMatchObject({
      kind: "target",
      satisfied: true,
      speed: 1,
      direction: 1,
    });
  });

  it("turns the level 2 target against the motor", () => {
    expect(outputAt(levelAt(1))).toMatchObject({
      kind: "target",
      satisfied: true,
      speed: -1,
      direction: -1,
    });
  });

  it("lets the big-gear shortcut in level 7 turn the wrong way", () => {
    const level = levelAt(6);
    const shortcut = drive(level, [gear(3, 2, 2)]);

    expect(canPlace(level, [], gear(3, 2, 2))).toBe(true);
    expect(shortcut.outputs[0]?.direction).toBe(1);
    expect(evaluate(level, [gear(3, 2, 2)])).toBe("playing");
    expect(evaluate(level, [gear(2, 2, 1), gear(4, 2, 1)])).toBe("solved");
  });

  it("fails level 8 with one big gear and solves it with two idlers", () => {
    const level = levelAt(7);
    const shortcut = drive(level, [gear(3, 2, 2)]);

    expect(shortcut.outputs[0]?.speed).toBeCloseTo(-1, 6);
    expect(evaluate(level, [gear(3, 2, 2)])).toBe("playing");
    expect(evaluate(level, [gear(2, 2, 1)])).toBe("playing");
    expect(evaluate(level, [gear(2, 2, 1), gear(4, 2, 1)])).toBe("solved");
  });

  it("turns the level 9 target at half speed through a small gear", () => {
    const level = levelAt(8);

    expect(level.solution).toEqual([gear(2, 2, 1)]);
    expect(level.outputs[0]?.size).toBe(2);
    expect(outputAt(level)).toMatchObject({ satisfied: true, direction: 1 });
    expect(outputAt(level).speed).toBeCloseTo(0.5, 6);
  });
});

describe("gear levels: speed bands", () => {
  it("lets level 10 be solved by the belt and not by a gear", () => {
    const level = levelAt(9);

    expect(level.solution).toEqual([BELT_TO_FAR_TARGET]);
    expect(evaluate(level, level.solution)).toBe("solved");
    expect(evaluate(level, [gear(2, 2, 2)])).toBe("playing");
  });

  it("slows the level 11 target with a big pulley", () => {
    const level = levelAt(10);

    expect(level.solution).toEqual([link("open-belt", [0, 2], [6, 2])]);
    expect(outputAt(level)).toMatchObject({ satisfied: true, direction: 1 });
    expect(outputAt(level).speed).toBeCloseTo(0.5, 6);
  });

  it("laat de gekruiste ketting op level 10 en 11 de verkeerde kant op draaien", () => {
    for (const level of [levelAt(9), levelAt(10)]) {
      const holeId = level.outputs[0]?.holeId ?? "9,2";
      const [col, row] = holeId.split(",").map(Number);
      const crossed = link("crossed-belt", [0, 2], [col as number, row as number]);
      expect(canPlace(level, [], crossed), level.id).toBe(true);
      expect(drive(level, [crossed]).outputs[0]?.direction, level.id).toBe(-1);
      expect(evaluate(level, [crossed]), level.id).toBe("playing");
    }
  });

  it("gives level 12 two different speeds from one motor", () => {
    const level = levelAt(11);
    const result = drive(level, level.solution);

    expect(result.outputs.map((output) => output.kind)).toEqual(["target", "target"]);
    expect(result.outputs.map((output) => output.satisfied)).toEqual([true, true]);
    expect(result.outputs[0]?.speed).toBeCloseTo(1, 6);
    expect(result.outputs[1]?.speed).toBeCloseTo(0.5, 6);
    expect(evaluate(level, level.solution)).toBe("solved");
  });

  it("lights the level 13 lamp with the belt, not with a gear", () => {
    const level = levelAt(12);

    expect(level.solution).toEqual([BELT_TO_FAR_TARGET]);
    expect(outputAt(level)).toMatchObject({ kind: "generator", satisfied: true, speed: 1 });
    expect(evaluate(level, [gear(2, 2, 1)])).toBe("playing");
  });

  it("moves the level 14 lift only with the long chain", () => {
    const level = levelAt(13);
    const chain = link("open-belt", [0, 2], [6, 2]);

    expect(level.solution).toEqual([chain]);
    expect(outputAt(level)).toMatchObject({ kind: "lift", satisfied: true });
    expect(outputAt(level).speed).toBeCloseTo(1 / 3, 6);

    expect(canPlace(level, [], chain)).toBe(true);
    expect(evaluate(level, [gear(2, 2, 2)])).toBe("playing");
    expect(evaluate(level, [chain])).toBe("solved");
  });
});

describe("gear levels: two outputs", () => {
  it("drives both level 15 targets the same way", () => {
    const level = levelAt(14);
    const result = drive(level, level.solution);

    expect(level.outputs).toHaveLength(2);
    expect(result.outputs.map((output) => output.kind)).toEqual(["target", "target"]);
    expect(result.outputs.map((output) => output.satisfied)).toEqual([true, true]);
    expect(result.outputs.map((output) => output.direction)).toEqual([-1, -1]);
    for (const output of result.outputs) {
      expect(output.speed).toBeCloseTo(-1, 6);
    }
    expect(evaluate(level, level.solution)).toBe("solved");
  });

  it("drives the level 16 lamp fast and the lift slowly", () => {
    const level = levelAt(15);
    const result = drive(level, level.solution);

    expect(level.outputs.map((output) => output.kind)).toEqual(["generator", "lift"]);
    expect(result.outputs.map((output) => output.satisfied)).toEqual([true, true]);
    expect(result.outputs[0]?.speed).toBeCloseTo(1, 6);
    expect(result.outputs[1]?.speed).toBeCloseTo(1 / 3, 6);
    expect(evaluate(level, level.solution)).toBe("solved");
  });

  it("keeps level 16 unsolved when only the lamp branch is built", () => {
    const level = levelAt(15);

    expect(evaluate(level, [gear(3, 3, 1)])).toBe("playing");
    expect(drive(level, [gear(3, 3, 1)]).outputs.map((output) => output.satisfied)).toEqual([
      true,
      false,
    ]);
  });
});

describe("gear levels: chapter 5", () => {
  it("turns both level 17 targets with two chains", () => {
    const level = levelAt(16);
    const result = drive(level, level.solution);

    expect(result.outputs.map((output) => output.satisfied)).toEqual([true, true]);
    expect(result.outputs.map((output) => output.direction)).toEqual([1, -1]);
    expect(evaluate(level, level.solution)).toBe("solved");
    expect(evaluate(level, [link("open-belt", [4, 2], [8, 2])])).toBe("playing");
  });

  it("brings level 18 to the target through a chain and a gear", () => {
    const level = levelAt(17);
    const result = drive(level, level.solution);

    expect(level.solution).toEqual([gear(5, 2, 1), link("chain", [0, 2], [5, 2])]);
    expect(result.outputs[0]).toMatchObject({ satisfied: true, direction: -1 });
    expect(result.outputs[0]?.speed).toBeCloseTo(-1, 6);
    expect(evaluate(level, level.solution)).toBe("solved");
    expect(evaluate(level, [link("chain", [0, 2], [7, 2])])).toBe("playing");
  });

  it("runs the level 19 lamp fast and the lift slowly with two chains", () => {
    const level = levelAt(18);
    const result = drive(level, level.solution);

    expect(level.outputs.map((output) => output.kind)).toEqual(["generator", "lift"]);
    expect(result.outputs.map((output) => output.satisfied)).toEqual([true, true]);
    expect(result.outputs[0]?.speed).toBeCloseTo(1, 6);
    expect(result.outputs[1]?.speed).toBeCloseTo(1 / 3, 6);
    expect(evaluate(level, level.solution)).toBe("solved");
  });

  it("verdeelt level 20 met een tandwiel voor de lamp en een ketting voor de lift", () => {
    const level = levelAt(19);
    const result = drive(level, level.solution);

    expect(level.solution).toEqual([gear(3, 3, 1), link("chain", [5, 3], [10, 3])]);
    expect(level.outputs.map((output) => output.kind)).toEqual(["generator", "lift"]);
    expect(result.outputs.map((output) => output.satisfied)).toEqual([true, true]);
    expect(result.outputs[0]?.speed).toBeCloseTo(1, 6);
    expect(result.outputs[1]?.speed).toBeCloseTo(0.5, 6);
    expect(evaluate(level, level.solution)).toBe("solved");
  });
});

describe("gear levels: chapter 6", () => {
  it("draait level 21 twee grote doelen tegen elkaar in", () => {
    const level = levelAt(20);
    const result = drive(level, level.solution);

    expect(result.outputs.map((output) => output.satisfied)).toEqual([true, true]);
    expect(result.outputs.map((output) => output.direction)).toEqual([1, -1]);
    for (const output of result.outputs) {
      expect(Math.abs(output.speed)).toBeCloseTo(0.5, 6);
    }
    expect(evaluate(level, level.solution)).toBe("solved");
    // Een open ketting naar rechts geeft de verkeerde richting.
    expect(
      evaluate(level, [link("open-belt", [4, 2], [9, 2]), link("open-belt", [4, 2], [0, 2])]),
    ).toBe("playing");
  });

  it("keert en vertraagt level 22 met een tandwiel en een ketting", () => {
    const level = levelAt(21);

    expect(level.solution).toEqual([gear(2, 2, 1), link("chain", [2, 2], [6, 2])]);
    expect(outputAt(level)).toMatchObject({ satisfied: true, direction: -1 });
    expect(outputAt(level).speed).toBeCloseTo(-0.5, 6);
    // Zonder keerwiel geeft de ketting de verkeerde richting.
    expect(evaluate(level, [link("chain", [0, 2], [6, 2])])).toBe("playing");
  });

  it("vindt de diagonale tandwielroute in level 23", () => {
    const level = levelAt(22);

    expect(level.solution).toEqual([gear(3, 0, 2), gear(7, 3, 3)]);
    expect(outputAt(level)).toMatchObject({ satisfied: true, direction: -1 });
    expect(outputAt(level).speed).toBeCloseTo(-0.5, 6);
    expect(evaluate(level, level.solution)).toBe("solved");
  });

  it("bedient level 24 met drie kettingen", () => {
    const level = levelAt(23);
    const result = drive(level, level.solution);

    expect(level.outputs.map((output) => output.kind)).toEqual(["generator", "lift", "target"]);
    expect(result.outputs.map((output) => output.satisfied)).toEqual([true, true, true]);
    expect(result.outputs[0]?.speed).toBeCloseTo(1, 6);
    expect(result.outputs[1]?.speed).toBeCloseTo(0.5, 6);
    expect(result.outputs[2]?.direction).toBe(-1);
    expect(evaluate(level, level.solution)).toBe("solved");
  });

  it("bouwt level 25 met een ketting, een gekruiste ketting en een tandwiel", () => {
    const level = levelAt(24);
    const result = drive(level, level.solution);

    expect(level.solution).toEqual([
      link("chain", [4, 5], [0, 5]),
      link("crossed-belt", [4, 5], [1, 0]),
      gear(6, 5, 1),
    ]);
    expect(result.outputs.map((output) => output.satisfied)).toEqual([true, true, true]);
    expect(result.outputs[0]?.speed).toBeCloseTo(1, 6);
    expect(result.outputs[1]?.direction).toBe(-1);
    expect(result.outputs[2]?.speed).toBeCloseTo(1 / 3, 6);
    expect(evaluate(level, level.solution)).toBe("solved");
  });
});

describe("gear levels: chapter 7", () => {
  it("klimt level 26 met drie tandwielen schuin omhoog", () => {
    const level = levelAt(25);

    expect(level.solution).toEqual([gear(3, 0, 2), gear(6, 4, 3), gear(9, 8, 2)]);
    expect(outputAt(level)).toMatchObject({ satisfied: true, direction: 1 });
    expect(outputAt(level).speed).toBeCloseTo(1, 6);
    expect(evaluate(level, level.solution)).toBe("solved");
  });

  it("laat level 27 in een boog over het geblokkeerde gat gaan", () => {
    const level = levelAt(26);

    expect(level.solution).toEqual([gear(0, 1, 2), gear(4, 1, 2), gear(8, 1, 2)]);
    expect(level.blockedHoleIds).toEqual([hole(4, 4)]);
    expect(outputAt(level)).toMatchObject({ satisfied: true, direction: 1 });
    expect(outputAt(level).speed).toBeCloseTo(1, 6);
    expect(evaluate(level, level.solution)).toBe("solved");
  });

  it("bouwt level 28 met twee kettingen en een tandwiel", () => {
    const level = levelAt(27);
    const result = drive(level, level.solution);

    expect(level.solution).toEqual([
      link("chain", [4, 4], [0, 4]),
      link("chain", [4, 4], [8, 4]),
      gear(4, 2, 1),
    ]);
    expect(result.outputs.map((output) => output.satisfied)).toEqual([true, true, true]);
    expect(result.outputs.map((output) => output.direction)).toEqual([1, 1, 1]);
    expect(result.outputs[2]?.speed).toBeCloseTo(1, 6);
    expect(evaluate(level, level.solution)).toBe("solved");
  });

  it("bouwt level 29 met twee tandwieltreinen", () => {
    const level = levelAt(28);
    const result = drive(level, level.solution);

    expect(level.solution).toEqual([gear(2, 0, 1), gear(5, 0, 2), gear(0, 2, 1), gear(0, 5, 2)]);
    expect(result.outputs.map((output) => output.satisfied)).toEqual([true, true]);
    expect(result.outputs.map((output) => output.direction)).toEqual([-1, -1]);
    for (const output of result.outputs) {
      expect(output.speed).toBeCloseTo(-1, 6);
    }
    expect(evaluate(level, level.solution)).toBe("solved");
  });

  it("eist voor ieder nieuw level minstens drie plaatsingen", () => {
    for (const level of allLevels().filter((candidate) => candidate.chapter === 7)) {
      expect(level.solution.length, level.id).toBeGreaterThanOrEqual(3);
      expect(evaluate(level, level.solution), level.id).toBe("solved");
      expect(hasSolutionWithin(level, 2), level.id).toBe(false);
    }
  });
});

describe("gear levels: chapter 8", () => {
  it("laat level 30 via een as op een derde snelheid draaien", () => {
    const level = levelAt(29);

    expect(level.solution).toEqual([gear(4, 3, 3), gear(8, 6, 1), axle([4, 3], [8, 6])]);
    expect(outputAt(level)).toMatchObject({ satisfied: true, direction: 1 });
    expect(outputAt(level).speed).toBeCloseTo(1 / 3, 6);
    expect(evaluate(level, level.solution)).toBe("solved");
  });

  it("laat level 31 via een as drie keer zo snel draaien", () => {
    const level = levelAt(30);

    expect(level.solution).toEqual([gear(2, 3, 1), gear(7, 3, 3), axle([2, 3], [7, 3])]);
    expect(outputAt(level)).toMatchObject({ satisfied: true, direction: 1 });
    expect(outputAt(level).speed).toBeCloseTo(3, 6);
    expect(evaluate(level, level.solution)).toBe("solved");
  });

  it("splitst level 32 in een snelle en een trage tak", () => {
    const level = levelAt(31);
    const result = drive(level, level.solution);

    expect(level.solution).toEqual([gear(4, 4, 3), gear(8, 7, 1), axle([4, 4], [8, 7])]);
    expect(result.outputs.map((output) => output.satisfied)).toEqual([true, true]);
    expect(result.outputs[0]?.speed).toBeCloseTo(1, 6);
    expect(result.outputs[1]?.speed).toBeCloseTo(1 / 3, 6);
    expect(evaluate(level, level.solution)).toBe("solved");
  });

  it("stuurt level 33 door het eerste doel heen", () => {
    const level = levelAt(32);
    const result = drive(level, level.solution);

    expect(level.solution).toEqual([
      gear(2, 4, 1),
      gear(5, 4, 2),
      gear(11, 4, 1),
      axle([8, 4], [11, 4]),
    ]);
    expect(level.holes).toHaveLength(90);
    expect(result.outputs.map((output) => output.satisfied)).toEqual([true, true]);
    expect(result.outputs[0]?.speed).toBeCloseTo(-1, 6);
    expect(result.outputs[1]?.speed).toBeCloseTo(0.5, 6);
    expect(evaluate(level, level.solution)).toBe("solved");
  });

  it("eist ook in hoofdstuk 8 minstens drie plaatsingen", () => {
    for (const level of allLevels().filter((candidate) => candidate.chapter === 8)) {
      expect(level.solution.length, level.id).toBeGreaterThanOrEqual(3);
      expect(evaluate(level, level.solution), level.id).toBe("solved");
      expect(hasSolutionWithin(level, 2), level.id).toBe(false);
    }
  });
});
