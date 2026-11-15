import { describe, expect, it } from "vitest";
import {
  checkMurdokuLevel,
  findMurdokuMurderer,
  generateMurdokuLevel,
  loadMurdokuLevel,
  placementOf,
} from "@entities/murdoku";

describe("murdoku generator", () => {
  it("maakt met een vaste seed een unieke, logisch oplosbare 4×4-zaak", () => {
    const level = generateMurdokuLevel({
      width: 4,
      height: 4,
      suspects: 3,
      seed: 4242,
      themeId: "apartment",
    });

    expect(level.size).toEqual({ width: 4, height: 4 });
    expect(level.suspects).toHaveLength(3);

    const puzzle = loadMurdokuLevel(level);
    const check = checkMurdokuLevel(level);
    expect(check.unique).toBe(true);
    expect(check.solvable).toBe(true);

    const murderer = findMurdokuMurderer(puzzle, placementOf(check.solution!));
    expect(murderer.suspectId).not.toBeNull();
    expect(murderer.suspectsInRoom).toEqual([murderer.suspectId]);
  });

  it("is deterministisch voor dezelfde seed", () => {
    const options = { width: 4, height: 4, suspects: 3, seed: 7, themeId: "apartment" } as const;

    expect(generateMurdokuLevel(options)).toEqual(generateMurdokuLevel(options));
  });
});
