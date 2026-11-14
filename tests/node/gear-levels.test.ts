import { describe, expect, it } from "vitest";
import {
  allLevels,
  canPlace,
  drive,
  evaluate,
  LEVEL_COUNT,
  levelAt,
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

function lyingAs(
  from: readonly [number, number],
  to: readonly [number, number],
  sizeA: GearSize,
  sizeB: GearSize,
): Placement {
  return {
    kind: "lying-as",
    holeA: hole(from[0], from[1]),
    holeB: hole(to[0], to[1]),
    sizeA,
    sizeB,
  };
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

function outputAt(level: Level, index = 0): OutputPose {
  const output = drive(level, level.solution).outputs[index];
  if (!output) {
    throw new Error(`Level ${level.id} has no output at index ${index}`);
  }
  return output;
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
  "liggende-as-traag",
  "liggende-as-snel",
  "de-meter",
  "lamp-aan",
  "de-lift",
  "twee-kanten-op",
  "snel-en-langzaam",
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
  "lying-as-slow",
  "lying-as-fast",
  "speed-gauge",
  "generator",
  "lift",
  "split",
  "two-speeds",
] as const;

const BELT_TO_FAR_TARGET = link("open-belt", [0, 2], [9, 2]);
const SLOW_AXLE = lyingAs([3, 2], [7, 2], 2, 1);
const FAST_AXLE = lyingAs([2, 2], [6, 2], 1, 2);

describe("gear levels: catalogue", () => {
  it("holds sixteen levels in the brief's order", () => {
    const levels = allLevels();

    expect(LEVEL_COUNT).toBe(16);
    expect(levels).toHaveLength(16);
    expect(levels.map((level) => level.id)).toEqual([...LEVEL_IDS]);
    expect(levels.map((level) => level.introduces)).toEqual([...INTRODUCES]);
    expect(levels.map((level) => level.chapter)).toEqual([
      1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4,
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

  it("blocks the single big-gear shortcut in level 7", () => {
    const level = levelAt(6);

    expect(canPlace(level, [], gear(3, 2, 2))).toBe(false);
    expect(evaluate(level, [gear(3, 2, 2)])).not.toBe("solved");
  });

  it("fails level 8 with one big gear and solves it with two idlers", () => {
    const level = levelAt(7);
    const shortcut = drive(level, [gear(3, 2, 2)]);

    expect(shortcut.outputs[0]?.speed).toBeCloseTo(-1, 6);
    expect(evaluate(level, [gear(3, 2, 2)])).toBe("playing");
    expect(evaluate(level, [gear(2, 2, 1)])).toBe("playing");
    expect(evaluate(level, [gear(2, 2, 1), gear(4, 2, 1)])).toBe("solved");
  });

  it("halves the speed through the slow lying axle (level 10)", () => {
    const level = levelAt(9);
    expect(level.solution).toEqual([SLOW_AXLE]);
    expect(outputAt(level)).toMatchObject({ satisfied: true, direction: 1 });
    expect(outputAt(level).speed).toBeCloseTo(0.5, 6);
  });

  it("doubles the speed through the fast lying axle (level 11)", () => {
    const level = levelAt(10);
    expect(level.solution).toEqual([FAST_AXLE]);
    expect(outputAt(level)).toMatchObject({ satisfied: true, direction: 1 });
    expect(outputAt(level).speed).toBeCloseTo(2, 6);
  });
});

describe("gear levels: speed bands", () => {
  it("lets level 12 be solved by the belt and not by the lying axle", () => {
    const level = levelAt(11);

    expect(level.solution).toEqual([BELT_TO_FAR_TARGET]);
    expect(evaluate(level, level.solution)).toBe("solved");

    for (const axle of [SLOW_AXLE, FAST_AXLE]) {
      expect(canPlace(level, [], axle)).toBe(true);
      expect(evaluate(level, [axle])).toBe("playing");
    }
    expect(drive(level, [SLOW_AXLE]).outputs[0]?.speed).toBeCloseTo(0.5, 6);
    expect(drive(level, [FAST_AXLE]).outputs[0]?.speed).toBeCloseTo(2, 6);
  });

  it("lights the level 13 lamp only with the fast axle", () => {
    const level = levelAt(12);

    expect(level.solution).toEqual([FAST_AXLE]);
    expect(outputAt(level)).toMatchObject({ kind: "generator", satisfied: true });
    expect(outputAt(level).speed).toBeCloseTo(2, 6);

    for (const alternative of [BELT_TO_FAR_TARGET, SLOW_AXLE]) {
      expect(canPlace(level, [], alternative)).toBe(true);
      expect(evaluate(level, [alternative])).toBe("playing");
    }
    expect(evaluate(level, [FAST_AXLE])).toBe("solved");
  });

  it("moves the level 14 lift only with the slow axle", () => {
    const level = levelAt(13);

    expect(level.solution).toEqual([SLOW_AXLE]);
    expect(outputAt(level)).toMatchObject({ kind: "lift", satisfied: true });
    expect(outputAt(level).speed).toBeCloseTo(0.5, 6);

    for (const alternative of [BELT_TO_FAR_TARGET, FAST_AXLE]) {
      expect(canPlace(level, [], alternative)).toBe(true);
      expect(evaluate(level, [alternative])).toBe("playing");
    }
    expect(evaluate(level, [SLOW_AXLE])).toBe("solved");
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
    expect(result.outputs[0]?.speed).toBeCloseTo(2, 6);
    expect(result.outputs[1]?.speed).toBeCloseTo(0.5, 6);
    expect(evaluate(level, level.solution)).toBe("solved");
  });

  it("keeps level 16 unsolved when only the fast branch is built", () => {
    const level = levelAt(15);
    const fastBranch = [gear(2, 4, 1), gear(2, 2, 1), lyingAs([4, 2], [8, 2], 1, 2)];

    expect(evaluate(level, fastBranch)).toBe("playing");
    expect(drive(level, fastBranch).outputs.map((output) => output.satisfied)).toEqual([
      true,
      false,
    ]);
  });
});
