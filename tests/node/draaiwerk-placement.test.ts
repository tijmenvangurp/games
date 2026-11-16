import { describe, expect, it } from "vitest";
import { drive, levelAt, type Placement } from "@entities/gear";
import {
  formatSpeed,
  holesForPlacement,
  looseBeltTarget,
  occupiedHoleIds,
  outputName,
  rejectionFor,
  trayShortLabel,
} from "@features/draaiwerk";

const level = levelAt(2);

describe("draaiwerk placement", () => {
  it("reports a gear on a missing, blocked or occupied hole", () => {
    expect(rejectionFor(level, [], { kind: "gear", holeId: "9,9", size: 1 })).toBe(
      "Dat gat bestaat niet.",
    );
    expect(rejectionFor(level, [], { kind: "gear", holeId: level.motor.holeId, size: 1 })).toBe(
      "Hier zit al een tandwiel.",
    );
    expect(rejectionFor(level, [], { kind: "gear", holeId: "1,2", size: 1 })).toBe(
      "Dit tandwiel botst met een ander.",
    );
  });

  it("reports why a loose chain does not fit", () => {
    expect(rejectionFor(level, [], { kind: "loose-belt", holeId: "2,2", link: "open-belt" })).toBe(
      "Op dit gat zit nog geen tandwiel.",
    );
    expect(
      rejectionFor(level, [], {
        kind: "loose-belt",
        holeId: level.motor.holeId,
        link: "open-belt",
      }),
    ).toBe("Hier hangt al een ketting.");
  });

  it("reports why a chain does not fit", () => {
    expect(rejectionFor(level, [], { kind: "chain", fromHoleId: "2,2", toHoleId: "5,2" })).toBe(
      "Op dit gat zit nog geen tandwiel.",
    );
    expect(
      rejectionFor(level, [], {
        kind: "chain",
        fromHoleId: level.motor.holeId,
        toHoleId: level.motor.holeId,
      }),
    ).toBe("Kies twee verschillende tandwielen.");
    const placed: Placement = {
      kind: "chain",
      fromHoleId: level.motor.holeId,
      toHoleId: "5,2",
    };
    expect(
      rejectionFor(level, [placed], {
        kind: "open-belt",
        fromHoleId: level.motor.holeId,
        toHoleId: "5,2",
      }),
    ).toBe("Deze twee zijn al verbonden.");
  });

  it("collects the holes of every placement", () => {
    expect(holesForPlacement({ kind: "gear", holeId: "2,2", size: 1 })).toEqual(new Set(["2,2"]));
    expect(holesForPlacement({ kind: "loose-belt", holeId: "2,2", link: "chain" })).toEqual(
      new Set(["2,2"]),
    );
    expect(holesForPlacement({ kind: "chain", fromHoleId: "0,2", toHoleId: "5,2" })).toEqual(
      new Set(["0,2", "5,2"]),
    );
  });

  it("counts the motor, outputs and placed gears as occupied", () => {
    const occupied = occupiedHoleIds(level, [{ kind: "gear", holeId: "2,2", size: 1 }]);
    expect(occupied.has(level.motor.holeId)).toBe(true);
    expect(occupied.has("2,2")).toBe(true);
  });

  it("finds the nearest gear for a loose chain and snaps inside its rim", () => {
    const gears = drive(level, []).gears;
    const target = gears.find((gear) => gear.key === "output:target-1");
    if (!target) {
      throw new Error("Level 3 has no target");
    }

    const snapped = looseBeltTarget(level, [], gears, level.motor.holeId, "chain", target.center);
    expect(snapped?.pose.key).toBe("output:target-1");
    expect(snapped?.snapped).toBe(true);

    const far = looseBeltTarget(level, [], gears, level.motor.holeId, "chain", {
      x: target.center.x,
      y: target.center.y - 120,
    });
    expect(far?.snapped).toBe(false);
    expect(far?.pose.key).toBe("output:target-1");
  });

  it("returns null for a loose chain when there is no other gear", () => {
    const gears = drive(level, []).gears;
    const motor = gears.find((gear) => gear.key === "motor");
    if (!motor) {
      throw new Error("Level 3 has no motor");
    }
    expect(
      looseBeltTarget(level, [], [motor], level.motor.holeId, "chain", motor.center),
    ).toBeNull();
  });

  it("picks the nearest of multiple gears for a loose chain", () => {
    const other = levelAt(15);
    const gears = drive(other, []).gears;
    const generator = gears.find((gear) => gear.key === "output:generator-1");
    if (!generator) {
      throw new Error("Level 16 has no generator");
    }
    const target = looseBeltTarget(other, [], gears, other.motor.holeId, "chain", generator.center);
    expect(target?.pose.key).toBe("output:generator-1");
  });

  it("reports a blocked gear and a harmless free hole", () => {
    const blockedLevel = levelAt(5);
    const blocked = blockedLevel.blockedHoleIds[0];
    if (!blocked) {
      throw new Error("Level 6 has no blocked hole");
    }
    expect(rejectionFor(blockedLevel, [], { kind: "gear", holeId: blocked, size: 1 })).toBe(
      "Dit gat is geblokkeerd.",
    );
    expect(rejectionFor(level, [], { kind: "gear", holeId: "3,4", size: 1 })).toBe(
      "Dat past hier niet.",
    );
  });

  it("reports a chain that is too short for different gear sizes", () => {
    const close = {
      ...level,
      motor: { ...level.motor, size: 2 as const },
      outputs: level.outputs.map((output) => ({
        ...output,
        holeId: "1,2",
        size: 1 as const,
      })),
    };
    expect(
      rejectionFor(close, [], {
        kind: "chain",
        fromHoleId: close.motor.holeId,
        toHoleId: "1,2",
      }),
    ).toBe("De ketting past niet tussen deze wielen.");
  });

  it("formats labels, speeds and outputs", () => {
    expect(formatSpeed(1)).toBe("1");
    expect(formatSpeed(1.5)).toBe("1,5");
    expect(formatSpeed(1.25)).toBe("1,25");
    expect(outputName("target")).toBe("Doel");
    expect(outputName("lift")).toBe("Lift");
    expect(outputName("generator")).toBe("Lamp");
    expect(trayShortLabel({ id: "g1", kind: "gear", size: 1 })).toBe("Klein");
    expect(trayShortLabel({ id: "g2", kind: "gear", size: 2 })).toBe("Middel");
    expect(trayShortLabel({ id: "g3", kind: "gear", size: 3 })).toBe("Groot");
    expect(trayShortLabel({ id: "b1", kind: "belt" })).toBe("Ketting");
    expect(trayShortLabel({ id: "b2", kind: "belt", crossed: true })).toBe("Gekruist");
    expect(trayShortLabel({ id: "c1", kind: "chain" })).toBe("Ketting");
  });
});
