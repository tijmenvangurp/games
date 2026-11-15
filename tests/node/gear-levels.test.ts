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

function worm(
  from: readonly [number, number],
  to: readonly [number, number],
  ratio = 0.5,
  direction: 1 | -1 = -1,
): Placement {
  return {
    kind: "worm",
    fromHoleId: hole(from[0], from[1]),
    toHoleId: hole(to[0], to[1]),
    ratio,
    direction,
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
  "wormas-traag",
  "wormas-sterk",
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
  "worm-as",
  "worm-as-strong",
  "speed-gauge",
  "generator",
  "lift",
  "split",
  "two-speeds",
] as const;

const BELT_TO_FAR_TARGET = link("open-belt", [0, 2], [9, 2]);
const WORM_SLOW = worm([0, 2], [4, 2], 0.5, -1);
const WORM_STRONG = worm([0, 2], [4, 2], 0.25, -1);
const WORM_METER = worm([0, 2], [9, 2], 0.5, 1);
const WORM_LIFT = worm([0, 2], [4, 2], 0.25, 1);

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

  it("slows the target through the worm shaft (level 10)", () => {
    const level = levelAt(9);
    expect(level.solution).toEqual([WORM_SLOW]);
    expect(outputAt(level)).toMatchObject({ satisfied: true, direction: -1 });
    expect(outputAt(level).speed).toBeCloseTo(-0.5, 6);
  });

  it("uses a stronger worm reduction on level 11", () => {
    const level = levelAt(10);
    expect(level.solution).toEqual([WORM_STRONG]);
    expect(outputAt(level)).toMatchObject({ satisfied: true, direction: -1 });
    expect(outputAt(level).speed).toBeCloseTo(-0.25, 6);
  });
});

describe("gear levels: speed bands", () => {
  it("lets level 12 be solved by the belt and not by the worm", () => {
    const level = levelAt(11);

    expect(level.solution).toEqual([BELT_TO_FAR_TARGET]);
    expect(evaluate(level, level.solution)).toBe("solved");

    for (const alternative of [WORM_METER]) {
      expect(canPlace(level, [], alternative)).toBe(true);
      expect(evaluate(level, [alternative])).toBe("playing");
    }
    expect(drive(level, [WORM_METER]).outputs[0]?.speed).toBeCloseTo(0.5, 6);
  });

  it("lights the level 13 lamp with the belt, not with the worm", () => {
    const level = levelAt(12);

    expect(level.solution).toEqual([BELT_TO_FAR_TARGET]);
    expect(outputAt(level)).toMatchObject({ kind: "generator", satisfied: true, speed: 1 });

    for (const alternative of [WORM_METER]) {
      expect(canPlace(level, [], alternative)).toBe(true);
      expect(evaluate(level, [alternative])).toBe("playing");
    }
    expect(drive(level, [WORM_METER]).outputs[0]?.speed).toBeCloseTo(0.5, 6);
  });

  it("moves the level 14 lift only with the slow worm", () => {
    const level = levelAt(13);

    expect(level.solution).toEqual([WORM_LIFT]);
    expect(outputAt(level)).toMatchObject({ kind: "lift", satisfied: true });
    expect(outputAt(level).speed).toBeCloseTo(0.25, 6);

    expect(canPlace(level, [], { kind: "open-belt", fromHoleId: "0,2", toHoleId: "4,2" })).toBe(
      true,
    );
    expect(evaluate(level, [{ kind: "open-belt", fromHoleId: "0,2", toHoleId: "4,2" }])).toBe(
      "playing",
    );
    expect(evaluate(level, [WORM_LIFT])).toBe("solved");
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
    expect(result.outputs[1]?.speed).toBeCloseTo(0.5, 6);
    expect(evaluate(level, level.solution)).toBe("solved");
  });

  it("keeps level 16 unsolved when only the fast branch is built", () => {
    const level = levelAt(15);
    const fastBranch = [gear(2, 4, 1), gear(2, 6, 1), link("open-belt", [2, 6], [11, 2])];

    expect(evaluate(level, fastBranch)).toBe("playing");
    expect(drive(level, fastBranch).outputs.map((output) => output.satisfied)).toEqual([
      true,
      false,
    ]);
  });
});
