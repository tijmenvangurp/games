import type { ElementId } from "./types";

export interface Mission {
  id: string;
  title: string;
  target: ElementId;
  set: 1 | 2 | 3;
}

/**
 * A gentle ladder from the first mixes to the late-game discoveries. The
 * targets are ordered by recipe depth; tests enforce that order so a child
 * never gets a mission that needs an element they cannot reach yet.
 */
export const MISSIONS: readonly Mission[] = [
  { id: "mud", title: "Maak modder.", target: "mud", set: 1 },
  { id: "steam", title: "Maak stoom.", target: "steam", set: 1 },
  { id: "rain", title: "Laat het regenen.", target: "rain", set: 1 },
  { id: "plant", title: "Maak een plant.", target: "plant", set: 1 },
  { id: "cloud", title: "Maak een wolk.", target: "cloud", set: 1 },
  { id: "rainbow", title: "Maak een regenboog.", target: "rainbow", set: 1 },
  { id: "snow", title: "Maak sneeuw.", target: "snow", set: 1 },
  { id: "human", title: "Maak een mens.", target: "human", set: 1 },
  { id: "rocket", title: "Bouw een raket.", target: "rocket", set: 1 },
  { id: "house", title: "Bouw een huis.", target: "house", set: 1 },
  { id: "icecream", title: "Maak een ijsje.", target: "icecream", set: 2 },
  { id: "treasure", title: "Zoek de schat.", target: "treasure", set: 2 },
  { id: "telescope", title: "Maak een telescoop.", target: "telescope", set: 2 },
  { id: "penguin", title: "Maak een pinguïn.", target: "penguin", set: 2 },
  { id: "planet", title: "Maak een planeet.", target: "planet", set: 2 },
  { id: "farm", title: "Bouw een boerderij.", target: "farm", set: 2 },
  { id: "bread", title: "Bak een brood.", target: "bread", set: 2 },
  { id: "village", title: "Bouw een dorp.", target: "village", set: 2 },
  { id: "castle", title: "Bouw een kasteel.", target: "castle", set: 2 },
  { id: "mill", title: "Bouw een molen.", target: "mill", set: 2 },
  { id: "bicycle", title: "Maak een fiets.", target: "bicycle", set: 3 },
  { id: "city", title: "Bouw een stad.", target: "city", set: 3 },
  { id: "cake", title: "Maak een taart.", target: "cake", set: 3 },
  { id: "book", title: "Maak een boek.", target: "book", set: 3 },
  { id: "train", title: "Maak een trein.", target: "train", set: 3 },
  { id: "honey", title: "Maak honing.", target: "honey", set: 3 },
  { id: "cheese", title: "Maak kaas.", target: "cheese", set: 3 },
  { id: "huisdier", title: "Zoek een huisdier.", target: "dog", set: 3 },
  { id: "whale", title: "Maak een walvis.", target: "whale", set: 3 },
  { id: "unicorn", title: "Maak een eenhoorn.", target: "unicorn", set: 3 },
];

export function missionById(id: string | null | undefined): Mission | undefined {
  return id ? MISSIONS.find((mission) => mission.id === id) : undefined;
}

export function isMissionDone(discovered: readonly ElementId[], mission: Mission): boolean {
  return discovered.includes(mission.target);
}

export function completedMissionCount(discovered: readonly ElementId[]): number {
  return MISSIONS.filter((mission) => isMissionDone(discovered, mission)).length;
}

export function firstIncompleteMission(discovered: readonly ElementId[]): Mission | null {
  return MISSIONS.find((mission) => !isMissionDone(discovered, mission)) ?? null;
}

export function nextMission(
  discovered: readonly ElementId[],
  currentId?: string | null,
): Mission | null {
  const index = currentId ? MISSIONS.findIndex((mission) => mission.id === currentId) : -1;
  const start = index >= 0 ? index + 1 : 0;

  for (let offset = 0; offset < MISSIONS.length; offset += 1) {
    const mission = MISSIONS[(start + offset) % MISSIONS.length];
    if (mission && !isMissionDone(discovered, mission)) {
      return mission;
    }
  }

  return null;
}
