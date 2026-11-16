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
] as const;

const BELT_TO_FAR_TARGET = link("open-belt", [0, 2], [9, 2]);

describe("gear levels: catalogue", () => {
  it("holds nineteen levels in the brief's order", () => {
    const levels = allLevels();

    expect(LEVEL_COUNT).toBe(19);
    expect(levels).toHaveLength(19);
    expect(levels.map((level) => level.id)).toEqual([...LEVEL_IDS]);
    expect(levels.map((level) => level.introduces)).toEqual([...INTRODUCES]);
    expect(levels.map((level) => level.chapter)).toEqual([
      1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5,
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
});
