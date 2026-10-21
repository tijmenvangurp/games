import { describe, expect, it } from "vitest";
import {
  BASE_ELEMENT_IDS,
  ELEMENTS,
  MISSIONS,
  completedMissionCount,
  firstIncompleteMission,
  isMissionDone,
  missionById,
  nextMission,
  reachableElementIds,
  tierOf,
} from "@entities/alchemy";

const elementIds = new Set(ELEMENTS.map((element) => element.id));
const baseIds = new Set<string>(BASE_ELEMENT_IDS);

describe("mengelmoes missions", () => {
  it("has thirty ordered missions with unique ids and targets", () => {
    expect(MISSIONS).toHaveLength(30);
    expect(new Set(MISSIONS.map((mission) => mission.id)).size).toBe(MISSIONS.length);
    expect(new Set(MISSIONS.map((mission) => mission.target)).size).toBe(MISSIONS.length);
  });

  it("only targets existing, reachable, non-base elements", () => {
    const reachable = reachableElementIds();

    for (const mission of MISSIONS) {
      expect(elementIds.has(mission.target)).toBe(true);
      expect(baseIds.has(mission.target)).toBe(false);
      expect(reachable.has(mission.target)).toBe(true);
      expect(mission.title.endsWith(".")).toBe(true);
      expect([1, 2, 3]).toContain(mission.set);
    }
  });

  it("orders missions from shallow to deep recipes", () => {
    const tiers = MISSIONS.map((mission) => tierOf(mission.target));

    expect(tiers).toEqual([...tiers].sort((a, b) => a - b));
  });

  it("tracks completion from discoveries", () => {
    const first = firstIncompleteMission(BASE_ELEMENT_IDS);

    expect(first?.id).toBe("mud");
    expect(completedMissionCount(BASE_ELEMENT_IDS)).toBe(0);
    if (!first) {
      throw new Error("Expected a first mission");
    }
    expect(isMissionDone(BASE_ELEMENT_IDS, first)).toBe(false);
    expect(isMissionDone([...BASE_ELEMENT_IDS, "mud"], first)).toBe(true);
    expect(completedMissionCount([...BASE_ELEMENT_IDS, "mud", "steam"])).toBe(2);
    expect(missionById("mud")?.target).toBe("mud");
    expect(missionById("onzin")).toBeUndefined();
  });

  it("advances to the next incomplete mission", () => {
    expect(nextMission(BASE_ELEMENT_IDS, "mud")?.id).toBe("steam");
    expect(nextMission([...BASE_ELEMENT_IDS, "mud"], "mud")?.id).toBe("steam");
    expect(nextMission([...BASE_ELEMENT_IDS, "mud", "steam"], "steam")?.id).toBe("rain");
    expect(nextMission([...BASE_ELEMENT_IDS, "mud"], null)?.id).toBe("steam");
  });

  it("returns no mission when everything is done", () => {
    const everything = ELEMENTS.map((element) => element.id);

    expect(completedMissionCount(everything)).toBe(MISSIONS.length);
    expect(firstIncompleteMission(everything)).toBeNull();
    expect(nextMission(everything, "mud")).toBeNull();
  });
});
